package com.zenith26.fest.bridge

import android.app.Activity
import android.content.Intent
import android.webkit.JavascriptInterface
import android.widget.Toast
import com.google.gson.JsonObject
import com.zenith26.fest.AdminActivity
import com.zenith26.fest.MainActivity
import com.zenith26.fest.api.HybridApiBridge
import com.zenith26.fest.api.NetworkConfig

/**
 * JavaScript Interface enabling two-way communication between the HTML/Tailwind frontend
 * and the native Android Kotlin runtime.
 */
class WebAppInterface(
    private val activity: Activity,
    private val hybridBridge: HybridApiBridge
) {

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun getPlatform(): String {
        return "Android-Kotlin"
    }

    @JavascriptInterface
    fun getApiBaseUrl(): String {
        return NetworkConfig.getBaseUrl(activity)
    }

    @JavascriptInterface
    fun openAdminDashboard() {
        activity.runOnUiThread {
            if (activity !is AdminActivity) {
                val intent = Intent(activity, AdminActivity::class.java)
                activity.startActivity(intent)
            }
        }
    }

    @JavascriptInterface
    fun openStudentPortal() {
        activity.runOnUiThread {
            if (activity !is MainActivity) {
                val intent = Intent(activity, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
                activity.startActivity(intent)
            }
        }
    }

    @JavascriptInterface
    fun postApi(path: String, payloadJson: String): String {
        val result = hybridBridge.handleLocalPost(path, payloadJson)
        val json = JsonObject().apply {
            addProperty("status", result.first)
            addProperty("body", result.second)
        }
        return json.toString()
    }
}
