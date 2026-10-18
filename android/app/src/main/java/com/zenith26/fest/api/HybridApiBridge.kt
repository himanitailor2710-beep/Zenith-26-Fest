package com.zenith26.fest.api

import android.content.Context
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.nio.charset.StandardCharsets
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Handles intercepting /api/ requests from WebView.
 * Attempts live FastAPI communication with short timeouts; if unreachable,
 * instantly uses the embedded LocalFestEngine with identical data models and validation rules.
 */
class HybridApiBridge(private val context: Context) {

    private val localEngine = LocalFestEngine.getInstance(context)
    private var lastRemoteFailedTimestamp = 0L
    private val retryIntervalMs = 6_000L
    private val backgroundPool = Executors.newSingleThreadExecutor()

    @Volatile
    private var activeWorkingBaseUrl: String? = null

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(250, TimeUnit.MILLISECONDS)
        .readTimeout(500, TimeUnit.MILLISECONDS)
        .retryOnConnectionFailure(false)
        .build()

    init {
        // Probe candidate URLs in background on app startup
        probeBestServerAsync()
    }

    private fun probeBestServerAsync() {
        backgroundPool.execute {
            for (candidate in NetworkConfig.CANDIDATE_URLS) {
                try {
                    val url = NetworkConfig.sanitizeUrl(candidate) + "api/events/1"
                    val req = Request.Builder().url(url).get().build()
                    val res = httpClient.newCall(req).execute()
                    if (res.isSuccessful) {
                        activeWorkingBaseUrl = NetworkConfig.sanitizeUrl(candidate)
                        break
                    }
                } catch (_: Exception) {
                    // Try next candidate
                }
            }
        }
    }

    fun handleRequest(request: WebResourceRequest): WebResourceResponse? {
        return try {
            val uri = request.url
            val path = uri.path ?: return null

            if (!path.startsWith("/api")) {
                return null
            }

            val method = request.method
            val (statusCode, jsonResponse) = executeApiCall(method, uri.toString(), "")

            val stream: InputStream = ByteArrayInputStream(jsonResponse.toByteArray(StandardCharsets.UTF_8))
            if (statusCode == 200) {
                WebResourceResponse("application/json", "utf-8", stream)
            } else {
                val reasonPhrase = when (statusCode) {
                    201 -> "Created"
                    400 -> "Bad Request"
                    404 -> "Not Found"
                    409 -> "Conflict"
                    else -> "OK"
                }
                WebResourceResponse(
                    "application/json",
                    "utf-8",
                    statusCode,
                    reasonPhrase,
                    mapOf(
                        "Access-Control-Allow-Origin" to "*",
                        "Content-Type" to "application/json"
                    ),
                    stream
                )
            }
        } catch (_: Exception) {
            val fallback = localEngine.getEventsJson(null, null)
            val stream = ByteArrayInputStream(fallback.toByteArray(StandardCharsets.UTF_8))
            WebResourceResponse("application/json", "utf-8", stream)
        }
    }

    fun executeApiCall(method: String, urlStr: String, payloadJson: String): Pair<Int, String> {
        val uri = Uri.parse(urlStr)
        val path = uri.path ?: ""
        val upperMethod = method.uppercase()
        val configuredUrl = activeWorkingBaseUrl ?: NetworkConfig.getBaseUrl(context)
        val now = System.currentTimeMillis()

        // 1. Try active/configured remote server fast (single try, 250ms max)
        if (now - lastRemoteFailedTimestamp > retryIntervalMs) {
            try {
                val queryString = if (!uri.query.isNullOrBlank()) "?${uri.query}" else ""
                val fullRemoteUrl = configuredUrl.removeSuffix("/") + (if (path.startsWith("/")) path else "/$path") + queryString
                val reqBuilder = Request.Builder().url(fullRemoteUrl)

                val mediaType = "application/json; charset=utf-8".toMediaType()
                when (upperMethod) {
                    "GET" -> reqBuilder.get()
                    "POST" -> reqBuilder.post(payloadJson.toRequestBody(mediaType))
                    "DELETE" -> reqBuilder.delete(if (payloadJson.isNotEmpty()) payloadJson.toRequestBody(mediaType) else null)
                    "PUT" -> reqBuilder.put(payloadJson.toRequestBody(mediaType))
                    else -> reqBuilder.get()
                }

                val okRes = httpClient.newCall(reqBuilder.build()).execute()
                val responseBody = okRes.body?.string().orEmpty()

                if (okRes.isSuccessful) {
                    activeWorkingBaseUrl = configuredUrl
                    return Pair(okRes.code, responseBody)
                } else if (okRes.code in 400..409) {
                    return Pair(okRes.code, responseBody)
                }
            } catch (_: Exception) {
                lastRemoteFailedTimestamp = System.currentTimeMillis()
                // Re-probe other candidate servers in background without blocking current call
                probeBestServerAsync()
            }
        }

        // 2. Instant local serving from LocalFestEngine (guarantees fast rendering, no hanging)
        return handleLocally(uri, upperMethod, payloadJson)
    }

    private fun handleLocally(uri: Uri, method: String, body: String): Pair<Int, String> {
        val path = uri.path ?: ""
        val segments = uri.pathSegments

        return when {
            // GET /api/events
            path == "/api/events" && method == "GET" -> {
                val category = uri.getQueryParameter("category")
                val search = uri.getQueryParameter("search")
                Pair(200, localEngine.getEventsJson(category, search))
            }

            // POST /api/events (Create event)
            path == "/api/events" && method == "POST" -> {
                localEngine.createEvent(body)
            }

            // GET /api/events/{id}
            segments.size == 3 && segments[0] == "api" && segments[1] == "events" && method == "GET" -> {
                val id = segments[2].toIntOrNull() ?: -1
                localEngine.getEventJson(id)
            }

            // POST /api/events/{id}/register
            segments.size >= 4 && segments[0] == "api" && segments[1] == "events" && segments[3].startsWith("register") && method == "POST" -> {
                val id = segments[2].toIntOrNull() ?: -1
                localEngine.registerForEvent(id, body)
            }

            // GET /api/stats
            path == "/api/stats" && method == "GET" -> {
                Pair(200, localEngine.getStatsJson())
            }

            // GET /api/registrations
            path == "/api/registrations" && method == "GET" -> {
                val eventId = uri.getQueryParameter("event_id")?.toIntOrNull()
                Pair(200, localEngine.getRegistrationsJson(eventId))
            }

            // DELETE /api/registrations/{id}
            segments.size == 3 && segments[0] == "api" && segments[1] == "registrations" && method == "DELETE" -> {
                val id = segments[2].toIntOrNull() ?: -1
                localEngine.deleteRegistration(id)
            }

            else -> {
                Pair(404, """{"detail":"Endpoint not handled locally"}""")
            }
        }
    }

    fun handleLocalPost(path: String, body: String): Pair<Int, String> {
        return executeApiCall("POST", path, body)
    }
}
