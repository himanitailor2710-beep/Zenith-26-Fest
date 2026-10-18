// Zenith '26 — Admin Coordinator Dashboard Controller (admin.js)

let allEventsCache = [];

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
    tabEventsBtn.classList.add("border-indigo-500", "text-indigo-400");
    tabEventsBtn.classList.remove("border-transparent", "text-slate-400");
    tabRegistrationsBtn.classList.remove("border-indigo-500", "text-indigo-400");
    tabRegistrationsBtn.classList.add("border-transparent", "text-slate-400");

    eventsContent.classList.remove("hidden");
    registrationsContent.classList.add("hidden");
  });

  tabRegistrationsBtn.addEventListener("click", () => {
    tabRegistrationsBtn.classList.add("border-indigo-500", "text-indigo-400");
    tabRegistrationsBtn.classList.remove("border-transparent", "text-slate-400");
    tabEventsBtn.classList.remove("border-indigo-500", "text-indigo-400");
    tabEventsBtn.classList.add("border-transparent", "text-slate-400");

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
  filterDropdown.addEventListener("change", (e) => {
    loadRegistrations(e.target.value);
  });

  // Create Event Modal Triggers (Stretch Goal)
  const createModal = document.getElementById("create-event-modal");
  const openCreateBtn = document.getElementById("open-create-event-btn");
  const closeCreateBtn = document.getElementById("close-create-event-btn");
  const cancelCreateBtn = document.getElementById("cancel-create-event-btn");

  const openModal = () => createModal.classList.remove("hidden");
  const closeModal = () => {
    createModal.classList.add("hidden");
    document.getElementById("create-event-form").reset();
    document.getElementById("create-event-error").classList.add("hidden");
    document.getElementById("create-event-success").classList.add("hidden");
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
      "bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm";
    card.innerHTML = `
      <div class="text-xl mb-1">${icon}</div>
      <div class="text-xs font-semibold text-slate-300 truncate w-full">${cat}</div>
      <div class="text-lg font-black text-indigo-400 mt-0.5">${count} <span class="text-[10px] text-slate-400 font-normal">events</span></div>
    `;
    catContainer.appendChild(card);
  });
}

