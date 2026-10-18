// Zenith '26 — Admin Coordinator Dashboard Controller (admin.js)

let allEventsCache = [];

// Multi-Color Word Palette
const WORD_COLORS = [
  "text-pink-400",
  "text-yellow-300",
  "text-cyan-400",
  "text-emerald-400",
  "text-purple-400",
  "text-orange-400",
  "text-rose-400",
  "text-sky-300",
  "text-fuchsia-400",
  "text-amber-300",
  "text-teal-300"
];

function colorizeWords(text) {
  if (!text) return "";
  const words = text.toString().split(" ");
  return words.map((w, i) => {
    if (w === "—" || w === "-" || w === "•" || w === "/" || w === "|") {
      return `<span class="text-slate-400 font-normal">${w}</span>`;
    }
    const colorClass = WORD_COLORS[i % WORD_COLORS.length];
    return `<span class="${colorClass} font-extrabold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">${escapeHtml(w)}</span>`;
  }).join(" ");
}

document.addEventListener("DOMContentLoaded", () => {
  setupAdminListeners();
  loadDashboardData();
});

function setupAdminListeners() {
  // Tab switching
  const tabEventsBtn = document.getElementById("tab-events-btn");
  const tabRegistrationsBtn = document.getElementById("tab-registrations-btn");
  const eventsContent = document.getElementById("events-tab-content");
  const registrationsContent = document.getElementById("registrations-tab-content");

  tabEventsBtn.addEventListener("click", () => {
    tabEventsBtn.className = "pb-3 text-sm font-black border-b-2 border-pink-500 text-pink-400 flex items-center gap-2 transition-colors";
    tabRegistrationsBtn.className = "pb-3 text-sm font-black border-b-2 border-transparent text-slate-400 hover:text-white flex items-center gap-2 transition-colors";

    eventsContent.classList.remove("hidden");
    registrationsContent.classList.add("hidden");
  });

  tabRegistrationsBtn.addEventListener("click", () => {
    tabRegistrationsBtn.className = "pb-3 text-sm font-black border-b-2 border-pink-500 text-pink-400 flex items-center gap-2 transition-colors";
    tabEventsBtn.className = "pb-3 text-sm font-black border-b-2 border-transparent text-slate-400 hover:text-white flex items-center gap-2 transition-colors";

    eventsContent.classList.add("hidden");
    registrationsContent.classList.remove("hidden");
    loadRegistrations();
  });

  // Refresh All Data button
  document.getElementById("refresh-all-btn").addEventListener("click", () => {
    loadDashboardData();
    if (!registrationsContent.classList.contains("hidden")) {
      loadRegistrations();
    }
  });

  // Admin error retry button
  document.getElementById("admin-retry-btn").addEventListener("click", () => {
    loadDashboardData();
  });

  // Filter registrations by event dropdown
  const filterDropdown = document.getElementById("filter-reg-event");
  if (filterDropdown) {
    filterDropdown.addEventListener("change", (e) => {
      loadRegistrations(e.target.value);
    });
  }

  // Create Event Modal Triggers (Stretch Goal)
  const createModal = document.getElementById("create-event-modal");
  const openCreateBtn = document.getElementById("open-create-event-btn");
  const closeCreateBtn = document.getElementById("close-create-event-btn");
  const cancelCreateBtn = document.getElementById("cancel-create-event-btn");

  const openModal = () => createModal.classList.remove("hidden");
  const closeModal = () => {
    createModal.classList.add("hidden");
    document.getElementById("create-event-form").reset();
    const errBox = document.getElementById("create-event-error");
    if (errBox) errBox.classList.add("hidden");
  };

  openCreateBtn.addEventListener("click", openModal);
  closeCreateBtn.addEventListener("click", closeModal);
  cancelCreateBtn.addEventListener("click", closeModal);
  createModal.addEventListener("click", (e) => {
    if (e.target === createModal) closeModal();
  });

  // Handle Create Event Form Submission (Stretch Goal)
  document
    .getElementById("create-event-form")
    .addEventListener("submit", handleCreateEventSubmit);
}

// Load Top Stats & Events Demand Table
async function loadDashboardData() {
  const errorBanner = document.getElementById("admin-error-banner");
  errorBanner.classList.add("hidden");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    // 1. Fetch live stats
    const statsRes = await fetch("/api/stats", { signal: controller.signal });
    if (!statsRes.ok) throw new Error(`HTTP ${statsRes.status} fetching stats`);
    const stats = await statsRes.json();
    renderStats(stats);

    // 2. Fetch all events
    const eventsRes = await fetch("/api/events", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!eventsRes.ok) throw new Error(`HTTP ${eventsRes.status} fetching events`);
    const events = await eventsRes.json();
    allEventsCache = events;

    renderEventsTable(events);
    populateEventFilterDropdown(events);
  } catch (err) {
    console.error("Dashboard data load error:", err);
    errorBanner.classList.remove("hidden");
    document.getElementById("admin-error-msg").textContent = `Could not load dashboard metrics: ${err.message}`;
  }
}

