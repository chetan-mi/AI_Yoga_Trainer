# Yoga Pose Tracking System - Implementation Guide

## What Was Changed

### 1. JavaScript (app/static/js/js-webcam.js)

**Added Session Tracking Variables:**
- `sessionActive` - Tracks if a session is currently running
- `sessionId` - Unique identifier for each session
- `sessionStartTime` - When the session started
- `detectedPoses` - Map to track all poses detected in the session
- `MIN_CONFIDENCE_FOR_LOGGING` - Only log poses with 60%+ confidence

**New Functions:**
- `generateSessionId()` - Creates unique session IDs
- `saveSessionData()` - Saves session summary when user clicks stop
- `logPoseDetection()` - Logs each detected pose to MongoDB

**Updated Functions:**
- Start button now initializes session tracking
- Stop button now saves session data before ending
- `captureAndPredict()` now calls `logPoseDetection()` for each detected pose

### 2. Backend (app.py)

**Updated `/api/log_activity` endpoint:**
- Now accepts `session_id` parameter
- Passes session_id to the database logging function

### 3. Database Functions (utils/user.py)

**Updated `log_user_activity()`:**
- Now accepts and stores `session_id`
- Links all poses in a session together

**Added `get_traditional_name()`:**
- Converts pose names to traditional Sanskrit names
- Used for better display in the database

## How It Works

### Flow:

1. **User clicks "Start Session":**
   - Camera starts
   - Session ID is generated (e.g., `session_1696234567890_abc123`)
   - Session start time is recorded
   - Pose detection loop begins

2. **During Session:**
   - Every 1.5 seconds, a frame is captured
   - Pose is detected with confidence score
   - If confidence >= 60%, pose is logged to MongoDB:
     ```javascript
     {
       user_id: ObjectId("..."),
       pose_name: "Tree_Pose_or_Vrksasana_",
       traditional_name: "Vrksasana",
       confidence: 0.85,
       session_id: "session_1696234567890_abc123",
       duration_seconds: 3,
       timestamp: ISODate("2025-10-02T...")
     }
     ```
   - Green indicator shows "✅ Logged: Vrksasana (85%)"

3. **User clicks "Stop Session":**
   - Session data is saved
   - Camera stops
   - Console shows summary: "✅ Session summary: 45 poses detected, 8 unique poses, 180s duration"

### Database Collections

**user_activities** - Stores each pose detection:
```javascript
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),
  pose_name: "Tree_Pose_or_Vrksasana_",
  traditional_name: "Vrksasana",
  confidence: 0.85,
  session_id: "session_1696234567890_abc123",
  duration_seconds: 3,
  timestamp: ISODate("2025-10-02T10:30:45.123Z")
}
```

## Testing the System

### 1. Check if it's working:

Open browser console (F12) and look for these messages:

**On page load:**
```
User authenticated: your_username
Webcam session started for user: 64f8a...
```

**On Start button:**
```
🎯 Session started: session_1696234567890_abc123
```

**During detection:**
```
🎯 Detected pose: Tree_Pose_or_Vrksasana_ with 85% confidence
✅ Activity logged (1): Tree_Pose_or_Vrksasana_ - 85%
```

**On Stop button:**
```
✅ Session summary: 45 poses detected, 8 unique poses, 180s duration
✅ Session ended and saved
```

### 2. Check MongoDB:

```javascript
// Connect to MongoDB
use your_database_name

// Check recent activities
db.user_activities.find().sort({timestamp: -1}).limit(10).pretty()

// Count activities for a user
db.user_activities.countDocuments({user_id: ObjectId("your_user_id")})

// Get activities by session
db.user_activities.find({session_id: "session_1696234567890_abc123"}).pretty()

// Get unique poses for a user
db.user_activities.distinct("traditional_name", {user_id: ObjectId("your_user_id")})
```

### 3. Check Dashboard Stats:

Go to `/dashboard` and you should see:
- Total Asanas count increasing
- Unique Poses count
- 7-Day Activity chart
- Top Asanas list

## Troubleshooting

### Issue: "Cannot log pose: session not active"
**Solution:** Make sure you clicked "Start Session" button

### Issue: "No user ID available"
**Solution:** Make sure you're logged in. Check console for authentication errors.

### Issue: Poses not appearing in dashboard
**Solution:** 
1. Check browser console for errors
2. Verify MongoDB connection in server logs
3. Make sure confidence is >= 60%
4. Refresh the dashboard page

### Issue: Database indexes not created
**Solution:** Restart the Flask app - indexes are created on startup

## API Endpoints

### POST /api/log_activity
Logs a single pose detection
```javascript
{
  "pose_name": "Tree_Pose_or_Vrksasana_",
  "confidence": 0.85,
  "duration_seconds": 3,
  "session_id": "session_1696234567890_abc123"
}
```

### GET /api/user/stats?days=30
Gets user statistics for dashboard
```javascript
{
  "total_asanas": 150,
  "unique_asanas": 25,
  "current_streak": 5,
  "user_level": "Intermediate Yogi 💫",
  "daily_activity": [...],
  "top_asanas": [...]
}
```

## Next Steps

1. **Test the system** - Do a yoga session and verify data is saved
2. **Check the dashboard** - Verify stats are updating
3. **Monitor MongoDB** - Check that documents are being created
4. **Review console logs** - Look for any errors

## Features

✅ Session tracking with unique IDs
✅ Real-time pose logging to MongoDB
✅ Confidence threshold (60%+)
✅ Duration tracking per pose
✅ Visual feedback (green indicator)
✅ Dashboard statistics
✅ Streak calculation
✅ Top asanas tracking
✅ Daily activity charts

The system is now fully integrated and ready to track your yoga practice!
