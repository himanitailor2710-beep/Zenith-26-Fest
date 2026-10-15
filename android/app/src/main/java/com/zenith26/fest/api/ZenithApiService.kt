package com.zenith26.fest.api

import com.zenith26.fest.models.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit REST API interface for Zenith '26 College Fest Management System.
 * Faithfully mirrors the FastAPI backend contracts defined in backend/main.py.
 */
interface ZenithApiService {

    /**
     * List all events with live available_seats computation.
     * Optional category filter and case-insensitive search by title.
     */
    @GET("api/events")
    suspend fun getEvents(
        @Query("category") category: String? = null,
        @Query("search") search: String? = null
    ): Response<List<EventOut>>

    /**
     * Retrieve single event detail by ID. Returns 404 if not found.
     */
    @GET("api/events/{event_id}")
    suspend fun getEvent(
        @Path("event_id") eventId: Int
    ): Response<EventOut>

    /**
     * Register a student for an event.
     * Server re-validates:
     * - required fields non-empty (400)
     * - email contains '@' and valid structure (400)
     * - event not full (409)
     * - email not duplicate for event (409)
     */
    @POST("api/events/{event_id}/register")
    suspend fun registerForEvent(
        @Path("event_id") eventId: Int,
        @Body payload: RegistrationIn
    ): Response<RegistrationOut>

    /**
     * List registrations, optionally filtered by event_id.
     */
    @GET("api/registrations")
    suspend fun getRegistrations(
        @Query("event_id") eventId: Int? = null
    ): Response<List<RegistrationDetailOut>>

    /**
     * Live fest operational metrics computed on-demand from SQLite database.
     */
    @GET("api/stats")
    suspend fun getStats(): Response<StatsOut>

    /**
     * Stretch Goal: Admin creates a new event.
     */
    @POST("api/events")
    suspend fun createEvent(
        @Body payload: EventIn
    ): Response<EventOut>

    /**
     * Stretch Goal: Admin deletes/cancels a registration, freeing up 1 seat immediately.
     */
    @DELETE("api/registrations/{registration_id}")
    suspend fun deleteRegistration(
        @Path("registration_id") registrationId: Int
    ): Response<Map<String, Any>>
}