// Render Top Stats Cards & Category Breakdown
function renderStats(stats) {
  document.getElementById("stat-total-events").textContent = stats.total_events;
  document.getElementById("stat-total-registrations").textContent = stats.total_registrations;
  document.getElementById("stat-utilization-pct").textContent = `${stats.overall_utilization_pct}%`;
  document.getElementById(
    "stat-capacity-details"
  ).textContent = `(${stats.total_registrations} / ${stats.total_capacity} seats)`;
  document.getElementById("stat-utilization-bar").style.width = `${Math.min(
    100,
    stats.overall_utilization_pct
  )}%`;
  document.getElementById("stat-upcoming-events").textContent = stats.upcoming_events_count;

  // Category Breakdown
  const catContainer = document.getElementById("category-breakdown-container");
  catContainer.innerHTML = "";

  const categoryIcons = {
    Technical: "💻",
    Cultural: "🎭",
    Sports: "⚽",
    Gaming: "🎮",
    Workshop: "⚡",
  };

  const categories = Object.keys(stats.events_by_category);
  if (categories.length === 0) {
    catContainer.innerHTML = `<div class="text-xs text-slate-400 py-2">No category data recorded</div>`;
    return;
  }

  categories.forEach((cat) => {
    const count = stats.events_by_category[cat];
    const icon = categoryIcons[cat] || "🏷️";
    const card = document.createElement("div");
    card.className =
      "bg-white/15 border border-white/25 hover:border-pink-400/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md backdrop-blur-xl transition-all hover:scale-105 ring-1 ring-white/10";
    card.innerHTML = `
      <div class="text-2xl mb-1">${icon}</div>
      <div class="text-xs font-black text-slate-100 truncate w-full">${cat}</div>
      <div class="text-lg font-black text-pink-300 mt-1">${count} <span class="text-[10px] text-yellow-300 font-bold">events</span></div>
    `;
    catContainer.appendChild(card);
  });
}

