# Logout Redirect Fix

## Issue
When user clicks logout on index.html, it was redirecting to login.html instead of staying on the same page.

## Solution
Modified the logout system to support a `next` parameter that allows redirecting back to the originating page.

## Changes Made

### 1. Updated Logout Route (`app.py`)
```python
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    
    # Check if there's a 'next' parameter to redirect to
    next_page = request.args.get('next')
    if next_page:
        # Validate that the next_page is safe (starts with /)
        if next_page.startswith('/') and not next_page.startswith('//'):
            return redirect(next_page)
    
    # Default redirect to login page
    return redirect(url_for('login'))
```

### 2. Updated Logout Link (`app/templates/index.html`)
```html
<a href="{{ url_for('logout', next='/') }}" class="btn btn-logout">Logout</a>
```

## How It Works

### Before:
1. User clicks "Logout" on index page
2. Redirects to `/logout`
3. Logs out user
4. Redirects to `/login` page

### After:
1. User clicks "Logout" on index page
2. Redirects to `/logout?next=/`
3. Logs out user
4. Redirects back to `/` (index page)

## User Experience

### Index Page Logout Flow:
1. **User is logged in** - sees username, avatar, logout button
2. **Clicks "Logout"** 
3. **Gets logged out** - flash message appears
4. **Stays on index page** - now sees login button instead
5. **Can continue browsing** or click login to log back in

### Other Pages (Dashboard, Profile, etc.):
- **Still redirect to login** as before (no `next` parameter)
- **Maintains existing behavior** for internal pages

## Security Features

- **URL validation** - only allows redirects to internal paths
- **Prevents open redirects** - blocks external URLs
- **Safe fallback** - defaults to login page if invalid redirect

## Testing

### Test Logout from Index:
1. **Login** to your account
2. **Go to index page** (`/`)
3. **Should see:** Username, avatar, logout button
4. **Click "Logout"**
5. **Should see:** Flash message "You have been logged out."
6. **Should stay on:** Index page (not redirect to login)
7. **Should see:** Login button (instead of user info)

### Test Logout from Dashboard:
1. **Login** and go to dashboard
2. **Click logout** (if there's a logout link)
3. **Should redirect:** To login page (normal behavior)

### Test Logout from Other Pages:
1. **Direct access:** `/logout` (without next parameter)
2. **Should redirect:** To login page (default behavior)

## URL Examples

### Index Page Logout:
```
/logout?next=/
```
- Logs out and redirects to `/` (index page)

### Default Logout:
```
/logout
```
- Logs out and redirects to `/login` (login page)

### Custom Redirect:
```
/logout?next=/dashboard
```
- Logs out and redirects to `/dashboard`

## Benefits

✅ **Better UX** - Users stay on the page they were viewing
✅ **Consistent navigation** - No unexpected redirects
✅ **Flexible system** - Can be used from any page
✅ **Secure implementation** - Validates redirect URLs
✅ **Backward compatible** - Existing logout links still work

## Implementation Notes

- **Only index page** uses the `next=/` parameter
- **Other pages** can use default logout behavior
- **Flash messages** still work normally
- **Security validation** prevents malicious redirects

The logout experience is now much more user-friendly! 🎯