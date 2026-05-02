// Put Data Local Storage
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
// End of Put Data Local Storage

//   Add Transaction
const form = document.getElementById("expense-form");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;

  if (!name || !amount || !category) {
    alert("Semua field wajib diisi!");
    return;
  }

const transaction = {
    id: Date.now(),
    name,
    amount: Number(amount),
    category
};

transactions.push(transaction);
saveData();
render();
});
//   End Add Transaction

// Delete Transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    render();
}
// End Delete Transaction

// Save Local Storage
function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}
// End Save Local Storage

// Render View
function render() {
    
    const list = document.getElementById("transaction-list");
    list.innerHTML = "";
    
    let total = 0;
    
    transactions.forEach(t => {
        total += t.amount;
        
        const li = document.createElement("li");
        li.innerHTML = `
        ${t.name} - Rp ${t.amount} (${t.category})
        <button onclick="deleteTransaction(${t.id})">Hapus</button>
        `;
        list.appendChild(li);
    });
    
    document.getElementById("balance").innerText = "Total: Rp " + total;
    
    updateChart();
}
// End Render View

// Pie Chart
let chart;

function updateChart() {
    const categories = {
        Food: 0,
        Transport: 0,
        Fun: 0
    };
    
    transactions.forEach(t => {
        categories[t.category] += t.amount;
    });
    
    const data = {
        labels: Object.keys(categories),
        datasets: [{
            data: Object.values(categories)
        }]
    };
    
    if (chart) chart.destroy();
    
  const ctx = document.getElementById("chart");
  chart = new Chart(ctx, {
      type: "pie",
      data: data
    });
}
// End Pie Chart

transactions.sort((a, b) => a.amount - b.amount);

if (total > 500000) {
  document.getElementById("balance").style.color = "red";
}