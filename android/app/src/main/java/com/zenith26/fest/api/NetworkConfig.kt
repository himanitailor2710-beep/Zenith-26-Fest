package com.zenith26.fest.api

import android.content.Context
import android.content.SharedPreferences

/**
 * Manages the Base URL and network configuration for the Zenith '26 Android application.
 * Defaults to the active host server on port 8081 (both Wi-Fi IP and emulator loopback).
 */
object NetworkConfig {
    private const val PREFS_NAME = "zenith26_network_prefs"
    private const val KEY_BASE_URL = "base_url"

    // Primary candidates: Wi-Fi IP of developer machine, emulator IP, localhost
    const val DEFAULT_WIFI_BASE_URL = "http://192.168.31.145:8081"
    const val DEFAULT_EMULATOR_BASE_URL = "http://10.0.2.2:8081"
    const val DEFAULT_LOCALHOST_BASE_URL = "http://127.0.0.1:8081"

    val CANDIDATE_URLS = listOf(
        "http://192.168.31.145:8081",
        "http://10.0.2.2:8081",
        "http://127.0.0.1:8081",
        "http://192.168.31.145:8000",
        "http://10.0.2.2:8000"
    )

    fun getBaseUrl(context: Context): String {
        val prefs = getPrefs(context)
        val saved = prefs.getString(KEY_BASE_URL, null)
        if (!saved.isNullOrBlank()) {
            return sanitizeUrl(saved)
        }
        return sanitizeUrl(DEFAULT_WIFI_BASE_URL)
    }

    fun setBaseUrl(context: Context, url: String) {
        val sanitized = sanitizeUrl(url)
        getPrefs(context).edit().putString(KEY_BASE_URL, sanitized).apply()
        ApiClient.resetClient()
    }

    fun sanitizeUrl(url: String): String {
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
