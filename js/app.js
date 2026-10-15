// Zenith '26 — Student Portal Frontend Controller (app.js)

let currentCategory = "all";
let currentSearch = "";
let searchDebounceTimer = null;
let currentEventData = null;

// Category Badge Color Palette
const categoryColors = {
  Technical: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/25",
  },
  Cultural: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/25",
  },
  Sports: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
  },
  Gaming: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/25",
  },
  Workshop: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/25",
  },
};

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadEvents();
});

// Event Listeners Setup
function setupEventListeners() {
  // Category Filter Buttons
  const catButtons = document.querySelectorAll(".category-btn");
  catButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      catButtons.forEach((b) => {
        b.classList.remove(
          "active-filter",
          "bg-indigo-600",
          "text-white",
          "shadow-md",
          "shadow-indigo-600/30"
        );
        b.classList.add("bg-slate-800", "text-slate-300", "border", "border-slate-700");
      });
      btn.classList.add(
        "active-filter",
        "bg-indigo-600",
        "text-white",
        "shadow-md",
        "shadow-indigo-600/30"
      );
      btn.classList.remove("bg-slate-800", "text-slate-300", "border-slate-700");

      currentCategory = btn.getAttribute("data-category") || "all";
      loadEvents();
    });
  });

  // Search Input with Debounce
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");

  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val.length > 0) {
      clearSearchBtn.classList.remove("hidden");
    } else {
      clearSearchBtn.classList.add("hidden");
    }

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentSearch = val;
      loadEvents();
    }, 280);
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    currentSearch = "";
    loadEvents();
  });

  // Retry Button on Network Error
  const retryBtn = document.getElementById("retry-btn");
  if (retryBtn) {
    retryBtn.addEventListener("click", () => loadEvents());
  }

  // Reset Filters Button on Empty State
  const resetFiltersBtn = document.getElementById("reset-filters-btn");
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      currentCategory = "all";
      currentSearch = "";
      searchInput.value = "";
      clearSearchBtn.classList.add("hidden");

      // Reset button styles
      catButtons.forEach((b) => {
        if (b.getAttribute("data-category") === "all") {
          b.classList.add("active-filter", "bg-indigo-600", "text-white");
          b.classList.remove("bg-slate-800", "text-slate-300");
        } else {
          b.classList.remove("active-filter", "bg-indigo-600", "text-white");
          b.classList.add("bg-slate-800", "text-slate-300");
        }
      });

      loadEvents();
    });
  }

  // Modal Close Handlers
  const modal = document.getElementById("detail-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelFormBtn = document.getElementById("cancel-form-btn");

  const closeModal = () => {
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    resetForm();
  };

  closeModalBtn.addEventListener("click", closeModal);
  cancelFormBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Registration Form Submit Handler
  const regForm = document.getElementById("registration-form");
  regForm.addEventListener("submit", handleRegistrationSubmit);
}