// Render Events Demand Table (Sorted by Utilization % Descending)
function renderEventsTable(events) {
  const tbody = document.getElementById("events-table-body");
  tbody.innerHTML = "";

  if (events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400">No events found in database.</td></tr>`;
    return;
  }

  // Calculate live utilization for each event and sort descending
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

  // Sort descending by utilization percentage
  enrichedEvents.sort((a, b) => b.utilizationPct - a.utilizationPct);

  enrichedEvents.forEach((ev) => {
    const tr = document.createElement("tr");
    const isCritical = ev.utilizationPct >= 90;
    const isFull = ev.available_seats <= 0;

    // Row styling: highlight warning if >90%
    if (isCritical) {
      tr.className =
        "bg-red-950/20 hover:bg-red-950/30 border-l-4 border-l-red-500 transition-colors";
    } else {
      tr.className = "hover:bg-slate-800/40 transition-colors";
    }

    tr.innerHTML = `
      <td class="py-3 px-4">
        <div class="flex items-center gap-2.5">
          <span class="text-xl">${ev.icon || "🎉"}</span>
          <div>
            <div class="font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>${escapeHtml(ev.title)}</span>
              ${
                isFull
                  ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/40">FULL</span>`
                  : isCritical
                  ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">&gt;90% CAP</span>`
                  : ""
              }
            </div>
            <div class="text-[11px] text-slate-400">ID #${ev.id}</div>
          </div>
        </div>
      </td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          ${escapeHtml(ev.category)}
        </span>
      </td>
      <td class="py-3 px-4 text-xs text-slate-300">
        <div>${escapeHtml(ev.event_date)}</div>
        <div class="text-slate-400 text-[11px]">${escapeHtml(ev.event_time)}</div>
      </td>
      <td class="py-3 px-4 text-xs text-slate-300 truncate max-w-[140px]">
        ${escapeHtml(ev.venue)}
      </td>
      <td class="py-3 px-4 text-center text-xs">
        <span class="font-bold ${isCritical ? "text-red-400" : "text-slate-200"}">${ev.registered}</span>
        <span class="text-slate-400"> / ${ev.capacity}</span>
      </td>
      <td class="py-3 px-4 text-right">
        <div class="inline-flex flex-col items-end">
          <span class="text-sm font-black ${
            isCritical ? "text-red-400 animate-pulse font-mono" : "text-slate-200 font-mono"
          }">${ev.utilizationPct}%</span>
          <div class="w-16 bg-slate-950 rounded-full h-1 mt-1 overflow-hidden border border-slate-800">
            <div class="h-1 ${isCritical ? "bg-red-500" : "bg-indigo-500"} rounded-full" style="width: ${Math.min(100, ev.utilizationPct)}%"></div>
          </div>
        </div>
      </td>
      <td class="py-3 px-4 text-center">
        <button 
          data-event-id="${ev.id}" 
          class="view-ev-regs-btn px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all"
        >
          View Regs (${ev.registered})
        </button>
      </td>
    `;

    // Hook View Regs button
    const viewBtn = tr.querySelector(".view-ev-regs-btn");
    viewBtn.addEventListener("click", () => {
      document.getElementById("tab-registrations-btn").click();
      document.getElementById("filter-reg-event").value = ev.id;
      loadRegistrations(ev.id);
    });

    tbody.appendChild(tr);
  });
}

// Populate Event Filter Dropdown
function populateEventFilterDropdown(events) {
  const dropdown = document.getElementById("filter-reg-event");
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
  const tbody = document.getElementById("registrations-table-body");
  const countLabel = document.getElementById("reg-count-label");

  tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400">Loading registrations...</td></tr>`;

  let url = "/api/registrations";
  if (eventIdFilter) {
    url += `?event_id=${eventIdFilter}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const registrations = await res.json();

    countLabel.textContent = `Showing ${registrations.length} registration${
      registrations.length === 1 ? "" : "s"
    }`;

    if (registrations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400">No registrations recorded${
        eventIdFilter ? " for this event" : ""
      }.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    registrations.forEach((reg) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-800/40 transition-colors";
      tr.innerHTML = `
        <td class="py-3 px-4 font-mono text-xs text-indigo-400 font-bold">#${reg.id}</td>
        <td class="py-3 px-4 font-bold text-white text-xs sm:text-sm">${escapeHtml(reg.student_name)}</td>
        <td class="py-3 px-4 font-mono text-xs text-slate-300">${escapeHtml(reg.roll_number)}</td>
        <td class="py-3 px-4 text-xs text-slate-300 font-mono">${escapeHtml(reg.email)}</td>
        <td class="py-3 px-4 text-xs text-slate-400">${escapeHtml(reg.phone || "—")}</td>
        <td class="py-3 px-4 text-xs font-semibold text-indigo-300">${escapeHtml(reg.event_title)}</td>
        <td class="py-3 px-4 text-xs text-slate-400">${escapeHtml(reg.registered_at)}</td>
        <td class="py-3 px-4 text-center">
          <button 
            data-reg-id="${reg.id}" 
            data-student="${escapeHtml(reg.student_name)}" 
            data-event="${escapeHtml(reg.event_title)}"
            class="delete-reg-btn px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 border border-red-800/60 transition-all"
            title="Cancel this registration"
          >
            Cancel
          </button>
        </td>
      `;

      // Cancel/Delete Registration (Stretch Goal 2)
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

// Cancel / Delete Registration Handler (Stretch Goal 2)
async function handleDeleteRegistration(regId, studentName, eventTitle) {
  const confirmed = confirm(
    `Are you sure you want to cancel the registration for:\nStudent: ${studentName}\nEvent: ${eventTitle}?\n\nThis will immediately free up 1 seat for this event.`
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/registrations/${regId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Could not cancel registration: ${err.detail || res.statusText}`);
      return;
    }

    // Refresh both tables and stats immediately
    const filterVal = document.getElementById("filter-reg-event").value;
    loadRegistrations(filterVal);
    loadDashboardData();
  } catch (err) {
    alert(`Network error cancelling registration: ${err.message}`);
  }
}

// Handle Admin Adding New Event (Stretch Goal 1)
async function handleCreateEventSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("new-event-title").value.trim();
  const category = document.getElementById("new-event-category").value;
  const icon = document.getElementById("new-event-icon").value.trim() || "🎉";
  const event_date = document.getElementById("new-event-date").value;
  const event_time = document.getElementById("new-event-time").value.trim();
  const venue = document.getElementById("new-event-venue").value.trim();
  const capacity = parseInt(document.getElementById("new-event-capacity").value, 10);
  const fee = parseInt(document.getElementById("new-event-fee").value, 10) || 0;
  const description = document.getElementById("new-event-description").value.trim();

  const errBox = document.getElementById("create-event-error");
  const successBox = document.getElementById("create-event-success");
  const submitBtn = document.getElementById("submit-create-event-btn");

  errBox.classList.add("hidden");
  successBox.classList.add("hidden");

  // Client-side validation check
  if (!title || !venue || !event_time || !event_date) {
    errBox.textContent = "Please fill in all required event fields.";
    errBox.classList.remove("hidden");
    return;
  }
  if (isNaN(capacity) || capacity <= 0) {
    errBox.textContent = "Capacity must be a positive number greater than zero.";
    errBox.classList.remove("hidden");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";

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

    const data = await res.json();
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Event";

    if (!res.ok) {
      errBox.textContent = data.detail || "Server rejected event creation.";
      errBox.classList.remove("hidden");
      return;
    }

    successBox.textContent = `Event "${data.title}" created successfully!`;
    successBox.classList.remove("hidden");

    // Refresh dashboard
    loadDashboardData();

    setTimeout(() => {
      document.getElementById("close-create-event-btn").click();
    }, 1500);
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Event";
    errBox.textContent = `Network error: ${err.message}`;
    errBox.classList.remove("hidden");
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
