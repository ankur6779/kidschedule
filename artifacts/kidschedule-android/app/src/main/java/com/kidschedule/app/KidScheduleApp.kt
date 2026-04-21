package com.kidschedule.app

import android.app.Application
import android.util.Log
import com.google.android.material.color.DynamicColors
import com.revenuecat.purchases.LogLevel
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration

class KidScheduleApp : Application() {
    override fun onCreate() {
        super.onCreate()
        DynamicColors.applyToActivitiesIfAvailable(this)

        // Initialize RevenueCat (Google Play Billing) only when an API key is
        // baked in at build time (-PrevenueCatApiKey=goog_xxx). Without a key
        // the WebView falls back to the existing web payment flow — useful
        // for local dev / debug builds.
        val key = BuildConfig.REVENUECAT_API_KEY
        if (key.isNotBlank()) {
            try {
                Purchases.logLevel = if (BuildConfig.DEBUG) LogLevel.DEBUG else LogLevel.WARN
                Purchases.configure(
                    PurchasesConfiguration.Builder(this, key).build()
                )
            } catch (t: Throwable) {
                Log.e("KidScheduleApp", "RevenueCat init failed", t)
            }
        } else {
            Log.w(
                "KidScheduleApp",
                "REVENUECAT_API_KEY is empty — Google Play Billing bridge disabled."
            )
        }
    }
}