// Fetch and Render Events from API (GET /api/events)
async function loadEvents() {
  const loadingContainer = document.getElementById("loading-state");
  const errorContainer = document.getElementById("error-state");
  const emptyContainer = document.getElementById("empty-state");
  const gridContainer = document.getElementById("events-grid");
  const countBadge = document.getElementById("events-count-badge");

  // Show loading
  loadingContainer.classList.remove("hidden");
  errorContainer.classList.add("hidden");
  emptyContainer.classList.add("hidden");
  gridContainer.innerHTML = "";
  countBadge.textContent = "Loading...";

  // Build query string
  const params = new URLSearchParams();
  if (currentCategory && currentCategory !== "all") {
    params.append("category", currentCategory);
  }
  if (currentSearch && currentSearch.trim()) {
    params.append("search", currentSearch.trim());
  }

  const url = `/api/events${params.toString() ? "?" + params.toString() : ""}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
    }

    const events = await res.json();
    loadingContainer.classList.add("hidden");

    countBadge.textContent = `${events.length} Event${events.length === 1 ? "" : "s"}`;

    if (events.length === 0) {
      emptyContainer.classList.remove("hidden");
      return;
    }

    // Render Event Cards
    events.forEach((event, index) => {
      const card = createEventCard(event, index);
      gridContainer.appendChild(card);
    });
  } catch (err) {
    loadingContainer.classList.add("hidden");
    errorContainer.classList.remove("hidden");
    const errorMsg = document.getElementById("error-message");
    errorMsg.textContent = `Could not load events: ${err.message}. Please check if the FastAPI server is running.`;
    countBadge.textContent = "Error";
    console.error("Error loading events:", err);
  }
}

// Create an Event Card Element
function createEventCard(event, index) {
  const card = document.createElement("div");
  card.className =
    "card-animate group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between";
  card.style.animationDelay = `${index * 40}ms`;

  const isFull = event.available_seats <= 0;
  const catStyle = categoryColors[event.category] || {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/25",
  };

  // Capacity fill percentage
  const seatsUsed = event.capacity - event.available_seats;
  const pctUsed = Math.min(100, Math.round((seatsUsed / event.capacity) * 100));

  card.innerHTML = `
    <div>
      <!-- Top Row: Icon, Category Badge, Fee Pill -->
      <div class="flex items-center justify-between gap-2 mb-4">
        <div class="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
          ${event.icon || "🎉"}
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${catStyle.bg} ${catStyle.text} border ${catStyle.border}">
            ${event.category}
          </span>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${
            event.fee === 0
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
              : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/25"
          }">
            ${event.fee === 0 ? "Free" : "₹" + event.fee}
          </span>
        </div>
      </div>

      <!-- Title & Description Snippet -->
      <h3 class="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors tracking-tight mb-2">
        ${escapeHtml(event.title)}
      </h3>
      <p class="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
        ${escapeHtml(event.description || "Join this exciting fest event at Zenith '26.")}
      </p>

      <!-- Details: Date/Time & Venue -->
      <div class="space-y-1.5 text-xs text-slate-300 mb-5">
        <div class="flex items-center gap-2">
          <span class="text-indigo-400">📅</span>
          <span>${escapeHtml(event.event_date)} • ${escapeHtml(event.event_time)}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-pink-400">📍</span>
          <span class="truncate">${escapeHtml(event.venue)}</span>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Seat Capacity & Action Button -->
    <div class="pt-4 border-t border-slate-800/80">
      <div class="flex items-center justify-between text-xs mb-2">
        <span class="text-slate-400 font-medium">Availability</span>
        ${
          isFull
            ? `<span class="px-2 py-0.5 rounded font-black text-xs bg-red-500/20 text-red-400 border border-red-500/40 uppercase tracking-wider animate-pulse">FULL</span>`
            : `<span class="font-semibold text-slate-200">
                <strong class="text-emerald-400">${event.available_seats}</strong> / ${event.capacity} seats left
              </span>`
        }
      </div>

      <!-- Capacity Progress Bar -->
      <div class="w-full bg-slate-950 rounded-full h-1.5 mb-4 overflow-hidden border border-slate-800">
        <div class="h-1.5 rounded-full transition-all duration-500 ${
          isFull
            ? "bg-red-500"
            : pctUsed >= 85
            ? "bg-amber-500"
            : "bg-gradient-to-r from-indigo-500 to-emerald-400"
        }" style="width: ${pctUsed}%;"></div>
      </div>

      <!-- View Details Button -->
      <button 
        data-event-id="${event.id}" 
        class="view-details-btn w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
          isFull
            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99]"
        }"
      >
        <span>View Details</span>
        <span>→</span>
      </button>
    </div>
  `;

  // Attach Click Listener to open modal
  const viewBtn = card.querySelector(".view-details-btn");
  viewBtn.addEventListener("click", () => openEventModal(event.id));

  return card;
}

// Open Event Detail & Registration Modal
async function openEventModal(eventId) {
  const modal = document.getElementById("detail-modal");
  resetForm();

  try {
    const res = await fetch(`/api/events/${eventId}`);
    if (!res.ok) {
      throw new Error(`Event not found (HTTP ${res.status})`);
    }

    const event = await res.json();
    currentEventData = event;

    // Populate Modal Content
    document.getElementById("form-event-id").value = event.id;
    document.getElementById("modal-icon").textContent = event.icon || "🎉";
    document.getElementById("modal-title").textContent = event.title;
    document.getElementById("modal-category").textContent = event.category;
    document.getElementById("modal-datetime").textContent = `${event.event_date} • ${event.event_time}`;
    document.getElementById("modal-venue").textContent = event.venue;
    document.getElementById("modal-fee").textContent = event.fee === 0 ? "Free Entry" : `₹${event.fee}`;
    document.getElementById("modal-seats").textContent =
      event.available_seats <= 0 ? "Sold Out" : `${event.available_seats} / ${event.capacity} seats left`;
    document.getElementById("modal-description").textContent =
      event.description || "No further details provided for this event.";

    // If event is full, disable the submit button and show notice
    const submitBtn = document.getElementById("submit-reg-btn");
    const errorBox = document.getElementById("form-error-box");
    const errorText = document.getElementById("form-error-text");

    if (event.available_seats <= 0) {
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-50", "cursor-not-allowed");
      document.getElementById("submit-btn-text").textContent = "Event is Full";
      errorBox.classList.remove("hidden");
      errorText.textContent = "This event is currently at full capacity. Registrations are closed.";
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
      document.getElementById("submit-btn-text").textContent = "Confirm Registration";
      errorBox.classList.add("hidden");
    }

    // Show Modal
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  } catch (err) {
    alert(`Could not load event details: ${err.message}`);
  }
}

// Reset Registration Form State
function resetForm() {
  const regForm = document.getElementById("registration-form");
  regForm.reset();
  document.getElementById("form-error-box").classList.add("hidden");
  document.getElementById("form-success-box").classList.add("hidden");
  document.getElementById("submit-btn-spinner").classList.add("hidden");
  document.getElementById("submit-btn-text").textContent = "Confirm Registration";
  document.getElementById("submit-reg-btn").disabled = false;
}

// Handle Form Submission (POST /api/events/{event_id}/register)
async function handleRegistrationSubmit(e) {
  e.preventDefault();

  const eventId = document.getElementById("form-event-id").value;
  const nameInput = document.getElementById("student-name");
  const rollInput = document.getElementById("roll-number");
  const emailInput = document.getElementById("student-email");
  const phoneInput = document.getElementById("student-phone");

  const errorBox = document.getElementById("form-error-box");
  const errorText = document.getElementById("form-error-text");
  const successBox = document.getElementById("form-success-box");
  const successText = document.getElementById("form-success-text");
  const submitBtn = document.getElementById("submit-reg-btn");
  const spinner = document.getElementById("submit-btn-spinner");

  // Reset notifications
  errorBox.classList.add("hidden");
  successBox.classList.add("hidden");

  // Client-Side Validation
  const student_name = nameInput.value.trim();
  const roll_number = rollInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const phone = phoneInput.value.trim();

  if (!student_name) {
    showFormError("Please enter your full name.");
    nameInput.focus();
    return;
  }
  if (!roll_number) {
    showFormError("Please enter your student roll number.");
    rollInput.focus();
    return;
  }
  if (!email) {
    showFormError("Please enter your student email address.");
    emailInput.focus();
    return;
  }
  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    showFormError("Please provide a valid email containing '@' and a domain.");
    emailInput.focus();
    return;
  }

  // Set loading state
  submitBtn.disabled = true;
  spinner.classList.remove("hidden");
  document.getElementById("submit-btn-text").textContent = "Registering...";

  try {
    const res = await fetch(`/api/events/${eventId}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_name,
        roll_number,
        email,
        phone: phone || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Show exact server error message (e.g. 400 "Invalid email", 409 "Event is full" or "Already registered")
      const message = data.detail || "Registration could not be completed.";
      showFormError(message);
      submitBtn.disabled = false;
      spinner.classList.add("hidden");
      document.getElementById("submit-btn-text").textContent = "Confirm Registration";
      return;
    }

    // Success (201)
    spinner.classList.add("hidden");
    document.getElementById("submit-btn-text").textContent = "Registered!";
    successBox.classList.remove("hidden");
    successText.innerHTML = `Congratulations <strong>${escapeHtml(
      data.student_name
    )}</strong>! You are officially registered for <strong>${escapeHtml(
      currentEventData?.title || "this event"
    )}</strong>. Confirmation ID #${data.id}.`;

    // Refresh the event grid in the background to update seat count immediately
    loadEvents();

    // Auto close modal after 2.5 seconds
    setTimeout(() => {
      const modal = document.getElementById("detail-modal");
      modal.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
      resetForm();
    }, 2400);
  } catch (err) {
    showFormError(`Network error: ${err.message}. Please check your connection.`);
    submitBtn.disabled = false;
    spinner.classList.add("hidden");
    document.getElementById("submit-btn-text").textContent = "Confirm Registration";
  }
}

function showFormError(msg) {
  const errorBox = document.getElementById("form-error-box");
  const errorText = document.getElementById("form-error-text");
  errorText.textContent = msg;
  errorBox.classList.remove("hidden");
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
