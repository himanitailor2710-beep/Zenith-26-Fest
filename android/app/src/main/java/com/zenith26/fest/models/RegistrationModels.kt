package com.zenith26.fest.models

import com.google.gson.annotations.SerializedName

/**
 * Payload sent to register a student for an event (POST /api/events/{id}/register).
 */
data class RegistrationIn(
    @SerializedName("student_name") val studentName: String,
    @SerializedName("roll_number") val rollNumber: String,
    val email: String,
    val phone: String? = null
)

/**
 * Registration confirmation response returned upon successful registration (HTTP 201).
 */
data class RegistrationOut(
    val id: Int,
    @SerializedName("event_id") val eventId: Int,
    @SerializedName("student_name") val studentName: String,
    @SerializedName("registered_at") val registeredAt: String
)

/**
 * Detailed registration object for coordinator management (GET /api/registrations).
 */
data class RegistrationDetailOut(
    val id: Int,
    @SerializedName("event_id") val eventId: Int,
    @SerializedName("student_name") val studentName: String,
    @SerializedName("roll_number") val rollNumber: String,
    val email: String,
    val phone: String? = null,
    @SerializedName("registered_at") val registeredAt: String,
    @SerializedName("event_title") val eventTitle: String
)
