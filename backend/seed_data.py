import openpyxl
from pathlib import Path
from backend.database import get_db_connection, init_db

DATA_FILE_PATH = Path(__file__).resolve().parent.parent / "data" / "events_seed.xlsx"


def seed_events():
    """
    Seeds the events table from data/events_seed.xlsx.
    Skips if events table is already populated.
    Raises FileNotFoundError if data/events_seed.xlsx is missing.
    """
    init_db()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if table already has rows
    cursor.execute("SELECT COUNT(*) FROM events")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"Events table already contains {count} events. Skipping seeding.")
        conn.close()
        return

    # Check if seed spreadsheet exists
    if not DATA_FILE_PATH.exists():
        conn.close()
        raise FileNotFoundError(
            f"Seed data file not found at {DATA_FILE_PATH}. "
            "Please copy the provided events_seed.xlsx file into the data/ folder before running this script."
        )

    print(f"Reading seed data from {DATA_FILE_PATH}...")
    wb = openpyxl.load_workbook(DATA_FILE_PATH)
    if "Events" not in wb.sheetnames:
        conn.close()
        raise ValueError("Worksheet 'Events' not found in events_seed.xlsx.")

    ws = wb["Events"]

    # Expected headers: id, title, category, description, event_date, event_time, venue, capacity, fee, icon
    rows = list(ws.iter_rows(values_only=True))
    if not rows or len(rows) < 2:
        conn.close()
        raise ValueError("The 'Events' sheet is empty or has no data rows.")

    data_rows = rows[1:]
    for row in data_rows:
        if not row or row[0] is None:
            continue
        event_id, title, category, description, event_date, event_time, venue, capacity, fee, icon = row[:10]
        cursor.execute(
            """
            INSERT INTO events (id, title, category, description, event_date, event_time, venue, capacity, fee, icon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(event_id),
                str(title),
                str(category),
                str(description) if description is not None else "",
                str(event_date),
                str(event_time),
                str(venue),
                int(capacity),
                int(fee) if fee is not None else 0,
                str(icon) if icon is not None else "",
            ),
        )

    conn.commit()
    cursor.execute("SELECT COUNT(*) FROM events")
    new_count = cursor.fetchone()[0]
    conn.close()
    print(f"Seeding completed successfully! Total events inserted: {new_count}")


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    seed_events()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, category, event_date, event_time, venue, capacity, fee, icon FROM events")
    rows = cursor.fetchall()
    print("\n--- Current Events in Database ---")
    for r in rows:
        d = dict(r)
        print(f"[{d['id']:2d}] {d['icon']} {d['title']} | {d['category']} | {d['event_date']} {d['event_time']} | {d['venue']} | Cap: {d['capacity']} | Fee: ₹{d['fee']}")
    conn.close()
