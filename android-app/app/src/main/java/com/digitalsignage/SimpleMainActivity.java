package com.digitalsignage;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.Window;
import android.view.WindowManager;

public class SimpleMainActivity extends Activity {
    
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            // Simple fullscreen setup
            requestWindowFeature(Window.FEATURE_NO_TITLE);
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            );
            
            // Create WebView
            webView = new WebView(this);
            setContentView(webView);
            
            // Basic WebView settings
            WebSettings webSettings = webView.getSettings();
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setUseWideViewPort(true);
            
            // Set WebView client
            webView.setWebViewClient(new WebViewClient());
            
            // Load URL
            String url = "http://192.168.1.100:3000/android/display.html";
            webView.loadUrl(url);
            
        } catch (Exception e) {
            e.printStackTrace();
            finish();
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (webView != null) {
            webView.destroy();
        }
    }
}
