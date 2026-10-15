package com.zenith26.fest.api

import android.content.Context
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

/**
 * Handles intercepting /api/ requests from WebView.
 * Attempts live FastAPI communication first; if unreachable (such as on cloud Appetize.io or offline),
 * seamlessly uses the embedded LocalFestEngine with identical data models and validation rules.
 */
class HybridApiBridge(private val context: Context) {

    private val localEngine = LocalFestEngine.getInstance(context)
    private var lastRemoteFailedTimestamp = 0L
    private val retryIntervalMs = 15_000L

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(800, TimeUnit.MILLISECONDS)
        .readTimeout(1200, TimeUnit.MILLISECONDS)
        .build()

    fun handleRequest(request: WebResourceRequest): WebResourceResponse? {
        val uri = request.url
        val path = uri.path ?: return null

        if (!path.startsWith("/api")) {
            return null
        }

        val method = request.method
        val baseUrl = NetworkConfig.getBaseUrl(context)
        val now = System.currentTimeMillis()

        // Only try remote server if we haven't recently confirmed it is unreachable
        if (now - lastRemoteFailedTimestamp > retryIntervalMs) {
            try {
                val fullRemoteUrl = baseUrl.removeSuffix("/") + path + if (uri.query != null) "?${uri.query}" else ""
                val reqBuilder = Request.Builder().url(fullRemoteUrl)

                if (method.equals("GET", ignoreCase = true)) {
                    val okReq = reqBuilder.get().build()
                    val okRes = httpClient.newCall(okReq).execute()
                    if (okRes.isSuccessful) {
                        val bodyStream = okRes.body?.byteStream()
                        val contentType = okRes.header("Content-Type", "application/json") ?: "application/json"
                        return WebResourceResponse(
                            contentType,
                            "utf-8",
                            okRes.code,
                            okRes.message.ifEmpty { "OK" },
                            mapOf("Access-Control-Allow-Origin" to "*"),
                            bodyStream
                        )
                    }
                }
            } catch (_: Exception) {
                // Live server unreachable on this network environment (e.g. Appetize.io cloud emulator)
                lastRemoteFailedTimestamp = System.currentTimeMillis()
            }
        }

        // Serve instantly from LocalFestEngine
        return handleLocally(uri, method)
    }

    private fun handleLocally(uri: Uri, method: String): WebResourceResponse {
        val path = uri.path ?: ""
        val segments = uri.pathSegments

        val statusCode: Int
        var reasonPhrase = "OK"
        val jsonResponse: String

        when {
            // GET /api/events
            path == "/api/events" && method.equals("GET", ignoreCase = true) -> {
                val category = uri.getQueryParameter("category")
                val search = uri.getQueryParameter("search")
                jsonResponse = localEngine.getEventsJson(category, search)
                statusCode = 200
            }

            // GET /api/events/{id}
            segments.size == 3 && segments[0] == "api" && segments[1] == "events" && method.equals("GET", ignoreCase = true) -> {
                val id = segments[2].toIntOrNull() ?: -1
                val res = localEngine.getEventJson(id)
                statusCode = res.first
                reasonPhrase = if (statusCode == 200) "OK" else "Not Found"
                jsonResponse = res.second
            }

            // GET /api/stats
            path == "/api/stats" && method.equals("GET", ignoreCase = true) -> {
                jsonResponse = localEngine.getStatsJson()
                statusCode = 200
            }

            // GET /api/registrations
            path == "/api/registrations" && method.equals("GET", ignoreCase = true) -> {
                val eventId = uri.getQueryParameter("event_id")?.toIntOrNull()
                jsonResponse = localEngine.getRegistrationsJson(eventId)
                statusCode = 200
            }

            // DELETE /api/registrations/{id}
            segments.size == 3 && segments[0] == "api" && segments[1] == "registrations" && method.equals("DELETE", ignoreCase = true) -> {
                val id = segments[2].toIntOrNull() ?: -1
                val res = localEngine.deleteRegistration(id)
                statusCode = res.first
                reasonPhrase = if (statusCode == 200) "OK" else "Not Found"
                jsonResponse = res.second
            }

            else -> {
                statusCode = 404
                reasonPhrase = "Not Found"
                jsonResponse = """{"detail":"Endpoint not handled locally"}"""
            }
        }

        val stream: InputStream = ByteArrayInputStream(jsonResponse.toByteArray(StandardCharsets.UTF_8))
        return WebResourceResponse(
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

    fun handleLocalPost(path: String, body: String): Pair<Int, String> {
        val segments = path.split("/").filter { it.isNotEmpty() }
        if (segments.size >= 4 && segments[0] == "api" && segments[1] == "events" && segments[3].startsWith("register")) {
            val eventId = segments[2].toIntOrNull() ?: -1
            return localEngine.registerForEvent(eventId, body)
        }
        return Pair(404, """{"detail":"Endpoint not found"}""")
    }
}
