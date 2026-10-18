import os
import sys
import sqlite3
from pathlib import Path
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

SQLITE_DB_PATH = Path(__file__).resolve().parent.parent / "fest.db"


def migrate():
    """
    Migrates all events and registrations from SQLite fest.db to PostgreSQL (DATABASE_URL / POSTGRES_URL).
    """
    pg_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("POSTGRES_PRISMA_URL")
    if not pg_url:
        print("ERROR: No PostgreSQL connection URL found.")
        print("Please set DATABASE_URL or POSTGRES_URL in your environment or .env file.")
        print("Example: set DATABASE_URL=postgresql://user:password@host:port/database")
        sys.exit(1)

    if pg_url.startswith("postgres://"):
        pg_url = "postgresql://" + pg_url[len("postgres://"):]

    print(f"Connecting to SQLite: {SQLITE_DB_PATH}")
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        print("ERROR: psycopg2-binary is required. Run: pip install psycopg2-binary")
        sys.exit(1)

    print("Connecting to PostgreSQL...")
    pg_conn = psycopg2.connect(pg_url)
    pg_cur = pg_conn.cursor()

    # 1. Initialize tables in PostgreSQL
    print("Creating tables in PostgreSQL if not present...")
    pg_cur.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        event_date VARCHAR(50) NOT NULL,
        event_time VARCHAR(50) NOT NULL,
        venue VARCHAR(255) NOT NULL,
        capacity INTEGER NOT NULL,
        fee INTEGER NOT NULL DEFAULT 0,
        icon VARCHAR(50)
    );
    """)

    pg_cur.execute("""
    CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        student_name VARCHAR(255) NOT NULL,
        roll_number VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        registered_at VARCHAR(50) NOT NULL,
        UNIQUE(event_id, email)
    );
    """)
    pg_conn.commit()

    # 2. Migrate Events
    sqlite_cur.execute("SELECT id, title, category, description, event_date, event_time, venue, capacity, fee, icon FROM events ORDER BY id ASC")
    events = sqlite_cur.fetchall()
    print(f"Migrating {len(events)} events to PostgreSQL...")
    for ev in events:
        pg_cur.execute("""
        INSERT INTO events (id, title, category, description, event_date, event_time, venue, capacity, fee, icon)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            description = EXCLUDED.description,
            event_date = EXCLUDED.event_date,
            event_time = EXCLUDED.event_time,
            venue = EXCLUDED.venue,
            capacity = EXCLUDED.capacity,
            fee = EXCLUDED.fee,
            icon = EXCLUDED.icon;
        """, (
            ev["id"], ev["title"], ev["category"], ev["description"],
            ev["event_date"], ev["event_time"], ev["venue"],
            ev["capacity"], ev["fee"], ev["icon"]
        ))
    pg_conn.commit()

    # Reset identity sequence for events
    pg_cur.execute("SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE(max(id), 1)) FROM events;")
    pg_conn.commit()

    # 3. Migrate Registrations
    sqlite_cur.execute("SELECT id, event_id, student_name, roll_number, email, phone, registered_at FROM registrations ORDER BY id ASC")
    registrations = sqlite_cur.fetchall()
    print(f"Migrating {len(registrations)} registrations to PostgreSQL...")
    for reg in registrations:
        pg_cur.execute("""
        INSERT INTO registrations (id, event_id, student_name, roll_number, email, phone, registered_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (event_id, email) DO UPDATE SET
            student_name = EXCLUDED.student_name,
            roll_number = EXCLUDED.roll_number,
            phone = EXCLUDED.phone,
            registered_at = EXCLUDED.registered_at;
        """, (
            reg["id"], reg["event_id"], reg["student_name"], reg["roll_number"],
            reg["email"], reg["phone"], reg["registered_at"]
        ))
    pg_conn.commit()

    # Reset identity sequence for registrations
    if len(registrations) > 0:
        pg_cur.execute("SELECT setval(pg_get_serial_sequence('registrations', 'id'), COALESCE(max(id), 1)) FROM registrations;")
        pg_conn.commit()

    sqlite_conn.close()
    pg_conn.close()
    print("Migration from SQLite to PostgreSQL completed successfully!")


if __name__ == "__main__":
    migrate()
