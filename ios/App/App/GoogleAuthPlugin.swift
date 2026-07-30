import Foundation
import Capacitor
import GoogleSignIn

@objc(GoogleAuthPlugin)
public class GoogleAuthPlugin: CAPPlugin {

    private let clientID = "307906430534-9n80flh5vg71vmaul0vka3ng7pf07act.apps.googleusercontent.com"

    @objc func signIn(_ call: CAPPluginCall) {
        let config = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = config

        DispatchQueue.main.async {
            guard let vc = self.bridge?.viewController else {
                call.reject("No view controller")
                return
            }
            GIDSignIn.sharedInstance.signIn(withPresenting: vc) { result, error in
                if let error = error {
                    let nsError = error as NSError
                    if nsError.code == -5 { // GIDSignInError.canceled
                        call.reject("CANCELED")
                        return
                    }
                    call.reject(error.localizedDescription)
                    return
                }
                guard let user = result?.user,
                      let idToken = user.idToken?.tokenString else {
                    call.reject("Missing ID token")
                    return
                }
                call.resolve([
                    "idToken": idToken,
                    "accessToken": user.accessToken.tokenString,
                    "email": user.profile?.email ?? "",
                    "displayName": user.profile?.name ?? ""
                ])
            }
        }
    }

    @objc func signOut(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            GIDSignIn.sharedInstance.signOut()
            call.resolve()
        }
    }
}
