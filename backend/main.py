from datetime import datetime
from pathlib import Path
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.database import get_db_connection, init_db
from backend.models import (
    EventDetail,
    EventIn,
    EventOut,
    RegistrationDetailOut,
    RegistrationIn,
    RegistrationOut,
    StatsOut,
)
from backend.seed_data import seed_events

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and run seed script on startup
    init_db()
    try:
        seed_events()
    except Exception as e:
        print(f"Database initialization/seeding warning: {e}")
    yield


app = FastAPI(
    title="Zenith '26 College Fest Management System API",
    description="Backend REST API for Zenith '26 fest events, registrations, and admin reporting.",
    version="1.0.0",
    lifespan=lifespan,
)

# Eagerly initialize and seed database on serverless cold starts
try:
    init_db()
    seed_events()
except Exception as _e:
    print(f"Initial DB check: {_e}")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# API ENDPOINTS
# ==========================================

@app.get("/api/events", response_model=List[EventOut], tags=["Events"])
def get_events(
    category: Optional[str] = Query(None, description="Filter by event category"),
    search: Optional[str] = Query(None, description="Search by title (case-insensitive)"),
):
    """
    List events with live available_seats computed as capacity minus live registrations.
    Supports optional category filter and title search query.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        e.id, e.title, e.category, e.description, e.event_date, e.event_time, 
        e.venue, e.capacity, e.fee, e.icon,
        (e.capacity - COALESCE(r.reg_count, 0)) AS available_seats
    FROM events e
    LEFT JOIN (
        SELECT event_id, COUNT(*) AS reg_count 
        FROM registrations 
        GROUP BY event_id
    ) r ON e.id = r.event_id
    WHERE 1=1
    """
    params = []

    if category and category.strip().lower() != "all":
        query += " AND LOWER(e.category) = LOWER(?)"
        params.append(category.strip())

    if search and search.strip():
        query += " AND LOWER(e.title) LIKE ?"
        params.append(f"%{search.strip().lower()}%")

    query += " ORDER BY e.id ASC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    events = [dict(row) for row in rows]
    return events


