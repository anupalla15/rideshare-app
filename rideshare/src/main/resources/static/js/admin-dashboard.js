// rideshare/src/main/resources/static/js/admin-dashboard.js

let allUsers = [];
let userRoleChartInstance = null; // Pie chart instance
const BASE_REPORT_URL = "/api/";

 // Monitoring endpoints
// =================== BUTTON AND NAVIGATION ===================

const onboardBtn = document.getElementById("onboardBtn");
if (onboardBtn) {
    onboardBtn.addEventListener("click", () => {
        window.location.href = "admin-onboard-user.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();

    const monitorDataBtn = document.getElementById("monitorDataBtn");
    if (monitorDataBtn) {
        monitorDataBtn.addEventListener("click", async () => {
            Swal.fire({
                title: "Monitoring Dashboard",
                html:
                    'Select the data stream you want to monitor:<br>' +
                    '<button id="viewRidesBtn" class="swal2-styled" style="margin:10px;background-color:#4facfe;">Rides</button>' +
                    '<button id="viewBookingsBtn" class="swal2-styled" style="margin:10px;background-color:#4facfe;">Bookings</button>' +
                    '<button id="viewPaymentsBtn" class="swal2-styled" style="margin:10px;background-color:#4facfe;">Payments</button>',
                showCancelButton: true,
                showConfirmButton: false,
                didOpen: () => {
                    document.getElementById("viewRidesBtn")
                        .addEventListener("click", () => viewDataStream("Rides", BASE_REPORT_URL + "rides/admin/rides"));
                    document.getElementById("viewBookingsBtn")
                        .addEventListener("click", () => viewDataStream("Bookings", BASE_REPORT_URL + "booking/admin/bookings"));
                    document.getElementById("viewPaymentsBtn")
                        .addEventListener("click", () => viewDataStream("Payments", BASE_REPORT_URL + "payments/admin/payments"));
                }
            });
        });
    }
});

// =================== PIE CHART ===================

function renderChart(driverCount, passengerCount, ridesCount, bookingsCount) {
    const ctx = document.getElementById("userRoleChart");

    if (userRoleChartInstance) userRoleChartInstance.destroy();

    userRoleChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Drivers", "Passengers", "Total Rides", "Total Bookings"],
            datasets: [{
                data: [driverCount, passengerCount, ridesCount, bookingsCount],
                backgroundColor: ["#43e97b", "#f76b1c", "#ff9b6b", "#6f54ff"],
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

// =================== COUNTS ===================

function updateCounts(users) {
    const driverCount = users.filter(u => u.roleType === "DRIVER").length;
    const passengerCount = users.filter(u => u.roleType === "PASSENGER").length;

    document.getElementById("usBadgeCount").textContent = users.length;
    document.getElementById("driverCount").textContent = driverCount;
    document.getElementById("passengerCount").textContent = passengerCount;
}

// =================== LOAD REPORTS ===================
// FIXED: CORRECT PATH → "/auth/admin/report"

async function loadReports() {
    try {
        const report = await getData("/admin/report");

        if (report) {
            document.getElementById("totalRidesCount").textContent = report.totalRides || 0;
            document.getElementById("totalEarnings").textContent = `₹${(report.totalEarnings || 0).toFixed(2)}`;
            document.getElementById("totalBookingsCount").textContent = report.totalBookings || 0;
            document.getElementById("overview-earnings-value").textContent =
                `₹${(report.totalEarnings || 0).toFixed(2)}`;

            const driverCount = allUsers.filter(u => u.roleType === "DRIVER").length;
            const passengerCount = allUsers.filter(u => u.roleType === "PASSENGER").length;

            renderChart(driverCount, passengerCount, report.totalRides, report.totalBookings);
        }
    } catch (err) {
        console.error("Failed to load reports:", err);
    }
}

// =================== LOAD USERS ===================
// FIXED: CORRECT PATH → "/admin/users" (BASE_URL adds /auth)

async function loadUsers() {
    try {
        const users = await getData("/admin/users");
        allUsers = Array.isArray(users) ? users : [];

        updateCounts(allUsers);
        await loadReports();

    } catch (err) {
        console.error("Failed to load users:", err);
    }
}

// =================== MONITOR VIEW ===================

let monitorDataCache = [];
let monitorCurrentPage = 1;
let monitorSearchTerm = "";
const monitorItemsPerPage = 10;

async function viewDataStream(title, url) {
    Swal.fire({
        title: `Loading ${title}...`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");

        monitorDataCache = await response.json();
        monitorCurrentPage = 1;
        monitorSearchTerm = "";

        displayMonitorData(title);

    } catch (err) {
        Swal.fire("Error", err.message, "error");
    }
}

function displayMonitorData(title) {
    let filteredData = monitorSearchTerm
        ? monitorDataCache.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(monitorSearchTerm.toLowerCase())
            ))
        : monitorDataCache;

    const totalPages = Math.ceil(filteredData.length / monitorItemsPerPage);
    const startIndex = (monitorCurrentPage - 1) * monitorItemsPerPage;
    const pageData = filteredData.slice(startIndex, startIndex + monitorItemsPerPage);

    // HTML table
    let html = `
      <input id="monitorSearchInput" placeholder="Search..." style="padding:8px;width:300px;margin-bottom:10px;">
      <div style="max-height:400px;overflow-y:auto;">
    `;

    if (pageData.length === 0) {
        html += "<p>No data found.</p>";
    } else {
        const keys = Object.keys(pageData[0]);

        html += "<table style='width:100%;font-size:0.8em;border-collapse:collapse;'><thead><tr>";
        keys.forEach(k => html += `<th style="border:1px solid #ccc;padding:5px;">${k}</th>`);
        html += "</tr></thead><tbody>";

        pageData.forEach(row => {
            html += "<tr>";
            keys.forEach(k => html += `<td style="padding:5px;border:1px solid #ccc;">${row[k]}</td>`);
            html += "</tr>";
        });

        html += "</tbody></table>";
    }

    html += "</div>";

    Swal.fire({
        title: `Monitoring: ${title}`,
        html,
        width: "90%",
        confirmButtonText: "Close",
        didOpen: () => {
            document.getElementById("monitorSearchInput").addEventListener("input", (e) => {
                monitorSearchTerm = e.target.value;
                monitorCurrentPage = 1;
                displayMonitorData(title);
            });
        }
    });
}

// =================== LOGOUT ===================

const logoutAdminBtn = document.getElementById("logoutAdminBtn");
if (logoutAdminBtn) {
    logoutAdminBtn.addEventListener("click", () => {
        window.location.href = "user-login.html";
    });
}
