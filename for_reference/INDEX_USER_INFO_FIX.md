# Index Page User Info & Authentication Fix

## Issues Fixed

### 1. **Index Page User Display**
- Shows username and avatar when logged in
- Login button changes to Logout button
- Proper user info retrieval from database

### 2. **Start Your Practice Authentication**
- Fixed JavaScript function to properly check authentication
- Added debugging console logs
- Prevents direct access to webcam without login

## Changes Made

### 1. Updated Index Route (`app.py`)
```python
@app.route('/')
def index():
    """Render the main page"""
    user_info = None
    if current_user.is_authenticated:
        try:
            # Get user data from database
            user_doc = db.db.users.find_one({'_id': ObjectId(current_user.id)})
            if user_doc:
                profile = user_doc.get('profile', {})
                user_info = {
                    'username': user_doc.get('username', ''),
                    'email': user_doc.get('email', ''),
                    'avatar_url': profile.get('avatar_url', '')
                }
        except Exception as e:
            # Fallback to basic info
            user_info = {
                'username': current_user.username,
                'email': current_user.email,
                'avatar_url': ''
            }
    
    return render_template('index.html', user=user_info)
```

### 2. Updated Index Template (`app/templates/index.html`)
```html
<div class="nav-actions">
    {% if user %}
        <!-- User is logged in -->
        <div class="user-info">
            {% if user.avatar_url %}
                <img src="{{ user.avatar_url }}" alt="Avatar" class="user-avatar">
            {% else %}
                <div class="user-avatar-placeholder">👤</div>
            {% endif %}
            <span class="username">{{ user.username }}</span>
            <a href="{{ url_for('logout') }}" class="btn btn-logout">Logout</a>
        </div>
    {% else %}
        <!-- User is not logged in -->
        <a href="{{ url_for('login') }}" class="btn btn-login">Login</a>
    {% endif %}
</div>
```

### 3. Fixed JavaScript Function (`app/static/js/script.js`)
```javascript
async function redirectToWebcam() {
    console.log('redirectToWebcam called');
    
    try {
        // Check if user is logged in by calling the current_user API
        console.log('Checking user authentication...');
        const response = await fetch('/api/current_user');
        
        console.log('API response status:', response.status);
        
        if (response.ok) {
            // User is logged in, redirect to webcam
            console.log('User is authenticated, redirecting to webcam');
            window.location.href = '/webcam';
        } else {
            // User is not logged in, redirect to login with next parameter
            console.log('User not authenticated, redirecting to login');
            window.location.href = '/login?next=' + encodeURIComponent('/webcam');
        }
    } catch (error) {
        // If API call fails, assume not logged in
        console.log('API call failed, assuming not logged in:', error);
        window.location.href = '/login?next=' + encodeURIComponent('/webcam');
    }
}
```

### 4. Added CSS Styles (`app/static/js/script.js`)
```css
.user-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #22c55e;
}

.user-avatar-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    border: 2px solid #22c55e;
}

.username {
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.btn-logout {
    background-color: #ef4444;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;
    transition: background-color 0.3s ease;
}

.btn-logout:hover {
    background-color: #dc2626;
}
```

## How It Works Now

### Navigation Display:

**When NOT logged in:**
```
[Logo] [Nav Links] [Login Button]
```

**When logged in:**
```
[Logo] [Nav Links] [👤 Avatar] [Username] [Logout Button]
```

### Start Your Practice Flow:

1. **User clicks "Start Your Practice"**
2. **JavaScript calls `/api/current_user`**
3. **If authenticated (200 response):**
   - Redirects to `/webcam`
4. **If not authenticated (401/403 response):**
   - Redirects to `/login?next=/webcam`
5. **After login:**
   - Redirects to `/webcam` automatically

## Testing Steps

### Test 1: Not Logged In
1. **Logout** if currently logged in
2. **Visit index page** (`/`)
3. **Should see:** "Login" button in navigation
4. **Click "Start Your Practice"**
5. **Open browser console** (F12)
6. **Should see logs:**
   - "redirectToWebcam called"
   - "Checking user authentication..."
   - "API response status: 401" (or similar)
   - "User not authenticated, redirecting to login"
7. **Should redirect** to login page with message
8. **Login** with credentials
9. **Should redirect** to webcam page

### Test 2: Logged In
1. **Login** to your account
2. **Visit index page** (`/`)
3. **Should see:** Your username, avatar (if set), and "Logout" button
4. **Click "Start Your Practice"**
5. **Open browser console** (F12)
6. **Should see logs:**
   - "redirectToWebcam called"
   - "Checking user authentication..."
   - "API response status: 200"
   - "User is authenticated, redirecting to webcam"
7. **Should redirect** directly to webcam page

### Test 3: Avatar Display
1. **Login** and go to profile page
2. **Add an avatar URL** (e.g., `https://via.placeholder.com/150`)
3. **Save profile**
4. **Visit index page** (`/`)
5. **Should see:** Your avatar image in navigation
6. **If no avatar:** Should see placeholder icon (👤)

## Debugging

### Browser Console Logs:
- Check for authentication API calls
- Look for redirect logs
- Verify no JavaScript errors

### Network Tab:
- Check `/api/current_user` request
- Verify response status (200 = logged in, 401 = not logged in)

### Server Console:
- Look for any errors in user info retrieval
- Check authentication logs

## Security Features

- **Proper authentication check** via API call
- **Secure redirects** only to internal paths
- **Fallback handling** for API failures
- **Database error handling** for user info retrieval

## User Experience

### Before:
- No indication of login status on index page
- "Start Practice" button bypassed authentication
- Users could access webcam without login

### After:
- Clear visual indication of login status
- Username and avatar displayed when logged in
- "Start Practice" button properly checks authentication
- Seamless flow from index → login → webcam

The system now properly handles authentication and provides clear user feedback! 🎯