# Profile Page Account Settings Button

## Added Feature
Added a "Account Settings" button to the profile page that navigates to the account-settings page.

## Changes Made

### 1. Added Account Settings Button
**Location:** `app/templates/profile.html` - Action Buttons section

```html
<button type="button" id="accountSettingsBtn" class="btn btn-secondary account-settings" onclick="window.location.href='{{ url_for('account_settings') }}'">
    🔒 Account Settings
</button>
```

### 2. Added Custom CSS Styling
**Added to:** `app/templates/profile.html` - Style section

```css
.btn-secondary.account-settings {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    color: white;
}

.btn-secondary.account-settings:hover {
    background: linear-gradient(135deg, #ee5a52, #dc3545);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
}
```

## Button Features

### Visual Design:
- **Color:** Red gradient background (to indicate security/settings)
- **Icon:** 🔒 lock icon to represent security settings
- **Text:** "Account Settings"
- **Hover Effect:** Darker red with lift animation and shadow

### Functionality:
- **Click Action:** Navigates to `/account-settings` page
- **Always Visible:** Button is always shown (not hidden during edit mode)
- **Positioned:** Left side of action buttons (before Edit Profile button)

## Button Layout

The action buttons now appear in this order:
```
[🔒 Account Settings] [✏️ Edit Profile]
```

When editing:
```
[🔒 Account Settings] [❌ Cancel] [💾 Save Changes]
```

## Navigation Flow

```
Profile Page
├── 🔒 Account Settings → Account Settings Page
│   ├── Change Username
│   ├── Change Password  
│   └── Delete Account
├── ✏️ Edit Profile → Edit mode (same page)
├── ❌ Cancel → Cancel edit mode
└── 💾 Save Changes → Save profile changes
```

## Usage

1. **Go to Profile Page:** `/profile`
2. **Click "🔒 Account Settings" button**
3. **Redirects to:** `/account-settings` page
4. **Access:** Username change, password change, account deletion

## Styling Details

### Colors:
- **Normal State:** Red gradient (#ff6b6b to #ee5a52)
- **Hover State:** Darker red gradient (#ee5a52 to #dc3545)
- **Text:** White

### Effects:
- **Hover Animation:** Button lifts up 2px
- **Shadow:** Red glow shadow on hover
- **Transition:** Smooth 0.3s animation

## Responsive Design

The button works on all screen sizes:
- **Desktop:** Horizontal layout with other buttons
- **Mobile:** Stacked vertical layout (responsive CSS already in place)

## Security Context

The button provides easy access to security-related settings:
- **Username Changes:** Requires current password
- **Password Changes:** Requires current password verification  
- **Account Deletion:** Requires double confirmation
- **Authentication:** All actions require user to be logged in

The red color scheme indicates these are security/danger zone actions, making it visually distinct from the profile editing functionality.

## Testing

1. **Navigate to profile page** (`/profile`)
2. **Look for red "🔒 Account Settings" button** on the left
3. **Click the button**
4. **Should redirect to account settings page**
5. **Test hover effect** - button should lift and glow red

The button is now ready to use! 🎉