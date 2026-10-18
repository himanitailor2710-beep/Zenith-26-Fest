// Zenith '26 — Student Portal Frontend Controller (app.js)

let currentCategory = "all";
let currentSearch = "";
let searchDebounceTimer = null;
let currentEventData = null;

// Multi-Color Word Palette (Pleasing, Cheerful, & Eye-Catching)
const WORD_COLORS = [
  "text-pink-400",
  "text-yellow-300",
  "text-cyan-400",
  "text-emerald-400",
  "text-purple-300",
  "text-orange-400",
  "text-rose-400",
  "text-sky-300",
  "text-fuchsia-300",
  "text-amber-300",
  "text-teal-300"
];

// Helper: Colorize Every Single Word in Text
function colorizeWords(text) {
  if (!text) return "";
  const words = text.toString().split(" ");
  return words.map((w, i) => {
    if (w === "—" || w === "-" || w === "•" || w === "/" || w === "|" || w === "&") {
      return `<span class="text-white/40 font-normal">${w}</span>`;
    }
    const colorClass = WORD_COLORS[i % WORD_COLORS.length];
    return `<span class="${colorClass} font-extrabold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">${escapeHtml(w)}</span>`;
  }).join(" ");
}

// 14 Event Character Artwork Banners for the Split Panels
const eventBanners = {
  1: { image: "/assets/characters/card-banners/banner-1.png", char: "⚡ Shinchan", track: "Code Sprint" },
  2: { image: "/assets/characters/card-banners/banner-2.png", char: "🤖 Motu & Patlu", track: "Robo Race" },
  3: { image: "/assets/characters/card-banners/banner-3.png", char: "💡 Pikachu", track: "AI Pitch" },
  4: { image: "/assets/characters/card-banners/banner-4.png", char: "🎨 Mickey Mouse", track: "Web Studio" },
  5: { image: "/assets/characters/card-banners/banner-5.png", char: "🎸 Tom & Jerry", track: "Band Mania" },
  6: { image: "/assets/characters/card-banners/banner-6.png", char: "💃 Dora the Explorer", track: "Dance Stage" },
  7: { image: "/assets/characters/card-banners/banner-7.png", char: "🎭 Bheem & Chutki", track: "Street Drama" },
  8: { image: "/assets/characters/card-banners/banner-8.png", char: "✨ Dora Runway", track: "Fashion Fusion" },
  9: { image: "/assets/characters/card-banners/banner-9.png", char: "🎙️ Patlu Sparkler", track: "Open Mic" },
  10: { image: "/assets/characters/card-banners/banner-10.png", char: "⚽ Shinchan Striker", track: "Football Arena" },
  11: { image: "/assets/characters/card-banners/banner-11.png", char: "♟️ Chhota Bheem", track: "Chess Championship" },
  12: { image: "/assets/characters/card-banners/banner-12.png", char: "🎮 Tom & Jerry", track: "Valorant Esports" },
  13: { image: "/assets/characters/card-banners/banner-13.png", char: "🛠️ Motu UX", track: "Design Lab" },
  14: { image: "/assets/characters/card-banners/banner-14.png", char: "🚀 Chhota Bheem", track: "Vibe Coding" },
};

