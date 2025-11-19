// =====================
// LOCAL STORAGE
// =====================
const STORAGE_KEY = "jadwalq_activities_v1";

function loadActivities() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Gagal parse localStorage:", e);
    return [];
  }
}

function saveActivities() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

// =====================
// STATE FRONTEND
// =====================
let activities = [];

// =====================
// UTIL FORMAT TANGGAL/JAM
// =====================
function formatDateReadable(dateStr) {
  if (!dateStr) return "-";
  const bulan = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const tgl = d.getDate();
  const bln = bulan[d.getMonth()];
  const th = d.getFullYear();
  return tgl + " " + bln + " " + th;
}

function formatTimeReadable(timeStr) {
  if (!timeStr) return "";
  return timeStr.slice(0, 5); // HH:MM
}

// =====================
// TYPE & PILLS
// =====================
function getTypeLabel(type) {
  switch (type) {
    case "tugas": return "Tugas / To-Do";
    case "agenda": return "Agenda";
    case "event": return "Event Penting";
    default: return "Kegiatan";
  }
}

function getTypeClass(type) {
  switch (type) {
    case "tugas": return "pill pill-blue";
    case "agenda": return "pill pill-green";
    case "event": return "pill pill-red";
    default: return "pill pill-gray";
  }
}

// =====================
// RENDER KEGIATAN & STAT
// =====================
function renderActivities(filterText = "") {
  const listEl = document.getElementById("activity-list");
  const emptyEl = document.getElementById("empty-state");
  const totalBadge = document.getElementById("total-activity-badge");

  listEl.innerHTML = "";

  const term = filterText.toLowerCase().trim();

  const filtered = activities.filter((a) => {
    if (!term) return true;
    return (
      a.title?.toLowerCase().includes(term) ||
      a.category?.toLowerCase().includes(term) ||
      a.notes?.toLowerCase().includes(term)
    );
  });

  emptyEl.style.display = filtered.length === 0 ? "block" : "none";

  filtered
    .slice()
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .forEach((act) => {
      const item = document.createElement("div");
      item.className = "item";

      const dateText = formatDateReadable(act.date);
      const timeText = formatTimeReadable(act.time);
      const categoryText = act.category ? " • Kategori: " + act.category : "";
      const notesText = act.notes ? `<div class="notes">${act.notes}</div>` : "";

      item.innerHTML = `
        <div class="item-main">
          <strong>${act.title}</strong>
          <div class="meta">
            ${getTypeLabel(act.type)} • ${dateText}${timeText ? " • " + timeText : ""}${categoryText}
          </div>
          ${notesText}
        </div>
        <div class="item-right">
          ${
            act.category
              ? `<span class="${getTypeClass(act.type)}">${act.category}</span>`
              : `<span class="${getTypeClass(act.type)}">${getTypeLabel(act.type)}</span>`
          }
          <button class="icon-btn" data-id="${act.id}" title="Hapus kegiatan">✕</button>
        </div>
      `;

      listEl.appendChild(item);
    });

  totalBadge.textContent = filtered.length + " kegiatan";
  updateStats();
  renderCalendarDots();
}

function updateStats() {
  const statCategory = document.getElementById("stat-category");
  const statTugas = document.getElementById("stat-tugas");
  const statEvent = document.getElementById("stat-event");

  const categorySet = new Set(
    activities
      .map((a) => (a.category || "").trim())
      .filter((s) => s.length > 0)
  );
  const tugasCount = activities.filter((a) => a.type === "tugas").length;
  const eventCount = activities.filter((a) => a.type === "event").length;

  statCategory.textContent = categorySet.size;
  statTugas.textContent = tugasCount;
  statEvent.textContent = eventCount;
}

// =====================
// KALENDER
// =====================
function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  const monthLabel = document.getElementById("calendar-month");

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11

  const bulanNama = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  monthLabel.textContent = `${bulanNama[month]} ${year}`;
  grid.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7; // Senin = 0

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // sel kosong sebelum tanggal 1
  for (let i = 0; i < startDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "cal-cell empty";
    grid.appendChild(emptyCell);
  }

  // tanggal
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "cal-cell";
    const span = document.createElement("span");
    span.className = "date";
    span.textContent = d;
    cell.appendChild(span);
    grid.appendChild(cell);
  }

  renderCalendarDots();
}

