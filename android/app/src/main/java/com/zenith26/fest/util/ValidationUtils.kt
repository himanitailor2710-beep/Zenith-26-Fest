package com.zenith26.fest.util

/**
 * Validation utility matching the exact client and server-side validation constraints
 * defined in PM2-02 "Never Trust the Client" principles.
 */
object ValidationUtils {

    sealed class ValidationResult {
        object Valid : ValidationResult()
        data class Invalid(val errorMessage: String) : ValidationResult()
    }

    /**
     * Validates student registration input fields.
     */
    fun validateRegistration(
        studentName: String?,
        rollNumber: String?,
        email: String?,
        phone: String? = null
    ): ValidationResult {
        val name = studentName?.trim().orEmpty()
        val roll = rollNumber?.trim().orEmpty()
        val mail = email?.trim().orEmpty().lowercase()

        if (name.isEmpty()) {
            return ValidationResult.Invalid("Please enter your full name.")
        }
        if (roll.isEmpty()) {
            return ValidationResult.Invalid("Please enter your student roll number.")
        }
        if (mail.isEmpty()) {
            return ValidationResult.Invalid("Please enter your student email address.")
        }
        if (!isValidEmail(mail)) {
            return ValidationResult.Invalid("Invalid email: email must contain '@' and a valid domain.")
        }

        return ValidationResult.Valid
    }

    /**
     * Email validation ensuring presence of '@', non-empty prefix, and non-empty domain.
     */
    fun isValidEmail(email: String): Boolean {
        val clean = email.trim()
        if (!clean.contains("@")) return false
        if (clean.startsWith("@") || clean.endsWith("@")) return false
        val parts = clean.split("@")
        if (parts.size != 2) return false
        return parts[0].isNotEmpty() && parts[1].isNotEmpty() && parts[1].contains(".")
    }

    /**
     * Validates event creation input for stretch goal.
     */
    fun validateEvent(
        title: String?,
        category: String?,
        venue: String?,
        eventDate: String?,
        eventTime: String?,
        capacity: Int
    ): ValidationResult {
        if (title.isNullOrBlank() || category.isNullOrBlank() || venue.isNullOrBlank() ||
            eventDate.isNullOrBlank() || eventTime.isNullOrBlank()
        ) {
            return ValidationResult.Invalid("Title, category, venue, event date, and event time are required.")
        }
        if (capacity <= 0) {
            return ValidationResult.Invalid("Capacity must be greater than 0.")
        }
        return ValidationResult.Valid
    }
}
