package com.zenith26.fest.models

import com.google.gson.annotations.SerializedName

/**
 * Data model representing an event sent by the FastAPI backend (matches EventOut / EventDetail schema).
 */
data class EventOut(
    val id: Int,
    val title: String,
    val category: String,
    val description: String? = null,
    @SerializedName("event_date") val eventDate: String,
    @SerializedName("event_time") val eventTime: String,
    val venue: String,
    val capacity: Int,
    val fee: Int = 0,
    val icon: String? = null,
    @SerializedName("available_seats") val availableSeats: Int
) {
    val isFull: Boolean get() = availableSeats <= 0
    val seatsBooked: Int get() = capacity - availableSeats
    val utilizationPct: Double
        get() = if (capacity > 0) {
            Math.round(((seatsBooked.toDouble() / capacity.toDouble()) * 100.0) * 10.0) / 10.0
        } else 0.0
}

/**
 * Data model for stretch goal: creating a new event from admin.
 */
data class EventIn(
    val title: String,
    val category: String,
    val description: String = "",
    @SerializedName("event_date") val eventDate: String,
    @SerializedName("event_time") val eventTime: String,
    val venue: String,
    val capacity: Int,
    val fee: Int = 0,
    val icon: String = "🎉"
)
