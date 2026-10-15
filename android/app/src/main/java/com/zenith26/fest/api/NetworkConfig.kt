package com.zenith26.fest.api

import android.content.Context
import android.content.SharedPreferences

/**
 * Manages the Base URL and network configuration for the Zenith '26 Android application.
 * Defaults to 10.0.2.2:8000 for standard Android Emulator, with persistent preference override.
 */
object NetworkConfig {
    private const val PREFS_NAME = "zenith26_network_prefs"
    private const val KEY_BASE_URL = "base_url"

    // Default development host for Android Emulator accessing host PC
    const val DEFAULT_EMULATOR_BASE_URL = "http://10.0.2.2:8081"
    const val DEFAULT_LOCALHOST_BASE_URL = "http://127.0.0.1:8081"

    fun getBaseUrl(context: Context): String {
        val prefs = getPrefs(context)
        val url = prefs.getString(KEY_BASE_URL, DEFAULT_EMULATOR_BASE_URL) ?: DEFAULT_EMULATOR_BASE_URL
        return sanitizeUrl(url)
    }

    fun setBaseUrl(context: Context, url: String) {
        val sanitized = sanitizeUrl(url)
        getPrefs(context).edit().putString(KEY_BASE_URL, sanitized).apply()
        ApiClient.resetClient()
    }

    private fun sanitizeUrl(url: String): String {
        var clean = url.trim()
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
            clean = "http://$clean"
        }
        if (!clean.endsWith("/")) {
            clean = "$clean/"
        }
        return clean
    }

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
}
