// BASE URL for backend API
const BASE_URL = window.location.origin + "/api/auth";


// =================== RESET PASSWORD ===================
const resetForm = document.getElementById("resetPasswordForm");
if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            Swal.fire({
                icon: 'warning',
                title: 'Mismatch',
                text: "Passwords do not match!"
            });
            return;
        }

        // Get email from localStorage (stored during first login)
        const email = localStorage.getItem("userEmail");
        if (!email) {
             Swal.fire({
                icon: 'error',
                title: 'System Error',
                text: "User email not found. Please login again."
            }).then(() => {
                window.location.href = "user-login.html";
            });
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/reset-password?email=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(newPassword)}`, {
                method: "POST"
            });

            const result = await response.text();

            if (result.includes("successfully")) {
                // SUCCESS SweetAlert
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: "Password reset successfully! Please login again."
                }).then(() => {
                    localStorage.removeItem("userEmail"); // Clear stored email
                    window.location.href = "user-login.html"; // Redirect to login
                });
            } else {
                // FAILURE SweetAlert
                Swal.fire({
                    icon: 'error',
                    title: 'Reset Failed',
                    text: result
                });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: "Error resetting password. Check console for details."
            });
        }
    });
}