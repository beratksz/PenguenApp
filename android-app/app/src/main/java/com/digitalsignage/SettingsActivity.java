package com.digitalsignage;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

public class SettingsActivity extends Activity {
    
    private EditText serverUrlEdit;
    private SharedPreferences prefs;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        prefs = getSharedPreferences("DigitalSignagePrefs", Context.MODE_PRIVATE);
        
        // Create simple layout programmatically
        createLayout();
    }
    
    private void createLayout() {
        // Create layout elements programmatically
        android.widget.LinearLayout layout = new android.widget.LinearLayout(this);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.setPadding(50, 50, 50, 50);
        
        // Title
        android.widget.TextView title = new android.widget.TextView(this);
        title.setText("Digital Signage Settings");
        title.setTextSize(24);
        title.setPadding(0, 0, 0, 30);
        layout.addView(title);
        
        // Server URL label
        android.widget.TextView label = new android.widget.TextView(this);
        label.setText("Server URL:");
        label.setTextSize(16);
        label.setPadding(0, 20, 0, 10);
        layout.addView(label);
        
        // Server URL input
        serverUrlEdit = new EditText(this);
        String currentUrl = prefs.getString("server_url", getDefaultServerUrl()); // Updated for emulator
        serverUrlEdit.setText(currentUrl);
        serverUrlEdit.setTextSize(14);
        serverUrlEdit.setPadding(20, 20, 20, 20);
        layout.addView(serverUrlEdit);
        
        // Save button
        Button saveButton = new Button(this);
        saveButton.setText("Save Settings");
        saveButton.setTextSize(16);
        saveButton.setPadding(20, 20, 20, 20);
        saveButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                saveSettings();
            }
        });
        layout.addView(saveButton);
        
        // Close button
        Button closeButton = new Button(this);
        closeButton.setText("Close");
        closeButton.setTextSize(16);
        closeButton.setPadding(20, 20, 20, 20);
        closeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        layout.addView(closeButton);
        
        setContentView(layout);
    }
    
    private void saveSettings() {
        String serverUrl = serverUrlEdit.getText().toString().trim();
        
        if (serverUrl.isEmpty()) {
            Toast.makeText(this, "Please enter a valid server URL", Toast.LENGTH_SHORT).show();
            return;
        }
        
        // Save to preferences
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("server_url", serverUrl);
        editor.apply();
        
        Toast.makeText(this, "Settings saved! Restart app to apply changes.", Toast.LENGTH_LONG).show();
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
}
