import UIKit
import Capacitor
import GoogleSignIn
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, WKScriptMessageHandler {

    var window: UIWindow?
    private var googleAuthHandlerAdded = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        installGoogleAuthHandler()
    }

    private func installGoogleAuthHandler() {
        guard !googleAuthHandlerAdded else { return }
        DispatchQueue.main.async {
            guard let rootVC = UIApplication.shared.windows.first?.rootViewController else { return }
            let capVC = (rootVC as? CAPBridgeViewController) ?? (rootVC.children.first as? CAPBridgeViewController)
            guard let webView = capVC?.webView else { return }
            webView.configuration.userContentController.add(self, name: "googleAuth")
            self.googleAuthHandlerAdded = true
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "googleAuth" else { return }
        let action = (message.body as? [String: Any])?["action"] as? String ?? ""

        DispatchQueue.main.async {
            guard let rootVC = UIApplication.shared.windows.first?.rootViewController else { return }
            let capVC = (rootVC as? CAPBridgeViewController) ?? (rootVC.children.first as? CAPBridgeViewController)
            let webView = capVC?.webView

            if action == "signIn" {
                guard let presentingVC = capVC else {
                    webView?.evaluateJavaScript("window._googleAuthReject&&window._googleAuthReject('No view controller')", completionHandler: nil)
                    return
                }
                let config = GIDConfiguration(clientID: "307906430534-08m095106pk9sl4057e60m2dp6r48sri.apps.googleusercontent.com")
                GIDSignIn.sharedInstance.configuration = config
                GIDSignIn.sharedInstance.signIn(withPresenting: presentingVC) { result, error in
                    if let error = error {
                        let nsError = error as NSError
                        if nsError.code == -5 {
                            webView?.evaluateJavaScript("window._googleAuthReject&&window._googleAuthReject('CANCELED')", completionHandler: nil)
                        } else {
                            let msg = error.localizedDescription.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "'", with: "\\'")
                            webView?.evaluateJavaScript("window._googleAuthReject&&window._googleAuthReject('\(msg)')", completionHandler: nil)
                        }
                        return
                    }
                    guard let user = result?.user, let idToken = user.idToken?.tokenString else {
                        webView?.evaluateJavaScript("window._googleAuthReject&&window._googleAuthReject('Missing ID token')", completionHandler: nil)
                        return
                    }
                    let accessToken = user.accessToken.tokenString
                    webView?.evaluateJavaScript("window._googleAuthResolve&&window._googleAuthResolve({idToken:'\(idToken)',accessToken:'\(accessToken)'})", completionHandler: nil)
                }
            } else if action == "signOut" {
                GIDSignIn.sharedInstance.signOut()
                webView?.evaluateJavaScript("window._googleAuthSignOutResolve&&window._googleAuthSignOutResolve()", completionHandler: nil)
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