@app.get("/api/events/{event_id}", response_model=EventDetail, tags=["Events"])
def get_event(event_id: int):
    """
    Get detailed information for a single event by ID.
    Returns 404 if event is not found.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        e.id, e.title, e.category, e.description, e.event_date, e.event_time, 
        e.venue, e.capacity, e.fee, e.icon,
        (e.capacity - COALESCE(r.reg_count, 0)) AS available_seats
    FROM events e
    LEFT JOIN (
        SELECT event_id, COUNT(*) AS reg_count 
        FROM registrations 
        GROUP BY event_id
    ) r ON e.id = r.event_id
    WHERE e.id = ?
    """
    cursor.execute(query, (event_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found",
        )

    return dict(row)


@app.post(
    "/api/events/{event_id}/register",
    response_model=RegistrationOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Registrations"],
)
def register_for_event(event_id: int, payload: RegistrationIn):
    """
    Register a student for an event.
    Server-side validation:
      - event_id exists (404)
      - student_name, roll_number, email non-empty (400)
      - email contains '@' (400)
      - event not at capacity (409 'Event is full')
      - email not already registered for this event (409 'Already registered')
    """
    # 1. Clean input
    student_name = payload.student_name.strip() if payload.student_name else ""
    roll_number = payload.roll_number.strip() if payload.roll_number else ""
    email = payload.email.strip().lower() if payload.email else ""
    phone = payload.phone.strip() if payload.phone else ""

    # 2. Check required fields
    if not student_name or not roll_number or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student name, roll number, and email must not be empty",
        )

    # 3. Check email format
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email: email must contain '@' and a valid domain",
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    # 4. Check if event exists
    cursor.execute("SELECT id, title, capacity FROM events WHERE id = ?", (event_id,))
    event = cursor.fetchone()
    if not event:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found",
        )

    capacity = event["capacity"]

    # 5. Check if event is at capacity
    cursor.execute("SELECT COUNT(*) FROM registrations WHERE event_id = ?", (event_id,))
    reg_count = cursor.fetchone()[0]
    if reg_count >= capacity:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event is full",
        )

    # 6. Check if email already registered for this event
    cursor.execute(
        "SELECT id FROM registrations WHERE event_id = ? AND LOWER(email) = LOWER(?)",
        (event_id, email),
    )
    existing_reg = cursor.fetchone()
    if existing_reg:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already registered for this event with this email",
        )

    # 7. Insert registration
    registered_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        """
        INSERT INTO registrations (event_id, student_name, roll_number, email, phone, registered_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (event_id, student_name, roll_number, email, phone, registered_at),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return RegistrationOut(
        id=new_id,
        event_id=event_id,
        student_name=student_name,
        registered_at=registered_at,
    )


@app.get("/api/registrations", response_model=List[RegistrationDetailOut], tags=["Registrations"])
def get_registrations(event_id: Optional[int] = Query(None, description="Filter by event ID")):
    """
    List registrations, including event title. Supports filtering by event_id.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        r.id, r.event_id, r.student_name, r.roll_number, r.email, r.phone, r.registered_at,
        e.title AS event_title
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    """
    params = []
    if event_id is not None:
        query += " WHERE r.event_id = ?"
        params.append(event_id)

    query += " ORDER BY r.id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


@app.get("/api/stats", response_model=StatsOut, tags=["Admin"])
def get_stats():
    """
    Returns live festival statistics computed on-demand from the database:
    - total_events
    - total_registrations
    - total_capacity
    - overall_utilization_pct (rounded to 1 decimal)
    - upcoming_events_count (events on or after today's date)
    - events_by_category (category -> count mapping)
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total events
    cursor.execute("SELECT COUNT(*) FROM events")
    total_events = cursor.fetchone()[0]

    # Total registrations
    cursor.execute("SELECT COUNT(*) FROM registrations")
    total_registrations = cursor.fetchone()[0]

    # Total capacity
    cursor.execute("SELECT COALESCE(SUM(capacity), 0) FROM events")
    total_capacity = cursor.fetchone()[0]

    # Utilization %
    overall_utilization_pct = 0.0
    if total_capacity > 0:
        overall_utilization_pct = round((total_registrations / total_capacity) * 100, 1)

    # Upcoming events: date today or later
    today_iso = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("SELECT COUNT(*) FROM events WHERE event_date >= ?", (today_iso,))
    upcoming_events_count = cursor.fetchone()[0]

    # Events by category
    cursor.execute("SELECT category, COUNT(*) as cnt FROM events GROUP BY category")
    cat_rows = cursor.fetchall()
    events_by_category = {row["category"]: row["cnt"] for row in cat_rows}

    conn.close()

    return StatsOut(
        total_events=total_events,
        total_registrations=total_registrations,
        total_capacity=total_capacity,
        overall_utilization_pct=overall_utilization_pct,
        upcoming_events_count=upcoming_events_count,
        events_by_category=events_by_category,
    )


# ==========================================
# STRETCH GOAL ENDPOINTS
# ==========================================

@app.post("/api/events", response_model=EventOut, status_code=status.HTTP_201_CREATED, tags=["Admin"])
def create_event(payload: EventIn):
    """
    Stretch Goal: Admin creates a new event with full server-side validation.
    """
    title = payload.title.strip()
    category = payload.category.strip()
    venue = payload.venue.strip()
    event_date = payload.event_date.strip()
    event_time = payload.event_time.strip()

    if not title or not category or not venue or not event_date or not event_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title, category, venue, event date, and event time are required",
        )

    if payload.capacity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Capacity must be greater than 0",
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO events (title, category, description, event_date, event_time, venue, capacity, fee, icon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            title,
            category,
            payload.description or "",
            event_date,
            event_time,
            venue,
            payload.capacity,
            payload.fee,
            payload.icon or "🎉",
        ),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return EventOut(
        id=new_id,
        title=title,
        category=category,
        description=payload.description or "",
        event_date=event_date,
        event_time=event_time,
        venue=venue,
        capacity=payload.capacity,
        fee=payload.fee,
        icon=payload.icon or "🎉",
        available_seats=payload.capacity,
    )


@app.delete("/api/registrations/{registration_id}", tags=["Admin"])
def delete_registration(registration_id: int):
    """
    Stretch Goal: Admin cancels/deletes a student registration.
    Immediately restores available seat count.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, event_id FROM registrations WHERE id = ?", (registration_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registration with id {registration_id} not found",
        )

    cursor.execute("DELETE FROM registrations WHERE id = ?", (registration_id,))
    conn.commit()
    conn.close()

    return {"message": "Registration cancelled successfully", "id": registration_id}


# ==========================================
# STATIC FILES & FRONTEND SERVING
# ==========================================

# Mount js directory
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")


@app.get("/", include_in_schema=False)
def serve_index():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/index.html", include_in_schema=False)
def serve_index_html():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/admin.html", include_in_schema=False)
def serve_admin():
    return FileResponse(FRONTEND_DIR / "admin.html")