// Category Badge Color Palette with Neon Glowing Accents
const categoryColors = {
  Technical: {
    bg: "bg-cyan-500/25",
    text: "text-cyan-200",
    border: "border-cyan-300/40",
    glow: "shadow-[0_0_12px_rgba(6,182,212,0.35)]"
  },
  Cultural: {
    bg: "bg-pink-500/25",
    text: "text-pink-200",
    border: "border-pink-300/40",
    glow: "shadow-[0_0_12px_rgba(236,72,153,0.35)]"
  },
  Sports: {
    bg: "bg-emerald-500/25",
    text: "text-emerald-200",
    border: "border-emerald-300/40",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.35)]"
  },
  Gaming: {
    bg: "bg-purple-500/25",
    text: "text-purple-200",
    border: "border-purple-300/40",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.35)]"
  },
  Workshop: {
    bg: "bg-amber-500/25",
    text: "text-amber-200",
    border: "border-amber-300/40",
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
          "border-pink-300/60"
        );
        b.classList.add("bg-white/15", "text-white", "border-white/20");
      });
      btn.classList.add(
        "active-filter",
        "bg-gradient-to-r",
        "from-pink-500",
        "via-purple-600",
        "to-indigo-600",
        "text-white",
        "border-pink-300/60"
      );
      btn.classList.remove("bg-white/15", "text-white", "border-white/20");

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
          b.classList.add("active-filter", "bg-gradient-to-r", "from-pink-500", "via-purple-600", "to-indigo-600", "text-white", "border-pink-300/60");
          b.classList.remove("bg-white/15", "border-white/20");
        } else {
          b.classList.remove("active-filter", "bg-gradient-to-r", "from-pink-500", "via-purple-600", "to-indigo-600", "text-white", "border-pink-300/60");
          b.classList.add("bg-white/15", "text-white", "border-white/20");
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

    countBadge.innerHTML = `<span class="text-emerald-300 font-black">${events.length}</span> <span class="text-yellow-300">Event${events.length === 1 ? "" : "s"}</span>`;

    if (events.length === 0) {
      emptyContainer.classList.remove("hidden");
      return;
    }

    // Render Event Cards with Cartoon Character Split Panels
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

// Create an Event Card Element (Split Panel with Character Banner + Multi-Colored Words)
function createEventCard(event, index) {
  const card = document.createElement("div");
  card.className =
    "card-animate group bg-slate-900/40 hover:bg-slate-800/50 backdrop-blur-xl border border-white/20 hover:border-pink-400/60 rounded-3xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(236,72,153,0.25)] transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 ring-1 ring-white/10";
  card.style.animationDelay = `${index * 40}ms`;

  const bannerInfo = eventBanners[event.id] || {
    image: `/assets/characters/card-banners/banner-${((event.id - 1) % 14) + 1}.png`,
    char: "Festival Star",
    track: event.category
  };

  const isFull = event.available_seats <= 0;
  const catStyle = categoryColors[event.category] || {
    bg: "bg-pink-500/25",
    text: "text-pink-200",
    border: "border-pink-300/40",
    glow: "shadow-[0_0_12px_rgba(236,72,153,0.35)]",
  };

  const seatsUsed = event.capacity - event.available_seats;
  const pctUsed = Math.min(100, Math.round((seatsUsed / event.capacity) * 100));

  card.innerHTML = `
    <div>
      <!-- Split Panel Top Banner: Character Artwork Image -->
      <div class="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-950/60 border-b border-white/15">
        <img 
          src="${bannerInfo.image}" 
          alt="${escapeHtml(event.title)} - ${bannerInfo.char}" 
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        <!-- Gradient Overlay for Clean Contrast -->
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>

        <!-- Floating Category Pill on Split Panel -->
        <div class="absolute top-3 left-3 flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-black ${catStyle.bg} ${catStyle.text} border ${catStyle.border} ${catStyle.glow} backdrop-blur-md">
            ${event.category}
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-black ${
            event.fee === 0
              ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              : "bg-pink-500/30 text-pink-200 border border-pink-400/50 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
          } backdrop-blur-md">
            ${event.fee === 0 ? "Free Entry" : "₹" + event.fee}
          </span>
        </div>

        <!-- Character Badge Tag on Bottom-Left of Split Panel Banner -->
        <div class="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[11px] font-black text-white/95 drop-shadow">
          <span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          <span class="text-yellow-300 font-black">${bannerInfo.char}</span>
          <span class="text-white/40">•</span>
          <span class="text-cyan-300 font-bold">${bannerInfo.track}</span>
        </div>
      </div>

      <!-- Split Panel Lower Body -->
      <div class="p-5 sm:p-6">
        <!-- Title: Multi-Colored Single Words -->
        <h3 class="text-lg sm:text-xl font-black tracking-tight mb-2 leading-snug">
          ${colorizeWords(event.title)}
        </h3>

        <!-- Description -->
        <p class="text-xs sm:text-sm text-slate-200 line-clamp-2 mb-4 leading-relaxed font-medium">
          ${escapeHtml(event.description || "Join this exciting fest event at Zenith '26.")}
        </p>

        <!-- Details: Date/Time & Venue with Colored Single Words -->
        <div class="space-y-2 text-xs mb-4 p-3.5 rounded-2xl bg-white/10 border border-white/15">
          <div class="flex items-center gap-2">
            <span class="text-pink-400 text-sm">📅</span>
            <span class="font-bold"><strong class="text-pink-300">${escapeHtml(event.event_date)}</strong> <span class="text-white/40">•</span> <strong class="text-yellow-300">${escapeHtml(event.event_time)}</strong></span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-cyan-300 text-sm">📍</span>
            <span class="truncate font-bold">${colorizeWords(event.venue)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Seat Capacity & Action Button -->
    <div class="px-5 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-white/10">
      <div class="flex items-center justify-between text-xs mb-2">
        <span class="font-bold"><span class="text-pink-400">Seat</span> <span class="text-cyan-300">Availability</span></span>
        ${
          isFull
            ? `<span class="px-2.5 py-0.5 rounded-lg font-black text-xs bg-red-500/30 text-red-300 border border-red-500/50 uppercase tracking-wider animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]">EVENT FULL</span>`
            : `<span class="font-bold text-slate-100">
                <strong class="text-emerald-400 font-black text-sm">${event.available_seats}</strong> <span class="text-white/40">/</span> ${event.capacity} <span class="text-yellow-300 font-semibold">left</span>
              </span>`
        }
      </div>

      <!-- Capacity Progress Bar -->
      <div class="w-full bg-black/40 rounded-full h-2 mb-4 overflow-hidden border border-white/15">
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
        class="view-details-btn w-full py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 ${
          isFull
            ? "bg-white/15 hover:bg-white/25 text-slate-200 border border-white/20"
            : "bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-white shadow-lg shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.98]"
        }"
      >
        <span>${isFull ? "View Event Details" : "View Details & Register ⚡"}</span>
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

    const bannerInfo = eventBanners[event.id] || {
      image: `/assets/characters/card-banners/banner-${((event.id - 1) % 14) + 1}.png`,
      char: "Festival Star",
      track: event.category
    };

    // Populate Modal Content
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

    // Modal Character Banner if present
    const modalBanner = document.getElementById("modal-banner-img");
    if (modalBanner) {
      modalBanner.src = bannerInfo.image;
    }

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

  errorBox.classList.add("hidden");
  successBox.classList.add("hidden");

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

    successBox.classList.remove("hidden");
    successText.innerHTML = `Congratulations <strong>${escapeHtml(
      data.student_name
    )}</strong>! Your registration ID is <strong>#${data.id}</strong>. A confirmation has been recorded.`;
    document.getElementById("registration-form").reset();
    document.getElementById("submit-btn-text").textContent = "Registered!";

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
