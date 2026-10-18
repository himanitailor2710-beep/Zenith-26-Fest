// Zenith '26 — Student Portal Frontend Controller (app.js)

let currentCategory = "all";
let currentSearch = "";
let searchDebounceTimer = null;
let currentEventData = null;

// Multi-Color Vibrant Word Color Palette (Artistic & Eye-Catching)
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

// Helper: Colorize Every Single Word in Text
function colorizeWords(text) {
  if (!text) return "";
  const words = text.toString().split(" ");
  return words.map((w, i) => {
    if (w === "—" || w === "-" || w === "•" || w === "/" || w === "|" || w === "&") {
      return `<span class="text-slate-400 font-normal">${w}</span>`;
    }
    const colorClass = WORD_COLORS[i % WORD_COLORS.length];
    return `<span class="${colorClass} font-extrabold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">${escapeHtml(w)}</span>`;
  }).join(" ");
}

// Category Badge Color Palette with Neon Glowing Accents
const categoryColors = {
  Technical: {
    bg: "bg-cyan-950/70",
    text: "text-cyan-300",
    border: "border-cyan-400/40",
    glow: "shadow-[0_0_12px_rgba(6,182,212,0.35)]"
  },
  Cultural: {
    bg: "bg-pink-950/70",
    text: "text-pink-300",
    border: "border-pink-400/40",
    glow: "shadow-[0_0_12px_rgba(236,72,153,0.35)]"
  },
  Sports: {
    bg: "bg-emerald-950/70",
    text: "text-emerald-300",
    border: "border-emerald-400/40",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.35)]"
  },
  Gaming: {
    bg: "bg-purple-950/70",
    text: "text-purple-300",
    border: "border-purple-400/40",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.35)]"
  },
  Workshop: {
    bg: "bg-amber-950/70",
    text: "text-amber-300",
    border: "border-amber-400/40",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.35)]"
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
          "bg-gradient-to-r",
          "from-pink-500",
          "via-purple-600",
          "to-indigo-600",
          "text-white",
          "border-pink-400/40"
        );
        b.classList.add("bg-black/45", "text-slate-300", "border-white/10");
      });
      btn.classList.add(
        "active-filter",
        "bg-gradient-to-r",
        "from-pink-500",
        "via-purple-600",
        "to-indigo-600",
        "text-white",
        "border-pink-400/40"
      );
      btn.classList.remove("bg-black/45", "text-slate-300", "border-white/10");

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

      catButtons.forEach((b) => {
        if (b.getAttribute("data-category") === "all") {
          b.classList.add("active-filter", "bg-gradient-to-r", "from-pink-500", "via-purple-600", "to-indigo-600", "text-white", "border-pink-400/40");
          b.classList.remove("bg-black/45", "text-slate-300", "border-white/10");
        } else {
          b.classList.remove("active-filter", "bg-gradient-to-r", "from-pink-500", "via-purple-600", "to-indigo-600", "text-white", "border-pink-400/40");
          b.classList.add("bg-black/45", "text-slate-300", "border-white/10");
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
    }

    const events = await res.json();
    loadingContainer.classList.add("hidden");

    countBadge.innerHTML = `<span class="text-emerald-400 font-black">${events.length}</span> <span class="text-yellow-300">Event${events.length === 1 ? "" : "s"}</span>`;

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

// Create an Event Card Element (Frosted Glassmorphism + Multi-Colored Words)
function createEventCard(event, index) {
  const card = document.createElement("div");
  card.className =
    "card-animate group bg-black/45 hover:bg-slate-950/65 backdrop-blur-xl border border-white/15 hover:border-pink-500/60 rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:shadow-[0_0_35px_rgba(236,72,153,0.35)] transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 ring-1 ring-white/5";
  card.style.animationDelay = `${index * 40}ms`;

  const isFull = event.available_seats <= 0;
  const catStyle = categoryColors[event.category] || {
    bg: "bg-pink-950/70",
    text: "text-pink-300",
    border: "border-pink-400/40",
    glow: "shadow-[0_0_12px_rgba(236,72,153,0.35)]",
  };

  const seatsUsed = event.capacity - event.available_seats;
  const pctUsed = Math.min(100, Math.round((seatsUsed / event.capacity) * 100));

  card.innerHTML = `
    <div>
      <!-- Top Row: Icon, Category Badge, Fee Pill -->
      <div class="flex items-center justify-between gap-2 mb-4">
        <div class="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
          ${event.icon || "🎉"}
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-black ${catStyle.bg} ${catStyle.text} border ${catStyle.border} ${catStyle.glow}">
            ${event.category}
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-black ${
            event.fee === 0
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              : "bg-pink-500/20 text-pink-300 border border-pink-400/40 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
          }">
            ${event.fee === 0 ? "Free Entry" : "₹" + event.fee}
          </span>
        </div>
      </div>

      <!-- Title: Every Single Word Distinctly Colored -->
      <h3 class="text-lg font-black tracking-tight mb-2 leading-snug">
        ${colorizeWords(event.title)}
      </h3>
      <p class="text-xs sm:text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed font-medium">
        ${escapeHtml(event.description || "Join this exciting fest event at Zenith '26.")}
      </p>

      <!-- Details: Date/Time & Venue with Colored Single Words -->
      <div class="space-y-2 text-xs mb-5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
        <div class="flex items-center gap-2">
          <span class="text-pink-400 text-sm">📅</span>
          <span class="font-bold"><strong class="text-pink-400">${escapeHtml(event.event_date)}</strong> <span class="text-white/40">•</span> <strong class="text-yellow-300">${escapeHtml(event.event_time)}</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-cyan-400 text-sm">📍</span>
          <span class="truncate font-bold">${colorizeWords(event.venue)}</span>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Seat Capacity & Action Button -->
    <div class="pt-4 border-t border-white/10">
      <div class="flex items-center justify-between text-xs mb-2">
        <span class="font-bold"><span class="text-pink-400">Seat</span> <span class="text-cyan-300">Availability</span></span>
        ${
          isFull
            ? `<span class="px-2.5 py-0.5 rounded-lg font-black text-xs bg-red-500/25 text-red-400 border border-red-500/50 uppercase tracking-wider animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]">EVENT FULL</span>`
            : `<span class="font-bold text-slate-200">
                <strong class="text-emerald-400 font-black text-sm">${event.available_seats}</strong> <span class="text-white/40">/</span> ${event.capacity} <span class="text-yellow-300 font-semibold">left</span>
              </span>`
        }
      </div>

      <!-- Capacity Progress Bar -->
      <div class="w-full bg-black/60 rounded-full h-2 mb-4 overflow-hidden border border-white/10">
        <div class="h-2 rounded-full transition-all duration-500 ${
          isFull
            ? "bg-red-500"
            : pctUsed >= 85
            ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
            : "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(236,72,153,0.6)]"
        }" style="width: ${pctUsed}%;"></div>
      </div>

      <!-- View Details Button -->
      <button 
        data-event-id="${event.id}" 
        class="view-details-btn w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 ${
          isFull
            ? "bg-white/10 hover:bg-white/20 text-slate-300 border border-white/15"
            : "bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 hover:from-pink-500 hover:to-cyan-400 text-white shadow-lg shadow-pink-600/30 hover:scale-[1.02] active:scale-[0.98]"
        }"
      >
        <span>${isFull ? "View Full Event Info" : "View Details & Register ⚡"}</span>
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

    // Populate Modal Content with Multi-Colored Words
    document.getElementById("form-event-id").value = event.id;
    document.getElementById("modal-icon").textContent = event.icon || "🎉";
    document.getElementById("modal-title").innerHTML = colorizeWords(event.title);
    document.getElementById("modal-category").textContent = event.category;
    document.getElementById("modal-datetime").textContent = `${event.event_date} • ${event.event_time}`;
    document.getElementById("modal-venue").innerHTML = colorizeWords(event.venue);
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
      document.getElementById("submit-btn-text").textContent = "Confirm Registration ⚡";
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
  document.getElementById("submit-btn-text").textContent = "Confirm Registration ⚡";
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
      const msg = data.detail || "Registration failed. Please check your information.";
      showFormError(msg);
      return;
    }

    // Success
    successBox.classList.remove("hidden");
    successText.innerHTML = `Congratulations <strong>${escapeHtml(
      data.student_name
    )}</strong>! Your registration ID is <strong>#${data.id}</strong>. A confirmation has been recorded.`;
    document.getElementById("registration-form").reset();
    document.getElementById("submit-btn-text").textContent = "Registered!";

    // Trigger fireworks burst
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent("registrationSuccess"));
    }

    // Reload events in background to refresh seat availability
    loadEvents();
  } catch (err) {
    showFormError(`Network error: ${err.message}. Please check connection.`);
  } finally {
    submitBtn.disabled = false;
    spinner.classList.add("hidden");
    if (document.getElementById("submit-btn-text").textContent === "Registering...") {
      document.getElementById("submit-btn-text").textContent = "Confirm Registration ⚡";
    }
  }
}

function showFormError(msg) {
  const errorBox = document.getElementById("form-error-box");
  const errorText = document.getElementById("form-error-text");
  errorBox.classList.remove("hidden");
  errorText.textContent = msg;
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
