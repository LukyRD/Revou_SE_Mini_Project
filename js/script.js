// ===== State =====
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let spendingLimit = Number(localStorage.getItem("spendingLimit")) || 0;

// Default categories: { value, emoji, label, color }
const DEFAULT_CATEGORIES = [
  { value: "Food",      emoji: "🍔", label: "Food",      color: "#e67e22" },
  { value: "Transport", emoji: "🚗", label: "Transport", color: "#9b59b6" },
  { value: "Fun",       emoji: "🎉", label: "Fun",       color: "#e74c3c" },
];

let categories = JSON.parse(localStorage.getItem("categories")) || DEFAULT_CATEGORIES;

// ===== Theme =====
const html = document.documentElement;
const themeBtn = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme") || "light";
html.setAttribute("data-theme", savedTheme);
themeBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";

themeBtn.addEventListener("click", () => {
  const current = html.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  themeBtn.textContent = next === "dark" ? "☀️" : "🌙";
  localStorage.setItem("theme", next);
  // Re-render chart with updated colors
  updateChart();
});

// ===== Spending Limit =====
function setLimit() {
  const val = Number(document.getElementById("spending-limit").value);
  if (isNaN(val) || val < 0) {
    alert("Masukkan batas pengeluaran yang valid!");
    return;
  }
  spendingLimit = val;
  localStorage.setItem("spendingLimit", val);
  renderLimitDisplay();
  render();
}

function renderLimitDisplay() {
  const el = document.getElementById("limit-display");
  if (spendingLimit > 0) {
    el.textContent = `Batas aktif: Rp ${spendingLimit.toLocaleString("id-ID")}`;
  } else {
    el.textContent = "Belum ada batas yang diset.";
  }
  // Restore input placeholder
  document.getElementById("spending-limit").value = spendingLimit > 0 ? spendingLimit : "";
}

// ===== Custom Categories =====
function addCategory() {
  const nameInput = document.getElementById("new-category-name");
  const emojiInput = document.getElementById("new-category-emoji");
  const name = nameInput.value.trim();
  const emoji = emojiInput.value.trim() || "📌";

  if (!name) {
    alert("Masukkan nama kategori!");
    return;
  }

  const value = name.replace(/\s+/g, "_");
  if (categories.find(c => c.value === value)) {
    alert("Kategori sudah ada!");
    return;
  }

  // Generate a random color for the new category
  const colors = ["#1abc9c","#3498db","#9b59b6","#f39c12","#e74c3c","#2ecc71","#e67e22","#16a085"];
  const color = colors[categories.length % colors.length];

  categories.push({ value, emoji, label: name, color });
  saveCategories();
  renderCategoryChips();
  populateCategorySelect();

  nameInput.value = "";
  emojiInput.value = "";
}

function deleteCategory(value) {
  // Prevent deleting if transactions use this category
  const inUse = transactions.some(t => t.category === value);
  if (inUse) {
    alert("Kategori ini masih digunakan oleh transaksi yang ada!");
    return;
  }
  categories = categories.filter(c => c.value !== value);
  saveCategories();
  renderCategoryChips();
  populateCategorySelect();
}

function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
}

function renderCategoryChips() {
  const container = document.getElementById("category-chips");
  container.innerHTML = "";
  categories.forEach(cat => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `
      <span>${cat.emoji} ${cat.label}</span>
      <button class="chip-delete" onclick="deleteCategory('${cat.value}')" title="Hapus kategori">✕</button>
    `;
    container.appendChild(chip);
  });
}

function populateCategorySelect() {
  const select = document.getElementById("category");
  const current = select.value;
  select.innerHTML = `<option value="">-- Pilih Kategori --</option>`;
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.value;
    opt.textContent = `${cat.emoji} ${cat.label}`;
    select.appendChild(opt);
  });
  // Restore selection if still valid
  if (categories.find(c => c.value === current)) {
    select.value = current;
  }
}

function getCategoryMeta(value) {
  return categories.find(c => c.value === value) || { emoji: "📌", label: value, color: "#95a5a6" };
}

// ===== Add Transaction =====
const form = document.getElementById("expense-form");

// Set default month to current month
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
document.getElementById("tx-month").value = currentMonth;

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const name     = document.getElementById("name").value.trim();
  const amount   = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const month    = document.getElementById("tx-month").value;

  if (!name || !amount || !category || !month) {
    alert("Semua field wajib diisi!");
    return;
  }

  const transaction = {
    id: Date.now(),
    name,
    amount: Number(amount),
    category,
    month  // stored as "YYYY-MM"
  };

  transactions.push(transaction);
  saveData();
  render();

  // Reset form fields (keep month)
  document.getElementById("name").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("category").value = "";
});

// ===== Delete Transaction =====
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  render();
}

// ===== Save to LocalStorage =====
function saveData() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// ===== Month Filter =====
document.getElementById("filter-month").addEventListener("change", render);

function clearMonthFilter() {
  document.getElementById("filter-month").value = "";
  render();
}

function getFilteredTransactions() {
  const filterMonth = document.getElementById("filter-month").value;
  if (!filterMonth) return [...transactions];
  return transactions.filter(t => t.month === filterMonth);
}

