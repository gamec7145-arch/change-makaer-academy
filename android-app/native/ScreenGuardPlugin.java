package com.changemaker.academy;

import android.view.WindowManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenGuard")
public class ScreenGuardPlugin extends Plugin {

    @PluginMethod
    public void setSecure(final PluginCall call) {
        final boolean secure = call.getBoolean("secure", false);
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (secure) {
                    getActivity().getWindow().setFlags(
                        WindowManager.LayoutParams.FLAG_SECURE,
                        WindowManager.LayoutParams.FLAG_SECURE);
                } else {
                    getActivity().getWindow().clearFlags(
                        WindowManager.LayoutParams.FLAG_SECURE);
                }
                call.resolve();
            }
        });
    }
}
