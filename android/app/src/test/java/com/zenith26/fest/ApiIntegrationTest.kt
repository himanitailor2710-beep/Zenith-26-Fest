package com.zenith26.fest

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.zenith26.fest.models.*
import org.junit.Assert.*
import org.junit.Assume
import org.junit.BeforeClass
import org.junit.Test
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * End-to-end integration test verifying that the Android Kotlin client models
 * and contracts integrate seamlessly with the live FastAPI backend server.
 */
class ApiIntegrationTest {

    companion object {
        private const val BASE_URL = "http://127.0.0.1:8081/api"
        private val gson = Gson()
        private var isServerAvailable = false

        @JvmStatic
        @BeforeClass
        fun checkServer() {
            try {
                val url = URL("$BASE_URL/events")
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 1500
                conn.readTimeout = 1500
                conn.requestMethod = "GET"
                val code = conn.responseCode
                isServerAvailable = (code == 200)
                conn.disconnect()
            } catch (e: Exception) {
                isServerAvailable = false
            }
        }
    }

    @Test
    fun testGetAllEventsReturns14SeededEvents() {
        Assume.assumeTrue("FastAPI server must be running at 127.0.0.1:8081", isServerAvailable)

        val url = URL("$BASE_URL/events")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "GET"
        assertEquals(200, conn.responseCode)

        val json = conn.inputStream.bufferedReader().use { it.readText() }
        val type = object : TypeToken<List<EventOut>>() {}.type
        val events: List<EventOut> = gson.fromJson(json, type)

        assertTrue("Expected at least 14 events", events.size >= 14)
        val titles = events.map { it.title }
        assertTrue(titles.contains("Code Sprint 2.0"))
        assertTrue(titles.contains("Robo Race"))
        assertTrue(titles.contains("AI Pitch Fest"))
        assertTrue(titles.contains("Battle of Bands"))
        conn.disconnect()
    }

    @Test
    fun testGetEventById() {
        Assume.assumeTrue(isServerAvailable)

        val url = URL("$BASE_URL/events/1")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "GET"
        assertEquals(200, conn.responseCode)

        val json = conn.inputStream.bufferedReader().use { it.readText() }
        val event = gson.fromJson(json, EventOut::class.java)
        assertEquals(1, event.id)
        assertEquals("Code Sprint 2.0", event.title)
        assertEquals("Technical", event.category)
        assertTrue(event.capacity > 0)
        conn.disconnect()
    }

    @Test
    fun testGetEventNonExistentReturns404() {
        Assume.assumeTrue(isServerAvailable)

        val url = URL("$BASE_URL/events/99999")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "GET"
        assertEquals(404, conn.responseCode)
        conn.disconnect()
    }

    @Test
    fun testCategoryFilterAndSearch() {
        Assume.assumeTrue(isServerAvailable)

        // Category Filter
        val catUrl = URL("$BASE_URL/events?category=Technical")
        val catConn = catUrl.openConnection() as HttpURLConnection
        assertEquals(200, catConn.responseCode)
        val catJson = catConn.inputStream.bufferedReader().use { it.readText() }
        val catEvents: List<EventOut> = gson.fromJson(catJson, object : TypeToken<List<EventOut>>() {}.type)
        assertTrue(catEvents.isNotEmpty())
        assertTrue(catEvents.all { it.category.equals("Technical", ignoreCase = true) })
        catConn.disconnect()

        // Title Search
        val searchUrl = URL("$BASE_URL/events?search=Dance")
        val searchConn = searchUrl.openConnection() as HttpURLConnection
        assertEquals(200, searchConn.responseCode)
        val searchJson = searchConn.inputStream.bufferedReader().use { it.readText() }
        val searchEvents: List<EventOut> = gson.fromJson(searchJson, object : TypeToken<List<EventOut>>() {}.type)
        assertTrue(searchEvents.any { it.title.contains("Dance", ignoreCase = true) })
        searchConn.disconnect()
    }

    @Test
    fun testRegistrationValidationAndConflict() {
        Assume.assumeTrue(isServerAvailable)

        val uniqueEmail = "student_${System.currentTimeMillis()}@college.edu"
        val payload = RegistrationIn(
            studentName = "Mobile Test Student",
            rollNumber = "26TEST01",
            email = uniqueEmail,
            phone = "9876543210"
        )

        // 1. First registration should succeed (201)
        val regUrl = URL("$BASE_URL/events/3/register")
        var conn = regUrl.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.doOutput = true
        conn.outputStream.bufferedWriter().use { it.write(gson.toJson(payload)) }

        val statusCode = conn.responseCode
        assertEquals(201, statusCode)
        val resJson = conn.inputStream.bufferedReader().use { it.readText() }
        val out = gson.fromJson(resJson, RegistrationOut::class.java)
        assertEquals(3, out.eventId)
        assertEquals("Mobile Test Student", out.studentName)
        conn.disconnect()

        // 2. Duplicate registration with same email should return 409 Conflict
        conn = regUrl.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.doOutput = true
        conn.outputStream.bufferedWriter().use { it.write(gson.toJson(payload)) }
        assertEquals(409, conn.responseCode)
        conn.disconnect()

        // 3. Invalid email should return 400 Bad Request
        val invalidPayload = payload.copy(email = "invalidemail")
        conn = regUrl.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.doOutput = true
        conn.outputStream.bufferedWriter().use { it.write(gson.toJson(invalidPayload)) }
        assertEquals(400, conn.responseCode)
        conn.disconnect()
    }

    @Test
    fun testGetStats() {
        Assume.assumeTrue(isServerAvailable)

        val url = URL("$BASE_URL/stats")
        val conn = url.openConnection() as HttpURLConnection
        assertEquals(200, conn.responseCode)

        val json = conn.inputStream.bufferedReader().use { it.readText() }
        val stats = gson.fromJson(json, StatsOut::class.java)
        assertTrue(stats.totalEvents >= 14)
        assertTrue(stats.totalCapacity > 0)
        assertTrue(stats.eventsByCategory.isNotEmpty())
        conn.disconnect()
    }
}
