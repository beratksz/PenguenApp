package com.digitalsignage;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.List;

public class MainActivity extends Activity {
    
    private WebView webView;
    private PowerManager.WakeLock wakeLock;
    private SharedPreferences prefs;
    private ContentUpdateReceiver contentReceiver;
    private static final String PREFS_NAME = "DigitalSignagePrefs";
    private static final String KEY_SERVER_URL = "server_url";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize preferences
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        
        // Setup fullscreen kiosk mode
        setupKioskMode();
        
        // Setup wake lock
        setupWakeLock();
        
        // Setup WebView
        setupWebView();
        
        // Start background service
        startDigitalSignageService();
        
        // Register content update receiver
        registerContentReceiver();
        
        // Load the display page
        loadDisplayPage();
        
        // Request overlay permission if needed
        requestOverlayPermission();
    }
    
    private void setupKioskMode() {
        try {
            // Hide status bar and navigation bar
            requestWindowFeature(Window.FEATURE_NO_TITLE);
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN | 
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
                WindowManager.LayoutParams.FLAG_FULLSCREEN | 
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
            
            // Hide system UI for immersive experience
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                    View.SYSTEM_UI_FLAG_FULLSCREEN |
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Continue without kiosk mode if it fails
        }
    }
    
    private void setupWakeLock() {
        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "DigitalSignage::DisplayWakeLock"
                );
                if (!wakeLock.isHeld()) {
                    wakeLock.acquire(10 * 60 * 1000L); // 10 minutes timeout
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private void setupWebView() {
        webView = new WebView(this);
        setContentView(webView);
        
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        webSettings.setSupportZoom(false);
        webSettings.setDefaultTextEncodingName("utf-8");
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        // setAppCacheEnabled is deprecated in API 33+
        // webSettings.setAppCacheEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setGeolocationEnabled(false);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        webSettings.setLoadsImagesAutomatically(true);
        webSettings.setNeedInitialFocus(false);
        webSettings.setSaveFormData(false);
        webSettings.setSavePassword(false);
        webSettings.setSupportMultipleWindows(false);
        webSettings.setUserAgentString(webSettings.getUserAgentString() + " DigitalSignageApp/1.0");
        
        // Allow mixed content (HTTP images in HTTPS pages)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        
        // Add JavaScript interface for native communication
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Inject device information
                injectDeviceInfo();
            }
            
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                // Show error message and retry
                showError("Connection Error: " + description);
                // Retry after 5 seconds
                webView.postDelayed(() -> webView.reload(), 5000);
            }
        });
        
        webView.setWebChromeClient(new WebChromeClient());
        webView.setBackgroundColor(Color.BLACK);
    }
    
    private void loadDisplayPage() {
        String serverUrl = prefs.getString(KEY_SERVER_URL, getDefaultServerUrl());
        webView.loadUrl(serverUrl);
    }
    
    private void injectDeviceInfo() {
        String deviceInfo = getDeviceInfo();
        String script = String.format(
            "if (typeof window.setDeviceInfo === 'function') { " +
            "window.setDeviceInfo(%s); " +
            "}", deviceInfo
        );
        webView.evaluateJavascript(script, null);
    }
    
    private String getDeviceInfo() {
        String deviceName = Build.MODEL;
        String androidVersion = Build.VERSION.RELEASE;
        String ipAddress = getLocalIpAddress();
        
        return String.format(
            "{ \"name\": \"%s\", \"model\": \"Android %s\", \"ip\": \"%s\", \"userAgent\": \"DigitalSignageApp\" }",
            deviceName, androidVersion, ipAddress
        );
    }
    
    private String getLocalIpAddress() {
        try {
            List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
            for (NetworkInterface intf : interfaces) {
                List<InetAddress> addrs = Collections.list(intf.getInetAddresses());
                for (InetAddress addr : addrs) {
                    if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "Unknown";
    }
    
    private void startDigitalSignageService() {
        try {
            Intent serviceIntent = new Intent(this, DigitalSignageService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Service başlatma hatası, sadece WebView ile devam et
        }
    }
    
    private void registerContentReceiver() {
        try {
            contentReceiver = new ContentUpdateReceiver();
            IntentFilter filter = new IntentFilter("com.digitalsignage.CONTENT_UPDATE");
            
            // Android 13+ requires RECEIVER_EXPORTED flag
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(contentReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(contentReceiver, filter);
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Continue without receiver if registration fails
        }
    }
    
    private void requestOverlayPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(this)) {
                    // Don't automatically request overlay permission for now
                    // Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                    // startActivity(intent);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private void showError(String message) {
        runOnUiThread(() -> {
            // Inject error message into WebView
            String script = String.format(
                "if (document.getElementById('content')) { " +
                "document.getElementById('content').innerHTML = " +
                "'<div style=\"color: white; text-align: center; padding: 50px; font-size: 24px;\">%s</div>'; " +
                "}", message
            );
            webView.evaluateJavascript(script, null);
        });
    }
    
    // Check if running on emulator to use appropriate default URL
    private String getDefaultServerUrl() {
        // Check if running on emulator
        boolean isEmulator = Build.FINGERPRINT.startsWith("generic") ||
                Build.FINGERPRINT.startsWith("unknown") ||
                Build.MODEL.contains("google_sdk") ||
                Build.MODEL.contains("Emulator") ||
                Build.MODEL.contains("Android SDK built for x86") ||
                Build.MANUFACTURER.contains("Genymotion") ||
                (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"));
        
        if (isEmulator) {
            return "http://10.0.2.2:3001/display"; // Emulator uses 10.0.2.2 to reach host
        } else {
            return "http://192.168.1.4:3001/display"; // Real device uses actual network IP
        }
    }
    
    // Content update receiver
    private class ContentUpdateReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if ("com.digitalsignage.CONTENT_UPDATE".equals(intent.getAction())) {
                // Wake up screen and show content
                wakeUpScreen();
                
                // Reload WebView to get latest content
                runOnUiThread(() -> {
                    webView.reload();
                });
            }
        }
    }
    
    private void wakeUpScreen() {
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire();
        }
        
        // Turn screen on
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        );
    }
    
    // JavaScript interface for WebView
    public class WebAppInterface {
        Context context;
        
        WebAppInterface(Context c) {
            context = c;
        }
        
        @android.webkit.JavascriptInterface
        public void showToast(String toast) {
            Toast.makeText(context, toast, Toast.LENGTH_SHORT).show();
        }
        
        @android.webkit.JavascriptInterface
        public String getDeviceInfo() {
            return MainActivity.this.getDeviceInfo();
        }
        
        @android.webkit.JavascriptInterface
        public void openSettings() {
            Intent intent = new Intent(context, SettingsActivity.class);
            startActivity(intent);
        }
    }
    
    // Prevent back button from exiting the app
    @Override
    public void onBackPressed() {
        // Do nothing - kiosk mode
    }
    
    // Handle system UI visibility changes
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Only set system UI visibility, don't call requestWindowFeature again
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                    View.SYSTEM_UI_FLAG_FULLSCREEN |
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                );
            }
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire();
        }
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        // Keep running in background
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        if (contentReceiver != null) {
            unregisterReceiver(contentReceiver);
        }
    }
}
