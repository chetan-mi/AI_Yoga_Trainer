
// Global variables
let isEditing = false;
let originalData = {};

// DOM Elements
const profileForm = document.getElementById("profileForm");
const editBtn = document.getElementById("editBtn");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");
const flashMessages = document.getElementById("flashMessages");

// Form fields
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const genderInput = document.getElementById("gender");
const ageInput = document.getElementById("age");
const avatarUrlInput = document.getElementById("avatarUrl");
const bioInput = document.getElementById("bio");
const avatarPreview = document.getElementById("avatarPreview");
const avatarDisplay = document.getElementById("avatarDisplay");
const fullNameDisplay = document.getElementById("fullNameDisplay");
const emailDisplay = document.getElementById("emailDisplay");

// Load profile data when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadProfileData();
});

// Load profile data from backend
async function loadProfileData() {
  try {
    showLoading();

    const response = await fetch("/api/user/profile");
    if (!response.ok) {
      throw new Error("Failed to load profile data");
    }

    const userData = await response.json();
    console.log("Profile data loaded:", userData);

    populateForm(userData);
    updateDisplay(userData);
  } catch (error) {
    console.error("Error loading profile:", error);
    showMessage("Error loading profile data", "error");
  }
}

// Populate form with user data
function populateForm(userData) {
  const profile = userData.profile || {};

  firstNameInput.value = profile.first_name || "";
  lastNameInput.value = profile.last_name || "";
  genderInput.value = profile.gender || "";
  ageInput.value = profile.age || "";
  avatarUrlInput.value = profile.avatar_url || "";
  bioInput.value = profile.bio || "";

  // Store original data for cancel operation
  originalData = {
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    gender: profile.gender || "",
    age: profile.age || "",
    avatar_url: profile.avatar_url || "",
    bio: profile.bio || "",
  };

  updateAvatarPreview(profile.avatar_url);
}

// Update display elements
function updateDisplay(userData) {
  const profile = userData.profile || {};
  const firstName = profile.first_name || "";
  const lastName = profile.last_name || "";

  // Update full name display
  if (firstName || lastName) {
    fullNameDisplay.textContent = `${firstName} ${lastName}`.trim();
  } else {
    fullNameDisplay.textContent = userData.username || "User";
  }

  // Update avatar display
  updateAvatarDisplay(profile.avatar_url);

  // Update email (keep existing if API doesn't return one)
  if (userData.email) {
    emailDisplay.textContent = userData.email;
  }
}

// Update avatar preview
function updateAvatarPreview(avatarUrl) {
  if (avatarUrl) {
    avatarPreview.innerHTML = `<img src="${avatarUrl}" alt="Avatar Preview" onerror="this.style.display='none'">`;
  } else {
    avatarPreview.innerHTML = "👤";
  }
}

// Update main avatar display
function updateAvatarDisplay(avatarUrl) {
  if (avatarUrl) {
    avatarDisplay.innerHTML = `<img src="${avatarUrl}" alt="Avatar" onerror="this.style.display='none'">`;
  } else {
    avatarDisplay.innerHTML = "👤";
  }
}

// Enable/disable form editing
function setEditingMode(editing) {
  isEditing = editing;

  const fields = [
    firstNameInput,
    lastNameInput,
    genderInput,
    ageInput,
    avatarUrlInput,
    bioInput,
  ];
  fields.forEach((field) => {
    field.disabled = !editing;
  });

  editBtn.style.display = editing ? "none" : "inline-flex";
  cancelBtn.style.display = editing ? "inline-flex" : "none";
  saveBtn.style.display = editing ? "inline-flex" : "none";
}

// Show loading state
function showLoading() {
  firstNameInput.value = "Loading...";
  lastNameInput.value = "Loading...";
  bioInput.value = "Loading...";
}

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

// Event Listeners
editBtn.addEventListener("click", function () {
  setEditingMode(true);
});

cancelBtn.addEventListener("click", function () {
  // Restore original data
  firstNameInput.value = originalData.first_name;
  lastNameInput.value = originalData.last_name;
  genderInput.value = originalData.gender;
  ageInput.value = originalData.age;
  avatarUrlInput.value = originalData.avatar_url;
  bioInput.value = originalData.bio;

  updateAvatarPreview(originalData.avatar_url);
  setEditingMode(false);
});

// Avatar URL change listener
avatarUrlInput.addEventListener("input", function () {
  updateAvatarPreview(this.value);
});

// Form submission
profileForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!isEditing) return;

  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = "⏳ Saving...";

    const formData = {
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      gender: genderInput.value,
      age: ageInput.value ? parseInt(ageInput.value) : null,
      avatar_url: avatarUrlInput.value.trim(),
      bio: bioInput.value.trim(),
    };

    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    const result = await response.json();
    console.log("Profile updated:", result);

    // Update display with new data
    updateDisplay({
      profile: formData,
      username: "{{ user.username }}",
      email: "{{ user.email }}",
    });

    // Update original data
    originalData = { ...formData };

    setEditingMode(false);
    showMessage("Profile updated successfully!", "success");
  } catch (error) {
    console.error("Error updating profile:", error);
    showMessage("Error updating profile", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = "💾 Save Changes";
  }
});