// ===== Sort =====
function getSortedTransactions(list) {
  const sort = document.getElementById("sort-select").value;
  const sorted = [...list];
  switch (sort) {
    case "amount-desc":
      sorted.sort((a, b) => b.amount - a.amount);
      break;
    case "amount-asc":
      sorted.sort((a, b) => a.amount - b.amount);
      break;
    case "category-asc":
      sorted.sort((a, b) => a.category.localeCompare(b.category));
      break;
    case "date-asc":
      sorted.sort((a, b) => a.id - b.id);
      break;
    case "date-desc":
    default:
      sorted.sort((a, b) => b.id - a.id);
      break;
  }
  return sorted;
}

// ===== Monthly Summary =====
function renderMonthlySummary(filtered) {
  const filterMonth = document.getElementById("filter-month").value;
  const summaryCard = document.getElementById("monthly-summary");
  const summaryContent = document.getElementById("summary-content");

  if (!filterMonth || filtered.length === 0) {
    summaryCard.classList.add("hidden");
    return;
  }

  summaryCard.classList.remove("hidden");

  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  const count = filtered.length;
  const avg   = count > 0 ? Math.round(total / count) : 0;
  const max   = filtered.reduce((m, t) => t.amount > m.amount ? t : m, filtered[0]);

  // Per-category breakdown
  const catMap = {};
  filtered.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });

  const catRows = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => {
      const meta = getCategoryMeta(cat);
      return `<div class="summary-cat-row">
        <span>${meta.emoji} ${meta.label}</span>
        <span>Rp ${amt.toLocaleString("id-ID")}</span>
      </div>`;
    }).join("");

  // Format month label
  const [y, m] = filterMonth.split("-");
  const monthLabel = new Date(y, m - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  summaryContent.innerHTML = `
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">${monthLabel}</div>
    <div class="summary-grid" style="margin-bottom:12px;">
      <div class="summary-item">
        <div class="s-label">Total</div>
        <div class="s-value">Rp ${total.toLocaleString("id-ID")}</div>
      </div>
      <div class="summary-item">
        <div class="s-label">Transaksi</div>
        <div class="s-value">${count}x</div>
      </div>
      <div class="summary-item">
        <div class="s-label">Rata-rata</div>
        <div class="s-value">Rp ${avg.toLocaleString("id-ID")}</div>
      </div>
      <div class="summary-item">
        <div class="s-label">Terbesar</div>
        <div class="s-value" title="${max.name}">Rp ${max.amount.toLocaleString("id-ID")}</div>
      </div>
    </div>
    <div class="section-title" style="margin-bottom:8px;">Per Kategori</div>
    ${catRows}
  `;
}

// ===== Render =====
function render() {
  const list = document.getElementById("transaction-list");
  list.innerHTML = "";

  const filtered = getFilteredTransactions();
  const sorted   = getSortedTransactions(filtered);

  // Total of ALL transactions (not just filtered) for limit check
  const grandTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Balance card
  const balanceEl = document.getElementById("balance");
  const balanceCard = document.getElementById("balance-card");
  const limitWarning = document.getElementById("limit-warning");

  balanceEl.textContent = "Rp " + grandTotal.toLocaleString("id-ID");

  if (spendingLimit > 0 && grandTotal > spendingLimit) {
    balanceCard.classList.add("over-limit");
    limitWarning.classList.remove("hidden");
    limitWarning.textContent = `⚠️ Melebihi batas! (Rp ${spendingLimit.toLocaleString("id-ID")})`;
  } else {
    balanceCard.classList.remove("over-limit");
    limitWarning.classList.add("hidden");
  }

  // Render transactions
  sorted.forEach(t => {
    const meta = getCategoryMeta(t.category);
    const isOver = spendingLimit > 0 && t.amount > spendingLimit;

    const li = document.createElement("li");
    li.style.borderLeftColor = meta.color;
    if (isOver) li.classList.add("over-limit-item");

    li.innerHTML = `
      <div class="tx-info">
        <span class="tx-name">${meta.emoji} ${t.name}</span>
        <span class="tx-meta">${meta.label} · ${formatMonth(t.month)}${isOver ? " · ⚠️ Di atas batas" : ""}</span>
      </div>
      <div class="tx-right">
        <span class="tx-amount${isOver ? " over" : ""}">Rp ${t.amount.toLocaleString("id-ID")}</span>
        <button class="delete-btn" onclick="deleteTransaction(${t.id})">Hapus</button>
      </div>
    `;
    list.appendChild(li);
  });

  renderMonthlySummary(filtered);
  updateChart(filtered);
}

function formatMonth(monthStr) {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  return new Date(y, m - 1).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

// ===== Pie Chart =====
let chart;

function updateChart(filtered) {
  const data = filtered || getFilteredTransactions();
  const isDark = html.getAttribute("data-theme") === "dark";

  const catMap = {};
  data.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(catMap).map(v => {
    const meta = getCategoryMeta(v);
    return `${meta.emoji} ${meta.label}`;
  });
  const values = Object.values(catMap);
  const bgColors = Object.keys(catMap).map(v => getCategoryMeta(v).color);

  if (chart) chart.destroy();

  // Wrap canvas in a card if not already
  const ctx = document.getElementById("chart");
  if (!ctx.parentElement.classList.contains("chart-card")) {
    const card = document.createElement("div");
    card.className = "chart-card";
    ctx.parentNode.insertBefore(card, ctx);
    card.appendChild(ctx);
  }

  if (values.length === 0) return;

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor: isDark ? "#252830" : "#ffffff"
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: isDark ? "#e8eaf0" : "#333333",
            font: { size: 13 }
          }
        }
      }
    }
  });
}

// ===== Init =====
renderLimitDisplay();
renderCategoryChips();
populateCategorySelect();
render();
