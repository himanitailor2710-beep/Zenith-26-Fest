# Zenith '26 API Testing Guide (Postman)

This testing guide accompanies the **Zenith '26 College Fest Management System**. It covers every API endpoint, expected status codes, request bodies, and server responses — reinforcing **PM2-01 (How Software Works)** and **PM2-02 (Front-End, Back-End & Mobile)** concepts like HTTP status codes, API contracts, and server-side validation.

---

## 1. Environment & Setup

1. Start the FastAPI backend server:
   ```bash
   cd zenith26-fest-system
   .\.venv\Scripts\uvicorn backend.main:app --reload --port 8000
   ```
2. Verify server is listening at `http://localhost:8000`.
3. Open Postman desktop or web client.
4. Import `zenith26-api.postman_collection.json` via **File → Import**.
5. Set environment variable or collection variable `baseUrl` = `http://localhost:8000`.

---

## 2. Test Checklist (18 Verification Scenarios)

### Folder A: Events (`/api/events`)

#### Request 1: `GET /api/events`
- **Purpose:** Retrieve all 14 seed events.
- **Expected Status:** `200 OK`
- **Verification:**
  - Response is a JSON array with 14 items.
  - Every event has `available_seats` computed dynamically (equals `capacity` when 0 registrations exist).
  - No database passwords or private fields exposed.

#### Request 2: `GET /api/events?category=Technical`
- **Purpose:** Test category filtering query parameter.
- **Expected Status:** `200 OK`
- **Verification:**
  - Response array contains only events with `"category": "Technical"` (4 items: Code Sprint, Robo Race, AI Pitch Fest, Web Design Rumble).

#### Request 3: `GET /api/events?search=code`
- **Purpose:** Test case-insensitive title search.
- **Expected Status:** `200 OK`
- **Verification:**
  - Returns matching events (e.g. `Code Sprint 2.0`, `Intro to Vibe Coding`).

#### Request 4: `GET /api/events?category=Cultural&search=dance`
- **Purpose:** Test combining category filter and search query params.
- **Expected Status:** `200 OK`
- **Verification:**
  - Returns `Dance Fiesta`.

#### Request 5: `GET /api/events/1`
- **Purpose:** Retrieve single event detail for ID 1.
- **Expected Status:** `200 OK`
- **Verification:**
  - Returns event object for `Code Sprint 2.0` with `id: 1`.

#### Request 6: `GET /api/events/999` (Failure case: Not Found)
- **Purpose:** Verify 404 behavior for non-existent event.
- **Expected Status:** `404 Not Found`
- **Expected Body:**
  ```json
  {
    "detail": "Event with id 999 not found"
  }
  ```

---

### Folder B: Student Registrations (`/api/events/{id}/register`)

#### Request 7: `POST /api/events/1/register` (Success case)
- **Purpose:** Register student for Event 1.
- **Body (raw JSON):**
  ```json
  {
    "student_name": "Rohan Sharma",
    "roll_number": "26CS101",
    "email": "rohan.sharma@college.edu",
    "phone": "+91 9876543210"
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Body:**
  ```json
  {
    "id": 1,
    "event_id": 1,
    "student_name": "Rohan Sharma",
    "registered_at": "YYYY-MM-DD HH:MM:SS"
  }
  ```
- **Live Check:** Re-run `GET /api/events/1` — `available_seats` must now be `99` (dropped from 100).

#### Request 8: `POST /api/events/1/register` (Duplicate Registration - 409 Conflict)
- **Purpose:** Test `UNIQUE(event_id, email)` database & business rule constraint.
- **Body:** Same as Request 7 (`rohan.sharma@college.edu` on Event 1).
- **Expected Status:** `409 Conflict`
- **Expected Body:**
  ```json
  {
    "detail": "Already registered for this event with this email"
  }
  ```

#### Request 9: `POST /api/events/1/register` (Missing Student Name - 400 Bad Request)
- **Purpose:** Server-side validation ("Never trust the client").
- **Body:**
  ```json
  {
    "student_name": "",
    "roll_number": "26CS102",
    "email": "priya@college.edu"
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Expected Body:**
  ```json
  {
    "detail": "Student name, roll number, and email must not be empty"
  }
  ```

#### Request 10: `POST /api/events/1/register` (Invalid Email - 400 Bad Request)
- **Purpose:** Validate email format verification.
- **Body:**
  ```json
  {
    "student_name": "Priya Singh",
    "roll_number": "26CS102",
    "email": "not-an-email"
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Expected Body:**
  ```json
  {
    "detail": "Invalid email: email must contain '@' and a valid domain"
  }
  ```

#### Request 11: `POST /api/events/999/register` (Non-existent Event - 404 Not Found)
- **Purpose:** Verify registration on non-existent event rejects with 404.
- **Body:** Valid student details.
- **Expected Status:** `404 Not Found`
- **Expected Body:**
  ```json
  {
    "detail": "Event with id 999 not found"
  }
  ```

---

### Folder C: Registration Queries (`/api/registrations`)

#### Request 12: `GET /api/registrations`
- **Purpose:** List all registrations across all events.
- **Expected Status:** `200 OK`
- **Verification:**
  - Includes `event_title` join from `events` table.
  - Sorted by `id DESC`.

#### Request 13: `GET /api/registrations?event_id=1`
- **Purpose:** Filter registrations by specific event.
- **Expected Status:** `200 OK`
- **Verification:**
  - Every returned registration has `event_id: 1`.

---

### Folder D: Admin Stats (`/api/stats`)

#### Request 14: `GET /api/stats`
- **Purpose:** Fetch live computed fest metrics.
- **Expected Status:** `200 OK`
- **Expected Response Shape:**
  ```json
  {
    "total_events": 14,
    "total_registrations": 1,
    "total_capacity": 1497,
    "overall_utilization_pct": 0.1,
    "upcoming_events_count": 14,
    "events_by_category": {
      "Technical": 4,
      "Cultural": 5,
      "Sports": 2,
      "Gaming": 1,
      "Workshop": 2
    }
  }
  ```

---

### Folder E: Stretch Goals

#### Request 15: `POST /api/events` (Admin Create Event)
- **Purpose:** Add a new event dynamically to the database.
- **Body:**
  ```json
  {
    "title": "Quantum AI Hackathon",
    "category": "Technical",
    "description": "24-hour rapid product sprint.",
    "event_date": "2026-11-15",
    "event_time": "09:00 AM",
    "venue": "Innovation Hub Lab 4",
    "capacity": 75,
    "fee": 0,
    "icon": "⚡"
  }
  ```
- **Expected Status:** `201 Created`
- **Verification:** New event assigned auto-incremented ID `15` and appears in `GET /api/events`.

#### Request 16: `POST /api/events` (Admin Create Event - Negative Capacity 400)
- **Body:** `capacity: 0` or `-5`
- **Expected Status:** `400 Bad Request` or `422 Unprocessable Entity`

#### Request 17: `DELETE /api/registrations/1` (Cancel Registration)
- **Purpose:** Admin cancels a registration.
- **Expected Status:** `200 OK`
- **Verification:**
  - Returns `{"message": "Registration cancelled successfully", "id": 1}`.
  - `GET /api/events/1` shows `available_seats` restored to `100`.

#### Request 18: `DELETE /api/registrations/999` (Cancel Non-existent)
- **Expected Status:** `404 Not Found`
