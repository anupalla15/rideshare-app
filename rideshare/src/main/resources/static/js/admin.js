document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent form from reloading the page

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    const errorMsg = document.getElementById("loginMessage");

    if (!email || !password) {
        errorMsg.textContent = "Please enter both email and password.";
        return;
    }

    try {
        fetch(BASE_URL + "/admin/login", {

            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        });

        const data = await response.text();

        if (data.includes("successfully")) {
            // Login successful, redirect to admin dashboard
            window.location.href = "admin-dashboard.html";
        } else {
            errorMsg.textContent = data;
        }
    } catch (err) {
        console.error(err);
        errorMsg.textContent = "Error connecting to server. Make sure backend is running.";
    }
});
// Navigate to onboard page when "Onboard New User" button is clicked
//const onboardBtn = document.getElementById("onboardBtn");
//if (onboardBtn) {
//    onboardBtn.addEventListener("click", () => {
//        window.location.href = "onboard-user.html";
//    });
//}

