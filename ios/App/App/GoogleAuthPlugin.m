#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(GoogleAuthPlugin, "GoogleAuthPlugin",
    CAP_PLUGIN_METHOD(signIn, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(signOut, CAPPluginReturnPromise);
)
