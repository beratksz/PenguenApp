package com.digitalsignage;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ContentUpdateReceiver extends BroadcastReceiver {
    
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("com.digitalsignage.CONTENT_UPDATE".equals(intent.getAction())) {
            // Launch main activity to show updated content
            Intent mainIntent = new Intent(context, MainActivity.class);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                               Intent.FLAG_ACTIVITY_CLEAR_TOP |
                               Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(mainIntent);
        }
    }
}