// Render Events Demand Table (Sorted by Utilization % Descending)
function renderEventsTable(events) {
  const tbody = document.getElementById("events-demand-tbody") || document.getElementById("events-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-300">No events found in database.</td></tr>`;
    return;
  }

  const enrichedEvents = events.map((event) => {
    const registered = event.capacity - event.available_seats;
    const utilizationPct =
      event.capacity > 0 ? (registered / event.capacity) * 100 : 0;
    return {
      ...event,
      registered,
      utilizationPct: Math.round(utilizationPct * 10) / 10,
    };
  });

  enrichedEvents.sort((a, b) => b.utilizationPct - a.utilizationPct);

  enrichedEvents.forEach((ev) => {
    const tr = document.createElement("tr");
    const isCritical = ev.utilizationPct >= 90;
    const isFull = ev.available_seats <= 0;

    if (isCritical) {
      tr.className =
        "bg-red-950/40 hover:bg-red-950/50 border-l-4 border-l-red-500 transition-colors";
    } else {
      tr.className = "hover:bg-white/10 transition-colors";
    }

    tr.innerHTML = `
      <td class="py-3.5 px-5">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${ev.icon || "🎉"}</span>
          <div>
            <div class="font-black text-white tracking-tight flex items-center gap-2">
              <span>${colorizeWords(ev.title)}</span>
              ${
                isFull
                  ? `<span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/40">FULL</span>`
                  : isCritical
                  ? `<span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">&gt;90%</span>`
                  : ""
              }
            </div>
            <div class="text-[11px] text-slate-400 font-bold">ID #${ev.id}</div>
          </div>
        </div>
      </td>
      <td class="py-3.5 px-5">
        <span class="px-3 py-1 rounded-full text-xs font-black bg-white/10 text-cyan-300 border border-cyan-400/30">
          ${escapeHtml(ev.category)}
        </span>
      </td>
      <td class="py-3.5 px-5 text-xs text-slate-200">
        <div class="font-bold text-pink-300">${escapeHtml(ev.event_date)}</div>
        <div class="text-yellow-300 text-[11px] font-bold">${escapeHtml(ev.event_time)}</div>
      </td>
      <td class="py-3.5 px-5 text-xs text-slate-200 truncate max-w-[150px] font-bold">
        ${colorizeWords(ev.venue)}
      </td>
      <td class="py-3.5 px-5 text-center text-xs">
        <span class="font-black text-sm ${isCritical ? "text-red-400" : "text-emerald-400"}">${ev.registered}</span>
        <span class="text-slate-400"> / ${ev.capacity}</span>
      </td>
      <td class="py-3.5 px-5 text-center">
        <div class="inline-flex flex-col items-center">
          <span class="text-sm font-black ${
            isCritical ? "text-red-400 animate-pulse font-mono" : "text-slate-100 font-mono"
          }">${ev.utilizationPct}%</span>
          <div class="w-16 bg-black/60 rounded-full h-1.5 mt-1 overflow-hidden border border-white/10">
            <div class="h-1.5 ${isCritical ? "bg-red-500" : "bg-gradient-to-r from-pink-500 to-cyan-400"} rounded-full" style="width: ${Math.min(100, ev.utilizationPct)}%"></div>
          </div>
        </div>
      </td>
      <td class="py-3.5 px-5 text-right font-black text-emerald-300">
        ${ev.fee === 0 ? "Free" : "₹" + ev.fee}
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Populate Event Filter Dropdown
function populateEventFilterDropdown(events) {
  const dropdown = document.getElementById("filter-reg-event");
  if (!dropdown) return;
  const selected = dropdown.value;
  dropdown.innerHTML = `<option value="">All Events (Full List)</option>`;

  events.forEach((ev) => {
    const opt = document.createElement("option");
    opt.value = ev.id;
    opt.textContent = `#${ev.id} — ${ev.title} (${ev.category})`;
    dropdown.appendChild(opt);
  });

  if (selected) dropdown.value = selected;
}

// Fetch and Render Raw Registrations List
async function loadRegistrations(eventIdFilter = "") {
  const tbody = document.getElementById("registrations-tbody") || document.getElementById("registrations-table-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400">Loading registrations...</td></tr>`;

  let url = "/api/registrations";
  if (eventIdFilter) {
    url += `?event_id=${eventIdFilter}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const registrations = await res.json();

    if (registrations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400">No registrations recorded${
        eventIdFilter ? " for this event" : ""
      }.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    registrations.forEach((reg) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-white/5 transition-colors";
      tr.innerHTML = `
        <td class="py-3.5 px-5 font-mono text-xs text-pink-400 font-black">#${reg.id}</td>
        <td class="py-3.5 px-5 font-black text-white text-xs sm:text-sm">${escapeHtml(reg.student_name)}</td>
        <td class="py-3.5 px-5 font-mono text-xs text-yellow-300 font-bold">${escapeHtml(reg.roll_number)}</td>
        <td class="py-3.5 px-5 text-xs text-cyan-300 font-mono">${escapeHtml(reg.email)}</td>
        <td class="py-3.5 px-5 text-xs font-black text-purple-300">${colorizeWords(reg.event_title)}</td>
        <td class="py-3.5 px-5 text-xs text-slate-400 font-medium">${escapeHtml(reg.registered_at)}</td>
        <td class="py-3.5 px-5 text-center">
          <button 
            data-reg-id="${reg.id}" 
            data-student="${escapeHtml(reg.student_name)}" 
            data-event="${escapeHtml(reg.event_title)}"
            class="delete-reg-btn px-3 py-1 rounded-xl text-xs font-black bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white border border-red-800 transition-all shadow-md"
            title="Cancel this registration"
          >
            Cancel
          </button>
        </td>
      `;

      const delBtn = tr.querySelector(".delete-reg-btn");
      delBtn.addEventListener("click", () => {
        handleDeleteRegistration(reg.id, reg.student_name, reg.event_title);
      });

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading registrations:", err);
    tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-red-400">Failed to load registrations: ${err.message}</td></tr>`;
  }
}

// Cancel / Delete Registration Handler
async function handleDeleteRegistration(regId, studentName, eventTitle) {
  const confirmed = confirm(
    `Are you sure you want to cancel the registration for ${studentName} from "${eventTitle}"? This will free up 1 seat immediately.`
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/registrations/${regId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || `Server returned HTTP ${res.status}`);
    }

    loadDashboardData();
    const filterVal = document.getElementById("filter-reg-event")?.value || "";
    loadRegistrations(filterVal);
  } catch (err) {
    alert(`Could not cancel registration: ${err.message}`);
  }
}

// Handle Create Event Form Submission (POST /api/events)
async function handleCreateEventSubmit(e) {
  e.preventDefault();
  const errorBox = document.getElementById("create-event-error");
  errorBox.classList.add("hidden");

  const title = document.getElementById("new-event-title").value.trim();
  const category = document.getElementById("new-event-category").value;
  const icon = document.getElementById("new-event-icon").value.trim() || "⚡";
  const event_date = document.getElementById("new-event-date").value.trim();
  const event_time = document.getElementById("new-event-time").value.trim();
  const venue = document.getElementById("new-event-venue").value.trim();
  const capacity = parseInt(document.getElementById("new-event-capacity").value, 10);
  const fee = parseInt(document.getElementById("new-event-fee").value, 10) || 0;
  const description = document.getElementById("new-event-description").value.trim();

  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        icon,
        event_date,
        event_time,
        venue,
        capacity,
        fee,
        description,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || `HTTP ${res.status}`);
    }

    document.getElementById("create-event-modal").classList.add("hidden");
    document.getElementById("create-event-form").reset();
    loadDashboardData();
  } catch (err) {
    errorBox.classList.remove("hidden");
    errorBox.textContent = `Error creating event: ${err.message}`;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
