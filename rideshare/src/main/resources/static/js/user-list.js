// rideshare/src/main/resources/static/js/user-list.js

const BASE_URL_AUTH = window.location.origin + "/api/auth";

let allUsers = []; // Store all fetched users
let filteredUsers = []; // Store currently filtered users (by role and search term)
let currentPage = 0;
const pageSize = 10;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadAllUsersAndInitialize();

    // ADDED: Event listener for search input
    document.getElementById('searchUserInput').addEventListener('input', () => {
        currentPage = 0; // Reset page on new search
        applyFiltersAndRender();
    });
    // END ADDED

    document.getElementById('prevPageBtn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            renderCurrentPage();
        }
    });

    document.getElementById('nextPageBtn').addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            renderCurrentPage();
        }
    });
});

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function updatePageTitle(role) {
    const titleEl = document.getElementById('pageTitle');
    if (role === 'DRIVER') {
        titleEl.textContent = 'Manage Driver Accounts';
    } else if (role === 'PASSENGER') {
        titleEl.textContent = 'Manage Passenger Accounts';
    } else {
        titleEl.textContent = 'Manage All Users';
    }
}

async function loadAllUsersAndInitialize() {
    const container = document.getElementById('userTableContainer');
    container.innerHTML = '<p>Fetching users...</p>';
    const roleFilter = getUrlParameter('role').toUpperCase();
    updatePageTitle(roleFilter);

    try {
        const response = await fetch(`${BASE_URL_AUTH}/admin/users`);
        if (!response.ok) throw new Error('Failed to fetch user data.');

        allUsers = await response.json();

        // Use new function to apply filters (role and search) and render
        applyFiltersAndRender();

    } catch (error) {
        console.error("Error loading user list:", error);
        container.innerHTML = `<p style="color:red;">Error loading users: ${error.message}</p>`;
    }
}

// ADDED: New function to combine filtering logic
function applyFiltersAndRender() {
    const roleFilter = getUrlParameter('role').toUpperCase();
    const searchTerm = document.getElementById('searchUserInput').value.toLowerCase();

    // 1. Apply Role Filter (from URL)
    let roleFiltered = allUsers;
    if (roleFilter && (roleFilter === 'DRIVER' || roleFilter === 'PASSENGER' || roleFilter === 'ADMIN')) {
        roleFiltered = allUsers.filter(user => user.roleType === roleFilter);
    }

    // 2. Apply Search Filter (from input)
    filteredUsers = roleFiltered.filter(user => {
        const nameMatch = user.name.toLowerCase().includes(searchTerm);
        const emailMatch = user.email.toLowerCase().includes(searchTerm);
        // Search by name OR email
        return nameMatch || emailMatch;
    });

    // 3. Render the first page of the newly filtered list
    currentPage = 0;
    totalPages = Math.ceil(filteredUsers.length / pageSize);
    renderCurrentPage();
}
// END ADDED

function renderCurrentPage() {
    const container = document.getElementById('userTableContainer');
    const start = currentPage * pageSize;
    const end = Math.min(start + pageSize, filteredUsers.length);
    const usersToDisplay = filteredUsers.slice(start, end);

    if (filteredUsers.length === 0) {
        container.innerHTML = `<p>No ${getUrlParameter('role').toLowerCase() || 'users'} match the current filters.</p>`;
        updatePaginationControls(0);
        return;
    }

    renderUserTable(usersToDisplay);
    updatePaginationControls(filteredUsers.length);
}

function updatePaginationControls(totalElements) {
    totalPages = Math.ceil(totalElements / pageSize);
    const pageInfoEl = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    pageInfoEl.textContent = `Page ${currentPage + 1} of ${totalPages} (Total: ${totalElements})`;
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
}


function renderUserTable(users) {
    const container = document.getElementById('userTableContainer');
    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>`;

    users.forEach(user => {
        const isVerified = user.verified || false;
        const isBlocked = user.blocked || false;

        const verifiedStatus = isVerified
            ? `<span class="status-VERIFIED">YES</span>`
            : `<span class="status-NOT-VERIFIED">NO</span>`;

        const blockedStatus = isBlocked
            ? `<span class="status-BLOCKED">BLOCKED</span>`
            : `Active`;

        // Action Buttons
        let actionButtons = '';

        // MODIFIED LOGIC: Show Verify button if the user is a DRIVER OR PASSENGER and is NOT verified.
        if ((user.roleType === 'DRIVER' || user.roleType === 'PASSENGER') && !isVerified) {
            actionButtons += `<button class="action-btn" onclick="updateUserStatus(${user.id}, 'verified', true)">Verify</button>`;
        }

        // Prevent blocking the admin user through this interface
        if (user.roleType !== 'ADMIN') {
            if (isBlocked) {
                actionButtons += `<button class="action-btn" style="background-color:#4CAF50; color:white;" onclick="updateUserStatus(${user.id}, 'blocked', false)">Unblock</button>`;
            } else {
                actionButtons += `<button class="action-btn" style="background-color:#f44336; color:white;" onclick="updateUserStatus(${user.id}, 'blocked', true)">Block</button>`;
            }
        }


        tableHtml += `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.roleType}</td>
                <td>${verifiedStatus}</td>
                <td>${blockedStatus}</td>
                <td>${actionButtons}</td>
            </tr>`;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;
}

async function updateUserStatus(userId, type, value) {
    const action = value ? type : `un${type}`;

    const result = await Swal.fire({
        title: `Confirm ${action.toUpperCase()}?`,
        text: `Are you sure you want to set user ${userId}'s ${type} status to ${value}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, proceed!'
    });

    if (!result.isConfirmed) {
        return;
    }

    // Calls POST /api/auth/admin/user/{userId}/status?type={type}&value={value}
    const url = `${BASE_URL_AUTH}/admin/user/${userId}/status?type=${type}&value=${value}`;

    try {
        const response = await fetch(url, { method: 'POST' });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to update status.`);
        }

        Swal.fire('Success', `User ${userId} status updated!`, 'success');
        loadAllUsersAndInitialize(); // Reload the table
    } catch (error) {
        Swal.fire('Error', `Operation failed: ${error.message}`, 'error');
    }
}