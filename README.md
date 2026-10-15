# Zenith '26 — College Fest Management System ⚡

A modern, full-stack event registration and coordinator management system built for the **Zenith '26 College Fest** (Nov 14–15, 2026). Designed as a hands-on capstone project pairing with **PM2-01 (How Software Works)** and **PM2-02 (Front-End, Back-End & Mobile)**.

---

## 🚀 Tech Stack

- **Frontend:** HTML5, Tailwind CSS (via Play CDN), Vanilla JavaScript (ES6+ modular controllers)
- **Backend:** Python 3.12, FastAPI, Uvicorn, Pydantic v2
- **Database:** SQLite (`fest.db`), with transactional queries and foreign key constraints
- **Data Ingestion:** OpenPyXL spreadsheet parser (`events_seed.xlsx`)
- **API Testing:** Postman (`zenith26-api.postman_collection.json`)

---

## 📁 Project Architecture

```
zenith26-fest-system/
├── backend/
│   ├── database.py       # SQLite connection helper, table schema & init
│   ├── models.py         # Pydantic schema validation & API contracts
│   ├── seed_data.py      # Spreadsheet loader reading data/events_seed.xlsx
│   └── main.py           # FastAPI application, REST endpoints, static mounting
├── frontend/
│   ├── index.html        # Student event discovery portal & registration modal
│   ├── admin.html        # Fest coordinator operational analytics dashboard
│   └── js/
│       ├── app.js        # Event card rendering, search/category query, registration
│       └── admin.js      # Live stats polling, demand sorting, registration manager
├── data/
│   └── events_seed.xlsx  # 14 seed events across Technical, Cultural, Sports, etc.
├── fest.db               # Local SQLite database file (created on startup)
├── requirements.txt      # Python dependencies
├── zenith26-api.postman_collection.json  # Postman test collection
└── README.md             # Documentation
```

---

## 🛠️ How to Run

### 1. Set Up the Python Virtual Environment
Open PowerShell inside the project directory:
```powershell
cd zenith26-fest-system
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Run Database Seeding (Optional - runs automatically on server start)
```powershell
python -m backend.seed_data
```

### 4. Start the Application Server
```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

### 5. Access the Interfaces
- **Student Event Portal:** [http://localhost:8000/](http://localhost:8000/)
- **Admin Coordinator Dashboard:** [http://localhost:8000/admin.html](http://localhost:8000/admin.html)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 REST API Contract

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/events` | List all events (optional `?category=` & `?search=`). Computes live `available_seats`. | `200 OK` |
| `GET` | `/api/events/{id}` | Retrieve single event detail by ID. | `200 OK`, `404 Not Found` |
| `POST` | `/api/events/{id}/register` | Register a student for an event with server-side validation. | `201 Created`, `400 Bad Request`, `404 Not Found`, `409 Conflict` |
| `GET` | `/api/registrations` | List student registrations (optional `?event_id=`). | `200 OK` |
| `GET` | `/api/stats` | Live fest metrics: total events, registrations, utilization %, category counts. | `200 OK` |
| `POST` | `/api/events` | *(Stretch)* Admin creates a new fest event. | `201 Created`, `400 Bad Request` |
| `DELETE` | `/api/registrations/{id}` | *(Stretch)* Admin cancels a registration and frees up a seat. | `200 OK`, `404 Not Found` |

---

## 🛡️ "Never Trust the Client" Validation Rules

The server re-checks all constraints independently:
1. **Required Fields:** `student_name`, `roll_number`, and `email` cannot be empty.
2. **Email Formatting:** Must contain `@` with a valid structure.
3. **Capacity Ceiling:** Checks `COUNT(registrations) < capacity`. Returns `409 "Event is full"` if exhausted.
4. **Duplicate Prevention:** Database uniqueness on `(event_id, email)` prevents multiple registrations per student per event (`409 "Already registered"`).
5. **Dynamic Source of Truth:** `available_seats` is computed on-demand (`capacity - count`), preventing state drift.

---

## 🧪 Postman Automated Testing

Import `zenith26-api.postman_collection.json` into Postman to run tests covering:
- Category filtering & title search queries
- Successful registration (201)
- Validation failure (400)
- Duplicate registration conflict (409)
- Event not found (404)
- Live stats aggregation
- Admin stretch endpoints (Create event & delete registration)
