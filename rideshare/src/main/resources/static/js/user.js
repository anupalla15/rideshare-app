// src/main/resources/static/js/user.js



// =================== UNIFIED LOGIN ===================
const userLoginForm = document.getElementById("userLoginForm");
if (userLoginForm) {
    userLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // --- CLEAN RETRIEVAL ---
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        // const role = document.getElementById("role").value; // REMOVED

        // Check for empty values immediately
        if (!email || !password) {
            Swal.fire({
                            icon: 'warning',
                            title: 'Required Fields',
                            text: "Please enter both email and password."
                        });
            return;
        }

        let fetchUrl;

        // --- NEW LOGIN STRATEGY: Try User Login first, then Admin Login ---

        // 1. Try Standard User Login (Passenger/Driver)
       fetchUrl = `/api/auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;


        try {
            let response = await fetch(fetchUrl, { method: "POST" });
            let resultText = await response.text();

            if (resultText.includes("FIRST_LOGIN")) {
                localStorage.setItem("userEmail", email);
                window.location.href = "reset-password.html";
                return;
            } else if (resultText.includes("ACCOUNT_BLOCKED")) {
                 Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: "Your account is blocked. Please contact admin for assistance."
                });
                return;
            } else if (resultText.trim().startsWith("{")) {
                // SUCCESS: User (Driver/Passenger) Login
                const user = JSON.parse(resultText);

                // *** CRITICAL FIX: SAVE THE FULL USER OBJECT ***
                localStorage.setItem("loggedInUser", JSON.stringify(user));

                // --- ROLE-BASED REDIRECTION LOGIC ---
                if (user.roleType === 'DRIVER') {
                     window.location.href = "driver-dashboard.html";
                } else if (user.roleType === 'PASSENGER') {
                     window.location.href = "passenger-dashboard.html";
                } else {
                     window.location.href = "user-home.html"; // Fallback for other roles
                }
                return;
            }

            // 2. If User Login Failed, Try Admin Login
            fetchUrl = `/api/auth/admin/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
            response = await fetch(fetchUrl, { method: "POST" });
            resultText = await response.text();

            if (resultText.includes("successfully")) {
                // SUCCESS: Admin Login
                // Note: For simplicity, Admin details aren't stored in localStorage,
                // relying on the session/cookie (if set) or just redirecting.
                window.location.href = "admin-dashboard.html";
            } else {
                // FAILURE: Both logins failed
                 Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: "Invalid credentials. Please try again."
                });
            }

        } catch (err) {
            console.error("Fetch error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: "Error connecting to server. Check console for details."
            });
        }
    });
}