function renderCalendarDots() {
  const grid = document.getElementById("calendar-grid");
  if (!grid) return;

  const cells = Array.from(grid.querySelectorAll(".cal-cell"));
  cells.forEach((cell) => {
    const dot = cell.querySelector(".dot");
    if (dot) dot.remove();
  });

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const hasActivity = new Set(
    activities
      .filter((a) => {
        if (!a.date) return false;
        const d = new Date(a.date + "T00:00:00");
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((a) => new Date(a.date + "T00:00:00").getDate())
  );

  cells.forEach((cell) => {
    const span = cell.querySelector(".date");
    if (!span) return;
    const dayNum = Number(span.textContent);
    if (hasActivity.has(dayNum)) {
      const dot = document.createElement("div");
      dot.className = "dot";
      cell.appendChild(dot);
    }
  });
}

// =====================
// MODAL & FORM
// =====================
function setupModalAndForm() {
  const modal = document.getElementById("modal");
  const openModalBtn = document.getElementById("open-modal-btn");
  const cancelModalBtn = document.getElementById("cancel-modal");
  const saveActivityBtn = document.getElementById("save-activity");

  function openModal() {
    modal.style.display = "flex";
  }

  function closeModal() {
    modal.style.display = "none";
  }

  openModalBtn.addEventListener("click", openModal);
  cancelModalBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // SIMPAN KEGIATAN BARU
  saveActivityBtn.addEventListener("click", () => {
    const titleEl = document.getElementById("activity-title");
    const dateEl = document.getElementById("activity-date");
    const timeEl = document.getElementById("activity-time");
    const categoryEl = document.getElementById("activity-category");
    const typeEl = document.getElementById("activity-type");
    const notesEl = document.getElementById("activity-notes");

    const title = titleEl.value.trim();
    const date = dateEl.value;
    const time = timeEl.value;
    const category = categoryEl.value.trim();
    const type = typeEl.value;
    const notes = notesEl.value.trim();

    if (!title || !date) {
      alert("Nama kegiatan dan tanggal wajib diisi.");
      return;
    }

    const newActivity = {
      id: Date.now(),
      title,
      date,
      time,
      category,
      type,
      notes
    };

    activities.push(newActivity);
    saveActivities();
    renderActivities(document.getElementById("search-input").value);

    // reset form
    titleEl.value = "";
    dateEl.value = "";
    timeEl.value = "";
    categoryEl.value = "";
    typeEl.value = "tugas";
    notesEl.value = "";

    closeModal();
  });
}

// =====================
// HAPUS KEGIATAN
// =====================
function setupDeleteHandler() {
  const list = document.getElementById("activity-list");
  list.addEventListener("click", (e) => {
    if (!e.target.classList.contains("icon-btn")) return;

    const id = Number(e.target.getAttribute("data-id"));
    if (!id) return;

    const yakin = confirm("Hapus kegiatan ini?");
    if (!yakin) return;

    activities = activities.filter((a) => a.id !== id);
    saveActivities();
    renderActivities(document.getElementById("search-input").value);
  });
}

// =====================
// PENCARIAN
// =====================
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", (e) => {
    renderActivities(e.target.value);
  });
}

// =====================
// INISIALISASI
// =====================
document.addEventListener("DOMContentLoaded", () => {
  activities = loadActivities();

  // kalau kosong banget, isi contoh awal (optional)
  if (activities.length === 0) {
    const todayStr = new Date().toISOString().slice(0, 10);
    activities = [
      {
        id: Date.now() - 3,
        title: "Bayar tagihan listrik",
        date: todayStr,
        time: "20:00",
        category: "Rumah Tangga",
        type: "tugas",
        notes: "Bayar via m-banking sebelum jam 22.00."
      },
      {
        id: Date.now() - 2,
        title: "Meeting proyek mingguan",
        date: todayStr,
        time: "09:00",
        category: "Kerja",
        type: "agenda",
        notes: "Update progres dan bahas deadline baru."
      },
      {
        id: Date.now() - 1,
        title: "Acara keluarga",
        date: todayStr,
        time: "19:00",
        category: "Keluarga",
        type: "event",
        notes: "Bawa kue & oleh-oleh kecil."
      }
    ];
    saveActivities();
  }

  setupModalAndForm();
  setupDeleteHandler();
  setupSearch();
  renderCalendar();
  renderActivities();
});
