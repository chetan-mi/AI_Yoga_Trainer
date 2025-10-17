// DOM Elements
const flashMessages = document.getElementById("flashMessages");
const usernameForm = document.getElementById("usernameForm");
const passwordForm = document.getElementById("passwordForm");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordStrength = document.getElementById("passwordStrength");
const passwordMatch = document.getElementById("passwordMatch");

// Show message to user
function showMessage(message, type = "success") {
  flashMessages.innerHTML = `
                <div class="alert ${type}">
                    ${message}
                </div>
            `;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    flashMessages.innerHTML = "";
  }, 5000);
}

// Check password strength
function checkPasswordStrength(password) {
  if (password.length === 0) {
    return "";
  }

  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
  if (password.match(/\d/)) strength++;
  if (password.match(/[^a-zA-Z\d]/)) strength++;

  if (strength < 2) {
    return '<span class="strength-weak">Weak password</span>';
  } else if (strength < 4) {
    return '<span class="strength-medium">Medium strength</span>';
  } else {
    return '<span class="strength-strong">Strong password</span>';
  }
}

// Check password match
function checkPasswordMatch() {
  const password = newPasswordInput.value;
  const confirm = confirmPasswordInput.value;

  if (confirm.length === 0) {
    passwordMatch.innerHTML = "";
  } else if (password === confirm) {
    passwordMatch.innerHTML =
      '<span style="color: #51cf66;">✓ Passwords match</span>';
  } else {
    passwordMatch.innerHTML =
      '<span style="color: #ff6b6b;">✗ Passwords do not match</span>';
  }
}

// Event Listeners
newPasswordInput.addEventListener("input", function () {
  passwordStrength.innerHTML = checkPasswordStrength(this.value);
});

confirmPasswordInput.addEventListener("input", checkPasswordMatch);

// Username form submission
usernameForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = "⏳ Updating...";

    const formData = new FormData(this);
    const data = {
      new_username: formData.get("new_username"),
      password: formData.get("password"),
    };

    const response = await fetch("/api/user/username", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(
        "You must be logged in to change your username. Please login first."
      );
    }

    const result = await response.json();

    if (response.ok) {
      showMessage("Username updated successfully!", "success");
      document.getElementById("currentUsername").textContent =
        data.new_username;
      this.reset();
    } else {
      showMessage(result.error || "Failed to update username", "error");
    }
  } catch (error) {
    console.error("Error updating username:", error);
    showMessage("Error updating username", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// Password form submission
passwordForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  // Check if passwords match
  if (newPasswordInput.value !== confirmPasswordInput.value) {
    showMessage("Passwords do not match", "error");
    return;
  }

  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = "⏳ Changing...";

    const formData = new FormData(this);
    const data = {
      current_password: formData.get("current_password"),
      new_password: formData.get("new_password"),
    };

    const response = await fetch("/api/user/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(
        "You must be logged in to change your password. Please login first."
      );
    }

    const result = await response.json();

    if (response.ok) {
      showMessage("Password updated successfully!", "success");
      this.reset();
      passwordStrength.innerHTML = "";
      passwordMatch.innerHTML = "";
    } else {
      showMessage(result.error || "Failed to update password", "error");
    }
  } catch (error) {
    console.error("Error updating password:", error);
    showMessage("Error updating password", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

// Delete account modal functions
function showDeleteConfirmation() {
  const modal = document.getElementById("deleteModal");
  modal.classList.add("active");
  // Prevent body scroll when modal is open
  document.body.style.overflow = "hidden";
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  modal.classList.remove("active");
  // Restore body scroll
  document.body.style.overflow = "";
}

// Close modal when clicking outside
document.getElementById("deleteModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeDeleteModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeDeleteModal();
  }
});

async function confirmDelete() {
  closeDeleteModal();

  try {
    const response = await fetch("/api/user/account", {
      method: "DELETE",
    });

    if (response.ok) {
      showMessage("Account deleted successfully. Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } else {
      const result = await response.json();
      showMessage(result.error || "Failed to delete account", "error");
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    showMessage("Error deleting account", "error");
  }
}
