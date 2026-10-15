package com.zenith26.fest

import android.app.Application
import android.webkit.WebView

class ZenithApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Enable WebView debugging for dev builds
        WebView.setWebContentsDebuggingEnabled(true)
    }
}
