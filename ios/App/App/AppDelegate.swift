import UIKit
import Capacitor
import GoogleSignIn
import WebKit
import Photos

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, WKScriptMessageHandler {

    var window: UIWindow?
    private var webViewHandlersAdded = false
    private let launchWash = UIColor(red: 252.0 / 255.0, green: 228.0 / 255.0, blue: 236.0 / 255.0, alpha: 1)

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window?.backgroundColor = launchWash
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        installWebViewHandlers()
    }

    private func bridgeWebView() -> WKWebView? {
        guard let rootVC = UIApplication.shared.windows.first?.rootViewController else { return nil }
        let capVC = (rootVC as? CAPBridgeViewController) ?? (rootVC.children.first as? CAPBridgeViewController)
        return capVC?.webView
    }

    private var debugScriptAdded = false

    private func installWebViewHandlers() {
        guard !webViewHandlersAdded else { return }
        DispatchQueue.main.async {
            guard let webView = self.bridgeWebView() else { return }
            webView.isOpaque = false
            webView.backgroundColor = self.launchWash
            webView.scrollView.backgroundColor = self.launchWash
            webView.configuration.userContentController.add(self, name: "googleAuth")
            webView.configuration.userContentController.add(self, name: "saveImageToPhotos")
            #if DEBUG
            if !self.debugScriptAdded {
                let script = WKUserScript(
                    source: "window.__PFD_DEBUG__=true;",
                    injectionTime: .atDocumentStart,
                    forMainFrameOnly: true
                )
                webView.configuration.userContentController.addUserScript(script)
                self.debugScriptAdded = true
            }
            webView.evaluateJavaScript("window.__PFD_DEBUG__=true;window.dispatchEvent(new Event('pfd-debug'));", completionHandler: nil)
            #endif
            self.webViewHandlersAdded = true
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "saveImageToPhotos" {
            handleSaveImageToPhotos(message: message)
            return
        }
        guard message.name == "googleAuth" else { return }
        let action = (message.body as? [String: Any])?["action"] as? String ?? ""

        DispatchQueue.main.async {
            guard let webView = self.bridgeWebView() else { return }
            let capVC = (UIApplication.shared.windows.first?.rootViewController as? CAPBridgeViewController)
                ?? (UIApplication.shared.windows.first?.rootViewController?.children.first as? CAPBridgeViewController)

            if action == "signIn" {
                guard let presentingVC = capVC else {
                    webView.evaluateJavaScript("window._googleAuthReject&&window._googleAuthReject('No view controller')", completionHandler: nil)
                    return
                }
                let config = GIDConfiguration(clientID: "307906430534-08m095106pk9sl4057e60m2dp6r48sri.apps.googleusercontent.com")
                GIDSignIn.sharedInstance.configuration = config
                GIDSignIn.sharedInstance.signIn(withPresenting: presentingVC) { result, error in
                    if let error = error {
                        let nsError = error as NSError
                        if nsError.code == -5 {
                            webView.evaluateJavaScript("window._googleAuthReject&&window._googleAuthReject('CANCELED')", completionHandler: nil)
                        } else {
                            let msg = error.localizedDescription.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "'", with: "\\'")
                            webView.evaluateJavaScript("window._googleAuthReject&&window._googleAuthReject('\(msg)')", completionHandler: nil)
                        }
                        return
                    }
                    guard let user = result?.user, let idToken = user.idToken?.tokenString else {
                        webView.evaluateJavaScript("window._googleAuthReject&&window._googleAuthReject('Missing ID token')", completionHandler: nil)
                        return
                    }
                    let accessToken = user.accessToken.tokenString
                    webView.evaluateJavaScript("window._googleAuthResolve&&window._googleAuthResolve({idToken:'\(idToken)',accessToken:'\(accessToken)'})", completionHandler: nil)
                }
            } else if action == "signOut" {
                GIDSignIn.sharedInstance.signOut()
                webView.evaluateJavaScript("window._googleAuthSignOutResolve&&window._googleAuthSignOutResolve()", completionHandler: nil)
            }
        }
    }

    private func handleSaveImageToPhotos(message: WKScriptMessage) {
        DispatchQueue.main.async {
            guard let webView = self.bridgeWebView() else { return }
            guard let body = message.body as? [String: Any],
                  let base64 = body["base64"] as? String,
                  let data = Data(base64Encoded: base64),
                  let image = UIImage(data: data) else {
                webView.evaluateJavaScript("window._saveImageReject&&window._saveImageReject('INVALID_IMAGE')", completionHandler: nil)
                return
            }

            let performSave = {
                PHPhotoLibrary.shared().performChanges({
                    PHAssetChangeRequest.creationRequestForAsset(from: image)
                }) { success, error in
                    DispatchQueue.main.async {
                        if success {
                            webView.evaluateJavaScript("window._saveImageResolve&&window._saveImageResolve()", completionHandler: nil)
                        } else {
                            let msg = (error?.localizedDescription ?? "SAVE_FAILED")
                                .replacingOccurrences(of: "\\", with: "\\\\")
                                .replacingOccurrences(of: "'", with: "\\'")
                            webView.evaluateJavaScript("window._saveImageReject&&window._saveImageReject('\(msg)')", completionHandler: nil)
                        }
                    }
                }
            }

            if #available(iOS 14, *) {
                PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                    DispatchQueue.main.async {
                        switch status {
                        case .authorized, .limited:
                            performSave()
                        case .denied, .restricted:
                            webView.evaluateJavaScript("window._saveImageReject&&window._saveImageReject('PERMISSION_DENIED')", completionHandler: nil)
                        default:
                            webView.evaluateJavaScript("window._saveImageReject&&window._saveImageReject('PERMISSION_DENIED')", completionHandler: nil)
                        }
                    }
                }
            } else {
                PHPhotoLibrary.requestAuthorization { status in
                    DispatchQueue.main.async {
                        if status == .authorized {
                            performSave()
                        } else {
                            webView.evaluateJavaScript("window._saveImageReject&&window._saveImageReject('PERMISSION_DENIED')", completionHandler: nil)
                        }
                    }
                }
            }
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if GIDSignIn.sharedInstance.handle(url) {
            return true
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
