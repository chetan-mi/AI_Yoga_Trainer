# Leaderboard Debug Guide

## Issue
The global leaderboard shows "Error loading leaderboard" even though you have 28 asanas recorded.

## Debug Steps

### 1. Check Browser Console
1. Open your dashboard page
2. Press F12 to open developer tools
3. Go to Console tab
4. Look for error messages when leaderboard loads
5. Check what the actual error message says

### 2. Test Debug Endpoint
Visit this URL in your browser (while logged in):
```
http://localhost:5000/api/debug/activities
```

This will show:
- Total activities in database
- Your activities count
- Sample activity records
- Your user ID

### 3. Check Database Directly
If you have MongoDB access, run these queries:

```javascript
// Check if user_activities collection exists and has data
db.user_activities.countDocuments({})

// Check your specific activities
db.user_activities.find({user_id: ObjectId("YOUR_USER_ID")}).count()

// See sample activities
db.user_activities.find().limit(5).pretty()

// Check users collection
db.users.find({username: "your_username"}).pretty()
```

### 4. Test Leaderboard API Directly
Visit this URL in your browser (while logged in):
```
http://localhost:5000/api/leaderboard
```

This should return JSON data like:
```json
[
  {
    "user_id": "...",
    "username": "your_username",
    "total_asanas": 28,
    "is_current_user": true
  }
]
```

## Possible Issues & Solutions

### Issue 1: No Data in user_activities Collection
**Symptoms:** Debug endpoint shows 0 total activities
**Cause:** Yoga poses aren't being logged to database
**Solution:** 
1. Go to webcam page
2. Start a session
3. Perform some poses
4. Check if green "✅ Logged: [Pose Name]" indicator appears
5. Check browser console for logging errors

### Issue 2: Wrong User ID Format
**Symptoms:** Debug endpoint shows activities but leaderboard is empty
**Cause:** User ID mismatch between activities and current user
**Solution:** Check if user IDs match in debug endpoint

### Issue 3: MongoDB Aggregation Error
**Symptoms:** Server console shows aggregation errors
**Cause:** Complex aggregation pipeline failing
**Solution:** The code now has a fallback simple method

### Issue 4: Collection Name Mismatch
**Symptoms:** Activities exist but aggregation finds nothing
**Cause:** Wrong collection name in aggregation
**Solution:** Verify collection is named 'user_activities'

## Enhanced Error Handling

I've added:

### Backend Improvements:
- Debug logging to server console
- Fallback simple aggregation method
- Better error messages
- Activity count checking

### Frontend Improvements:
- Detailed console logging
- Better error message display
- HTTP status checking
- Response validation

## Testing Steps

1. **Check Debug Endpoint:**
   ```
   GET /api/debug/activities
   ```
   Should show your activity count

2. **Check Leaderboard API:**
   ```
   GET /api/leaderboard
   ```
   Should return your user data

3. **Check Browser Console:**
   - Look for "Loading leaderboard..." message
   - Check for any error messages
   - Verify leaderboard data is received

4. **Check Server Console:**
   - Look for "Getting leaderboard for user: ..." message
   - Check "Total activities in database: ..." count
   - Look for any error messages

## Expected Behavior

If you have 28 asanas, you should see:

1. **Debug endpoint response:**
   ```json
   {
     "total_activities": 28,
     "current_user_activities": 28,
     "current_user_id": "your_user_id",
     "sample_activities": [...]
   }
   ```

2. **Leaderboard response:**
   ```json
   [
     {
       "user_id": "your_user_id",
       "username": "your_username", 
       "total_asanas": 28,
       "is_current_user": true
     }
   ]
   ```

3. **Dashboard display:**
   ```
   🥇  your_username (You)    28 asanas
       New Yogi 🎯
   ```

## Next Steps

1. **Test the debug endpoint first** - this will tell us if the data exists
2. **Check browser console** for detailed error messages
3. **Share the results** so I can help fix the specific issue

The enhanced error handling should now give us much better information about what's going wrong! 🔍