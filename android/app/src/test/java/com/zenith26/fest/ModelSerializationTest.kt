package com.zenith26.fest

import com.google.gson.Gson
import com.zenith26.fest.models.*
import org.junit.Assert.*
import org.junit.Test

class ModelSerializationTest {

    private val gson = Gson()

    @Test
    fun testEventOutDeserialization() {
        val json = """
            {
                "id": 1,
                "title": "Code Sprint 2.0",
                "category": "Technical",
                "description": "Rapid coding marathon",
                "event_date": "2026-11-14",
                "event_time": "10:00 AM",
                "venue": "Main Auditorium",
                "capacity": 100,
                "fee": 0,
                "icon": "💻",
                "available_seats": 95
            }
        """.trimIndent()

        val event = gson.fromJson(json, EventOut::class.java)
        assertEquals(1, event.id)
        assertEquals("Code Sprint 2.0", event.title)
        assertEquals("Technical", event.category)
        assertEquals(100, event.capacity)
        assertEquals(95, event.availableSeats)
        assertEquals(5, event.seatsBooked)
        assertEquals(5.0, event.utilizationPct, 0.01)
        assertFalse(event.isFull)
    }

    @Test
    fun testRegistrationInSerialization() {
        val regIn = RegistrationIn(
            studentName = "Alex Morgan",
            rollNumber = "26CS042",
            email = "alex@college.edu",
            phone = "9876543210"
        )
        val json = gson.toJson(regIn)
        assertTrue(json.contains("\"student_name\":\"Alex Morgan\""))
        assertTrue(json.contains("\"roll_number\":\"26CS042\""))
        assertTrue(json.contains("\"email\":\"alex@college.edu\""))
    }

    @Test
    fun testRegistrationOutDeserialization() {
        val json = """
            {
                "id": 42,
                "event_id": 1,
                "student_name": "Alex Morgan",
                "registered_at": "2026-11-14 10:30:00"
            }
        """.trimIndent()

        val out = gson.fromJson(json, RegistrationOut::class.java)
        assertEquals(42, out.id)
        assertEquals(1, out.eventId)
        assertEquals("Alex Morgan", out.studentName)
        assertEquals("2026-11-14 10:30:00", out.registeredAt)
    }

    @Test
    fun testStatsOutDeserialization() {
        val json = """
            {
                "total_events": 14,
                "total_registrations": 10,
                "total_capacity": 1247,
                "overall_utilization_pct": 0.8,
                "upcoming_events_count": 14,
                "events_by_category": {
                    "Technical": 4,
                    "Cultural": 5,
                    "Sports": 2,
                    "Gaming": 1,
                    "Workshop": 2
                }
            }
        """.trimIndent()

        val stats = gson.fromJson(json, StatsOut::class.java)
        assertEquals(14, stats.totalEvents)
        assertEquals(10, stats.totalRegistrations)
        assertEquals(1247, stats.totalCapacity)
        assertEquals(0.8, stats.overallUtilizationPct, 0.01)
        assertEquals(14, stats.upcomingEventsCount)
        assertEquals(4, stats.eventsByCategory["Technical"])
        assertEquals(5, stats.eventsByCategory["Cultural"])
    }
}
