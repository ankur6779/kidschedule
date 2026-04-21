package com.kidschedule.app

import android.app.Application
import com.google.android.material.color.DynamicColors

class KidScheduleApp : Application() {
    override fun onCreate() {
        super.onCreate()
        DynamicColors.applyToActivitiesIfAvailable(this)
    }
}
