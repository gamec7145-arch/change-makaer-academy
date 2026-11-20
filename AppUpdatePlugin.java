package com.changemaker.academy;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    private static final String APK_NAME = "change-maker-academy-update.apk";

    private File apkFile() {
        File dir = new File(getContext().getCacheDir(), "updates");
        if (!dir.exists()) dir.mkdirs();
        return new File(dir, APK_NAME);
    }

    @PluginMethod
    public void getVersion(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager()
                .getPackageInfo(getContext().getPackageName(), 0);
            long code = Build.VERSION.SDK_INT >= 28
                ? info.getLongVersionCode()
                : info.versionCode;
            JSObject ret = new JSObject();
            ret.put("versionCode", code);
            ret.put("versionName", info.versionName);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Version read failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void download(final PluginCall call) {
        final String urlStr = call.getString("url");
        if (urlStr == null || urlStr.length() == 0) {
            call.reject("url missing");
            return;
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                try {
                    File out = apkFile();
                    File tmp = new File(out.getParentFile(), APK_NAME + ".part");
                    if (tmp.exists()) tmp.delete();

                    conn = (HttpURLConnection) new URL(urlStr).openConnection();
                    conn.setConnectTimeout(20000);
                    conn.setReadTimeout(30000);
                    conn.setUseCaches(false);
                    conn.connect();

                    if (conn.getResponseCode() != 200) {
                        call.reject("Server error: " + conn.getResponseCode());
                        return;
                    }

                    long total = conn.getContentLengthLong();
                    InputStream in = conn.getInputStream();
                    FileOutputStream fos = new FileOutputStream(tmp);
                    byte[] buf = new byte[16384];
                    long done = 0;
                    int lastPct = -1;
                    int n;
                    while ((n = in.read(buf)) != -1) {
                        fos.write(buf, 0, n);
                        done += n;
                        if (total > 0) {
                            int pct = (int) (done * 100 / total);
                            if (pct != lastPct) {
                                lastPct = pct;
                                JSObject p = new JSObject();
                                p.put("percent", pct);
                                notifyListeners("downloadProgress", p);
                            }
                        }
                    }
                    fos.flush();
                    fos.close();
                    in.close();

                    if (done < 500000) {
                        tmp.delete();
                        call.reject("Downloaded file is invalid");
                        return;
                    }
                    if (out.exists()) out.delete();
                    if (!tmp.renameTo(out)) {
                        call.reject("Could not save update file");
                        return;
                    }
                    call.resolve();
                } catch (Exception e) {
                    call.reject("Download failed: " + e.getMessage());
                } finally {
                    if (conn != null) conn.disconnect();
                }
            }
        }).start();
    }

    @PluginMethod
    public void install(PluginCall call) {
        try {
            File apk = apkFile();
            if (!apk.exists()) {
                call.reject("Update file not found");
                return;
            }

            if (Build.VERSION.SDK_INT >= 26
                && !getContext().getPackageManager().canRequestPackageInstalls()) {
                Intent s = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName()));
                s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(s);
                call.reject("permission");
                return;
            }

            Uri uri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                apk);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Install failed: " + e.getMessage());
        }
    }
}
