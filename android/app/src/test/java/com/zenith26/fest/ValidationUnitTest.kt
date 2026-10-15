package com.zenith26.fest

import com.zenith26.fest.util.ValidationUtils
import org.junit.Assert.*
import org.junit.Test

class ValidationUnitTest {

    @Test
    fun testValidRegistrationPasses() {
        val result = ValidationUtils.validateRegistration(
            studentName = "Alex Morgan",
            rollNumber = "26CS042",
            email = "alex@college.edu",
            phone = "9876543210"
        )
        assertTrue("Expected valid registration", result is ValidationUtils.ValidationResult.Valid)
    }

    @Test
    fun testMissingStudentNameFails() {
        val result = ValidationUtils.validateRegistration(
            studentName = "",
            rollNumber = "26CS042",
            email = "alex@college.edu"
        )
        assertTrue(result is ValidationUtils.ValidationResult.Invalid)
        assertEquals("Please enter your full name.", (result as ValidationUtils.ValidationResult.Invalid).errorMessage)
    }

    @Test
    fun testMissingRollNumberFails() {
        val result = ValidationUtils.validateRegistration(
            studentName = "Alex Morgan",
            rollNumber = "",
            email = "alex@college.edu"
        )
        assertTrue(result is ValidationUtils.ValidationResult.Invalid)
        assertEquals("Please enter your student roll number.", (result as ValidationUtils.ValidationResult.Invalid).errorMessage)
    }

    @Test
    fun testInvalidEmailWithoutAtSymbolFails() {
        val result = ValidationUtils.validateRegistration(
            studentName = "Alex Morgan",
            rollNumber = "26CS042",
            email = "alexcollege.edu"
        )
        assertTrue(result is ValidationUtils.ValidationResult.Invalid)
        assertTrue((result as ValidationUtils.ValidationResult.Invalid).errorMessage.contains("Invalid email"))
    }

    @Test
    fun testInvalidEmailStartsOrEndsWithAtFails() {
        assertFalse(ValidationUtils.isValidEmail("@college.edu"))
        assertFalse(ValidationUtils.isValidEmail("alex@"))
        assertFalse(ValidationUtils.isValidEmail("alex@com")) // no dot in domain
        assertTrue(ValidationUtils.isValidEmail("alex@college.edu"))
    }

    @Test
    fun testValidateEventForAdminStretchGoal() {
        val valid = ValidationUtils.validateEvent(
            title = "AI Hackathon",
            category = "Technical",
            venue = "Lab 1",
            eventDate = "2026-11-14",
            eventTime = "10:00 AM",
            capacity = 50
        )
        assertTrue(valid is ValidationUtils.ValidationResult.Valid)

        val invalidCapacity = ValidationUtils.validateEvent(
            title = "AI Hackathon",
            category = "Technical",
            venue = "Lab 1",
            eventDate = "2026-11-14",
            eventTime = "10:00 AM",
            capacity = 0
        )
        assertTrue(invalidCapacity is ValidationUtils.ValidationResult.Invalid)
    }
}
