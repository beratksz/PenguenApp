package com.digitalsignage;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Timer;
import java.util.TimerTask;

public class DigitalSignageService extends Service {
    
    private static final String CHANNEL_ID = "DigitalSignageChannel";
    private static final int NOTIFICATION_ID = 1;
    private SharedPreferences prefs;
    private Timer contentCheckTimer;
    private String lastContentId = "";
    private PowerManager.WakeLock wakeLock;
    
    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences("DigitalSignagePrefs", Context.MODE_PRIVATE);
        createNotificationChannel();
        setupWakeLock();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, createNotification());
        startContentMonitoring();
        return START_STICKY; // Restart if killed
    }
    
    private void setupWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "DigitalSignage::ServiceWakeLock"
        );
        wakeLock.acquire();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Digital Signage Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps digital signage running in background");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private Notification createNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Digital Signage Active")
            .setContentText("Display is running in background")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .build();
    }
    
    private void startContentMonitoring() {
        if (contentCheckTimer != null) {
            contentCheckTimer.cancel();
        }
        
        contentCheckTimer = new Timer();
        contentCheckTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                checkForContentUpdates();
            }
        }, 0, 2000); // Check every 2 seconds
    }
    
    private void checkForContentUpdates() {
        try {
            String serverUrl = prefs.getString("server_url", getDefaultServerUrl());
            String apiUrl = serverUrl.replace("/display", "") + "/api/content";
            
            URL url = new URL(apiUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.setRequestProperty("User-Agent", "DigitalSignageApp/1.0");
            
            int responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(connection.getInputStream())
                );
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();
                
                JSONObject content = new JSONObject(response.toString());
                String currentContentId = content.getString("id");
                
                // Check if content has changed
                if (!currentContentId.equals(lastContentId)) {
                    lastContentId = currentContentId;
                    notifyContentUpdate();
                    wakeUpDevice();
                }
            }
            connection.disconnect();
            
        } catch (Exception e) {
            e.printStackTrace();
            // Log error but continue monitoring
        }
    }
    
    private void notifyContentUpdate() {
        Intent updateIntent = new Intent("com.digitalsignage.CONTENT_UPDATE");
        sendBroadcast(updateIntent);
    }
    
    private void wakeUpDevice() {
        // Wake up the device
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock screenWakeLock = powerManager.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "DigitalSignage::ScreenWakeUp"
        );
        screenWakeLock.acquire(10000); // Hold for 10 seconds
        
        // Launch main activity to show content
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                       Intent.FLAG_ACTIVITY_CLEAR_TOP |
                       Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        
        // Release wake lock after a delay
        new Timer().schedule(new TimerTask() {
            @Override
            public void run() {
                if (screenWakeLock.isHeld()) {
                    screenWakeLock.release();
                }
            }
        }, 10000);
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
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (contentCheckTimer != null) {
            contentCheckTimer.cancel();
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        // Restart service
        Intent restartIntent = new Intent(this, DigitalSignageService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(restartIntent);
        } else {
            startService(restartIntent);
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
