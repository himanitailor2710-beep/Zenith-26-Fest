package com.zenith26.fest.api

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.zenith26.fest.models.EventOut
import com.zenith26.fest.models.RegistrationDetailOut
import com.zenith26.fest.models.RegistrationOut
import com.zenith26.fest.models.StatsOut
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Built-in SQLite database engine mirroring the FastAPI SQLite backend.
 * Guarantees that the Android application functions 100% out of the box on cloud emulators
 * (such as Appetize.io) and offline environments without net::ERR_CONNECTION_REFUSED.
 */
class LocalFestEngine private constructor(context: Context) :
    SQLiteOpenHelper(context.applicationContext, DATABASE_NAME, null, DATABASE_VERSION) {

    private val gson = Gson()

    companion object {
        private const val DATABASE_NAME = "zenith26_local.db"
        private const val DATABASE_VERSION = 1

        @Volatile
        private var instance: LocalFestEngine? = null

        fun getInstance(context: Context): LocalFestEngine {
            return instance ?: synchronized(this) {
                instance ?: LocalFestEngine(context).also {
                    instance = it
                    it.ensureSeeded()
                }
            }
        }
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                event_date TEXT NOT NULL,
                event_time TEXT NOT NULL,
                venue TEXT NOT NULL,
                capacity INTEGER NOT NULL,
                fee INTEGER NOT NULL DEFAULT 0,
                icon TEXT
            );
            """.trimIndent()
        )

        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL REFERENCES events(id),
                student_name TEXT NOT NULL,
                roll_number TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                registered_at TEXT NOT NULL,
                UNIQUE(event_id, email)
            );
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS registrations")
        db.execSQL("DROP TABLE IF EXISTS events")
        onCreate(db)
    }

    fun ensureSeeded() {
        val db = writableDatabase
        val cursor = db.rawQuery("SELECT COUNT(*) FROM events", null)
        val count = if (cursor.moveToFirst()) cursor.getInt(0) else 0
        cursor.close()

        if (count == 0) {
            seedEvents(db)
        }
    }

    private fun seedEvents(db: SQLiteDatabase) {
        val seedList = listOf(
            EventOut(1, "Code Sprint 2.0", "Technical", "Fast-paced competitive programming contest. Solve algorithmic problems against the clock.", "2026-11-14", "10:00 AM", "Main Auditorium", 100, 0, "💻", 100),
            EventOut(2, "Robo Race", "Technical", "Design and navigate custom autonomous or RC robots across a challenging obstacle course.", "2026-11-14", "02:00 PM", "Engineering Lab 2", 40, 50, "🤖", 40),
            EventOut(3, "AI Pitch Fest", "Technical", "Present innovative generative AI solutions and startup business models to industry mentors.", "2026-11-15", "11:00 AM", "Seminar Hall A", 60, 0, "💡", 60),
            EventOut(4, "Web Design Rumble", "Technical", "Speed web styling and frontend build-off testing UI/UX creativity, responsiveness, and speed.", "2026-11-14", "04:00 PM", "Computer Lab 1", 50, 0, "🎨", 50),
            EventOut(5, "Battle of Bands", "Cultural", "Live collegiate band face-off featuring rock, indie, and fusion original performances.", "2026-11-15", "06:00 PM", "Open Air Theatre", 300, 0, "🎸", 300),
            EventOut(6, "Dance Fiesta", "Cultural", "Inter-college solo and group dance showcase spanning western, hip-hop, and classical styles.", "2026-11-14", "07:00 PM", "Open Air Theatre", 200, 0, "💃", 200),
            EventOut(7, "Nukkad Natak", "Cultural", "High-energy street play competition bringing pressing social issues alive at the amphitheatre.", "2026-11-15", "03:00 PM", "Amphitheatre", 150, 0, "🎭", 150),
            EventOut(8, "Fashion Fusion", "Cultural", "Runway fashion competition blending traditional ethnic themes with futuristic aesthetics.", "2026-11-15", "08:00 PM", "Main Stage", 250, 100, "👗", 250),
            EventOut(9, "Open Mic Night", "Cultural", "Acoustic music, stand-up comedy, spoken word, and poetry performances under the night sky.", "2026-11-14", "09:00 PM", "Cafeteria Lawn", 100, 0, "🎤", 100),
            EventOut(10, "Five-a-Side Football", "Sports", "Intense quick-match knockout football tournament on the campus sports turf.", "2026-11-14", "08:00 AM", "Sports Ground", 80, 0, "⚽", 80),
            EventOut(11, "Chess Championship", "Sports", "Rapid and blitz chess tournament following official collegiate FIDE rules.", "2026-11-15", "09:00 AM", "Indoor Games Hall", 32, 0, "♟️", 32),
            EventOut(12, "Valorant Showdown", "Gaming", "5v5 tactical FPS LAN esports tournament for ultimate collegiate gaming bragging rights.", "2026-11-14", "01:00 PM", "Gaming Arena", 60, 0, "🎮", 60),
            EventOut(13, "UI/UX Design Workshop", "Workshop", "Hands-on product design session covering wireframing, Figma components, and design systems.", "2026-11-14", "11:00 AM", "Design Lab", 40, 0, "📱", 40),
            EventOut(14, "Intro to Vibe Coding", "Workshop", "Learn to design, build, and deploy full-stack web applications using AI coding tools in hours.", "2026-11-15", "10:00 AM", "Computer Lab 1", 45, 0, "⚡", 45)
        )

        db.beginTransaction()
        try {
            for (ev in seedList) {
                val cv = ContentValues().apply {
                    put("id", ev.id)
                    put("title", ev.title)
                    put("category", ev.category)
                    put("description", ev.description)
                    put("event_date", ev.eventDate)
                    put("event_time", ev.eventTime)
                    put("venue", ev.venue)
                    put("capacity", ev.capacity)
                    put("fee", ev.fee)
                    put("icon", ev.icon)
                }
                db.insertWithOnConflict("events", null, cv, SQLiteDatabase.CONFLICT_REPLACE)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    fun getEventsJson(category: String?, search: String?): String {
        val db = readableDatabase
        val query = StringBuilder(
            """
            SELECT e.id, e.title, e.category, e.description, e.event_date, e.event_time, 
                   e.venue, e.capacity, e.fee, e.icon,
                   (e.capacity - COALESCE(r.reg_count, 0)) AS available_seats
            FROM events e
            LEFT JOIN (
                SELECT event_id, COUNT(*) AS reg_count 
                FROM registrations 
                GROUP BY event_id
            ) r ON e.id = r.event_id
            WHERE 1=1
            """.trimIndent()
        )
        val args = mutableListOf<String>()

        if (!category.isNullOrBlank() && !category.equals("all", ignoreCase = true)) {
            query.append(" AND LOWER(e.category) = LOWER(?)")
            args.add(category.trim())
        }
        if (!search.isNullOrBlank()) {
            query.append(" AND LOWER(e.title) LIKE ?")
            args.add("%${search.trim().lowercase()}%")
        }
        query.append(" ORDER BY e.id ASC")

        val cursor = db.rawQuery(query.toString(), args.toTypedArray())
        val list = mutableListOf<EventOut>()
        while (cursor.moveToNext()) {
            list.add(
                EventOut(
                    id = cursor.getInt(cursor.getColumnIndexOrThrow("id")),
                    title = cursor.getString(cursor.getColumnIndexOrThrow("title")),
                    category = cursor.getString(cursor.getColumnIndexOrThrow("category")),
                    description = cursor.getString(cursor.getColumnIndexOrThrow("description")),
                    eventDate = cursor.getString(cursor.getColumnIndexOrThrow("event_date")),
                    eventTime = cursor.getString(cursor.getColumnIndexOrThrow("event_time")),
                    venue = cursor.getString(cursor.getColumnIndexOrThrow("venue")),
                    capacity = cursor.getInt(cursor.getColumnIndexOrThrow("capacity")),
                    fee = cursor.getInt(cursor.getColumnIndexOrThrow("fee")),
                    icon = cursor.getString(cursor.getColumnIndexOrThrow("icon")),
                    availableSeats = cursor.getInt(cursor.getColumnIndexOrThrow("available_seats"))
                )
            )
        }
        cursor.close()
        return gson.toJson(list)
    }

    fun getEventJson(eventId: Int): Pair<Int, String> {
        val db = readableDatabase
        val query = """
            SELECT e.id, e.title, e.category, e.description, e.event_date, e.event_time, 
                   e.venue, e.capacity, e.fee, e.icon,
                   (e.capacity - COALESCE(r.reg_count, 0)) AS available_seats
            FROM events e
            LEFT JOIN (
                SELECT event_id, COUNT(*) AS reg_count 
                FROM registrations 
                GROUP BY event_id
            ) r ON e.id = r.event_id
            WHERE e.id = ?
        """.trimIndent()

        val cursor = db.rawQuery(query, arrayOf(eventId.toString()))
        if (cursor.moveToFirst()) {
            val ev = EventOut(
                id = cursor.getInt(cursor.getColumnIndexOrThrow("id")),
                title = cursor.getString(cursor.getColumnIndexOrThrow("title")),
                category = cursor.getString(cursor.getColumnIndexOrThrow("category")),
                description = cursor.getString(cursor.getColumnIndexOrThrow("description")),
                eventDate = cursor.getString(cursor.getColumnIndexOrThrow("event_date")),
                eventTime = cursor.getString(cursor.getColumnIndexOrThrow("event_time")),
                venue = cursor.getString(cursor.getColumnIndexOrThrow("venue")),
                capacity = cursor.getInt(cursor.getColumnIndexOrThrow("capacity")),
                fee = cursor.getInt(cursor.getColumnIndexOrThrow("fee")),
                icon = cursor.getString(cursor.getColumnIndexOrThrow("icon")),
                availableSeats = cursor.getInt(cursor.getColumnIndexOrThrow("available_seats"))
            )
            cursor.close()
            return Pair(200, gson.toJson(ev))
        }
        cursor.close()
        return Pair(404, """{"detail":"Event with id $eventId not found"}""")
    }

    fun registerForEvent(eventId: Int, jsonBody: String): Pair<Int, String> {
        val json = try {
            JsonParser.parseString(jsonBody).asJsonObject
        } catch (e: Exception) {
            return Pair(400, """{"detail":"Invalid JSON payload"}""")
        }

        val name = json.get("student_name")?.asString?.trim().orEmpty()
        val roll = json.get("roll_number")?.asString?.trim().orEmpty()
        val email = json.get("email")?.asString?.trim()?.lowercase().orEmpty()
        val phone = json.get("phone")?.let { if (it.isJsonNull) "" else it.asString.trim() }.orEmpty()

        if (name.isEmpty() || roll.isEmpty() || email.isEmpty()) {
            return Pair(400, """{"detail":"Student name, roll number, and email must not be empty"}""")
        }

        if (!email.contains("@") || email.startsWith("@") || email.endsWith("@")) {
            return Pair(400, """{"detail":"Invalid email: email must contain '@' and a valid domain"}""")
        }

        val db = writableDatabase

        // Check if event exists
        val evCursor = db.rawQuery("SELECT capacity FROM events WHERE id = ?", arrayOf(eventId.toString()))
        if (!evCursor.moveToFirst()) {
            evCursor.close()
            return Pair(404, """{"detail":"Event with id $eventId not found"}""")
        }
        val capacity = evCursor.getInt(0)
        evCursor.close()

        // Check capacity
        val countCursor = db.rawQuery("SELECT COUNT(*) FROM registrations WHERE event_id = ?", arrayOf(eventId.toString()))
        val regCount = if (countCursor.moveToFirst()) countCursor.getInt(0) else 0
        countCursor.close()

        if (regCount >= capacity) {
            return Pair(409, """{"detail":"Event is full"}""")
        }

        // Check duplicate email
        val dupCursor = db.rawQuery(
            "SELECT id FROM registrations WHERE event_id = ? AND LOWER(email) = LOWER(?)",
            arrayOf(eventId.toString(), email)
        )
        if (dupCursor.moveToFirst()) {
            dupCursor.close()
            return Pair(409, """{"detail":"Already registered for this event with this email"}""")
        }
        dupCursor.close()

        val registeredAt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
        val cv = ContentValues().apply {
            put("event_id", eventId)
            put("student_name", name)
            put("roll_number", roll)
            put("email", email)
            put("phone", phone)
            put("registered_at", registeredAt)
        }
        val newId = db.insert("registrations", null, cv)

        val out = RegistrationOut(
            id = newId.toInt(),
            eventId = eventId,
            studentName = name,
            registeredAt = registeredAt
        )
        return Pair(201, gson.toJson(out))
    }

    fun getRegistrationsJson(eventId: Int?): String {
        val db = readableDatabase
        val query = StringBuilder(
            """
            SELECT r.id, r.event_id, r.student_name, r.roll_number, r.email, r.phone, r.registered_at,
                   e.title AS event_title
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            """.trimIndent()
        )
        val args = mutableListOf<String>()
        if (eventId != null) {
            query.append(" WHERE r.event_id = ?")
            args.add(eventId.toString())
        }
        query.append(" ORDER BY r.id DESC")

        val cursor = db.rawQuery(query.toString(), args.toTypedArray())
        val list = mutableListOf<RegistrationDetailOut>()
        while (cursor.moveToNext()) {
            list.add(
                RegistrationDetailOut(
                    id = cursor.getInt(cursor.getColumnIndexOrThrow("id")),
                    eventId = cursor.getInt(cursor.getColumnIndexOrThrow("event_id")),
                    studentName = cursor.getString(cursor.getColumnIndexOrThrow("student_name")),
                    rollNumber = cursor.getString(cursor.getColumnIndexOrThrow("roll_number")),
                    email = cursor.getString(cursor.getColumnIndexOrThrow("email")),
                    phone = cursor.getString(cursor.getColumnIndexOrThrow("phone")),
                    registeredAt = cursor.getString(cursor.getColumnIndexOrThrow("registered_at")),
                    eventTitle = cursor.getString(cursor.getColumnIndexOrThrow("event_title"))
                )
            )
        }
        cursor.close()
        return gson.toJson(list)
    }

    fun getStatsJson(): String {
        val db = readableDatabase

        var totalEvents = 0
        var totalRegistrations = 0
        var totalCapacity = 0

        val evCursor = db.rawQuery("SELECT COUNT(*), COALESCE(SUM(capacity), 0) FROM events", null)
        if (evCursor.moveToFirst()) {
            totalEvents = evCursor.getInt(0)
            totalCapacity = evCursor.getInt(1)
        }
        evCursor.close()

        val regCursor = db.rawQuery("SELECT COUNT(*) FROM registrations", null)
        if (regCursor.moveToFirst()) {
            totalRegistrations = regCursor.getInt(0)
        }
        regCursor.close()

        val overallUtilizationPct = if (totalCapacity > 0) {
            Math.round(((totalRegistrations.toDouble() / totalCapacity.toDouble()) * 100.0) * 10.0) / 10.0
        } else 0.0

        val todayIso = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val upCursor = db.rawQuery("SELECT COUNT(*) FROM events WHERE event_date >= ?", arrayOf(todayIso))
        val upcomingEventsCount = if (upCursor.moveToFirst()) upCursor.getInt(0) else 0
        upCursor.close()

        val catMap = mutableMapOf<String, Int>()
        val catCursor = db.rawQuery("SELECT category, COUNT(*) as cnt FROM events GROUP BY category", null)
        while (catCursor.moveToNext()) {
            catMap[catCursor.getString(0)] = catCursor.getInt(1)
        }
        catCursor.close()

        val stats = StatsOut(
            totalEvents = totalEvents,
            totalRegistrations = totalRegistrations,
            totalCapacity = totalCapacity,
            overallUtilizationPct = overallUtilizationPct,
            upcomingEventsCount = upcomingEventsCount,
            eventsByCategory = catMap
        )
        return gson.toJson(stats)
    }

    fun deleteRegistration(registrationId: Int): Pair<Int, String> {
        val db = writableDatabase
        val rows = db.delete("registrations", "id = ?", arrayOf(registrationId.toString()))
        return if (rows > 0) {
            Pair(200, """{"message":"Registration cancelled successfully","id":$registrationId}""")
        } else {
            Pair(404, """{"detail":"Registration with id $registrationId not found"}""")
        }
    }
}
