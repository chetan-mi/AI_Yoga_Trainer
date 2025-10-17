# Yoga Pose Tracking System - Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│                      (webcam.html page)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WEBCAM JAVASCRIPT                             │
│                   (js-webcam.js)                                 │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. User clicks "Start Session"                          │  │
│  │     → Generate sessionId                                 │  │
│  │     → Set sessionActive = true                           │  │
│  │     → Start camera                                       │  │
│  │     → Start detection loop (every 1.5s)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  2. captureAndPredict()                                  │  │
│  │     → Capture frame from webcam                          │  │
│  │     → Send to /predict endpoint                          │  │
│  │     → Get pose name + confidence                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  3. If confidence >= 60%:                                │  │
│  │     → Call logPoseDetection()                            │  │
│  │     → Update UI with pose name                           │  │
│  │     → Show green indicator                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  4. logPoseDetection()                                   │  │
│  │     → Track pose in detectedPoses Map                    │  │
│  │     → Calculate duration                                 │  │
│  │     → Send to /api/log_activity                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  5. User clicks "Stop Session"                           │  │
│  │     → Call saveSessionData()                             │  │
│  │     → Set sessionActive = false                          │  │
│  │     → Stop camera                                        │  │
│  │     → Show session summary                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FLASK BACKEND                               │
│                        (app.py)                                  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  POST /predict                                           │  │
│  │  → Load image from webcam                                │  │
│  │  → Extract pose landmarks                                │  │
│  │  → Run ML model prediction                               │  │
│  │  → Return: { pose, confidence }                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  POST /api/log_activity                                  │  │
│  │  → Verify user is logged in                              │  │
│  │  → Extract: pose_name, confidence, duration, session_id  │  │
│  │  → Call log_user_activity()                              │  │
│  │  → Return: { success, activity_id }                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GET /api/user/stats                                     │  │
│  │  → Call get_user_activity_stats()                        │  │
│  │  → Call get_user_streak()                                │  │
│  │  → Calculate user level                                  │  │
│  │  → Return: { total, unique, streak, level, charts }     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE FUNCTIONS                            │
│                      (utils/user.py)                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  log_user_activity()                                     │  │
│  │  → Get traditional name                                  │  │
│  │  → Create activity document                              │  │
│  │  → Insert into user_activities collection                │  │
│  │  → Return activity_id                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  get_user_activity_stats()                               │  │
│  │  → Count total asanas                                    │  │
│  │  → Count unique asanas                                   │  │
│  │  → Get daily activity (7 days)                           │  │
│  │  → Get top asanas (aggregation)                          │  │
│  │  → Return statistics object                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  get_user_streak()                                       │  │
│  │  → Check last 30 days                                    │  │
│  │  → Count consecutive days with activity                  │  │
│  │  → Return streak count                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MONGODB                                  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Collection: user_activities                             │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ {                                                  │  │  │
│  │  │   _id: ObjectId("..."),                            │  │  │
│  │  │   user_id: ObjectId("..."),                        │  │  │
│  │  │   pose_name: "Tree_Pose_or_Vrksasana_",           │  │  │
│  │  │   traditional_name: "Vrksasana",                   │  │  │
│  │  │   confidence: 0.85,                                │  │  │
│  │  │   session_id: "session_123...",                    │  │  │
│  │  │   duration_seconds: 3,                             │  │  │
│  │  │   timestamp: ISODate("2025-10-02T...")            │  │  │
│  │  │ }                                                  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Indexes:                                                        │
│  • user_id + timestamp (for queries)                            │
│  • pose_name (for aggregations)                                 │
│  • session_id (for session queries)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DASHBOARD                                │
│                     (dashboard.html)                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  On page load:                                           │  │
│  │  → Call /api/user/stats                                  │  │
│  │  → Display total asanas                                  │  │
│  │  → Display unique poses                                  │  │
│  │  │  → Display current streak                                │  │
│  │  → Display user level                                    │  │
│  │  → Render 7-day activity chart                           │  │
│  │  → Render top asanas list                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Auto-refresh every 30 seconds                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### Example Session:

```
Time: 10:00:00 - User clicks "Start Session"
├─ sessionId: "session_1696234567890_abc123"
├─ sessionActive: true
└─ Camera starts

Time: 10:00:01 - First detection
├─ Pose: Tree_Pose_or_Vrksasana_
├─ Confidence: 85%
├─ Action: Log to MongoDB
└─ UI: Show "✅ Logged: Vrksasana (85%)"

Time: 10:00:03 - Second detection
├─ Pose: Tree_Pose_or_Vrksasana_ (same pose)
├─ Confidence: 87%
├─ Duration: 2 seconds
├─ Action: Log to MongoDB
└─ UI: Update display

Time: 10:00:15 - New pose detected
├─ Pose: Warrior_I_Pose_or_Virabhadrasana_I_
├─ Confidence: 92%
├─ Action: Log to MongoDB
└─ UI: Show "✅ Logged: Virabhadrasana I (92%)"

Time: 10:03:00 - User clicks "Stop Session"
├─ Session duration: 180 seconds
├─ Total detections: 45
├─ Unique poses: 8
├─ Action: Save session summary
└─ Camera stops
```

## MongoDB Documents Created:

```javascript
// Document 1 (10:00:01)
{
  _id: ObjectId("6523a1b2c3d4e5f6a7b8c9d0"),
  user_id: ObjectId("6523a1b2c3d4e5f6a7b8c9d1"),
  pose_name: "Tree_Pose_or_Vrksasana_",
  traditional_name: "Vrksasana",
  confidence: 0.85,
  session_id: "session_1696234567890_abc123",
  duration_seconds: 1,
  timestamp: ISODate("2025-10-02T10:00:01.000Z")
}

// Document 2 (10:00:03)
{
  _id: ObjectId("6523a1b2c3d4e5f6a7b8c9d2"),
  user_id: ObjectId("6523a1b2c3d4e5f6a7b8c9d1"),
  pose_name: "Tree_Pose_or_Vrksasana_",
  traditional_name: "Vrksasana",
  confidence: 0.87,
  session_id: "session_1696234567890_abc123",
  duration_seconds: 2,
  timestamp: ISODate("2025-10-02T10:00:03.000Z")
}

// Document 3 (10:00:15)
{
  _id: ObjectId("6523a1b2c3d4e5f6a7b8c9d3"),
  user_id: ObjectId("6523a1b2c3d4e5f6a7b8c9d1"),
  pose_name: "Warrior_I_Pose_or_Virabhadrasana_I_",
  traditional_name: "Virabhadrasana I",
  confidence: 0.92,
  session_id: "session_1696234567890_abc123",
  duration_seconds: 1,
  timestamp: ISODate("2025-10-02T10:00:15.000Z")
}

// ... 42 more documents ...
```

## Dashboard Display:

```
┌─────────────────────────────────────────────────────────┐
│  Your Yoga Journey 📊                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │   150    │  │    25    │  │    5     │  │ Inter-  ││
│  │  Total   │  │  Unique  │  │  Streak  │  │ mediate ││
│  │  Asanas  │  │  Poses   │  │  Days 🔥 │  │ Yogi 💫 ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│                                                          │
│  7-Day Activity:                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ Mon Tue Wed Thu Fri Sat Sun                    │    │
│  │  █   █   █   █   █   █   █                     │    │
│  │  15  20  18  22  25  30  20                    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Top Asanas:                                            │
│  1. Vrksasana ........................... 45 times     │
│  2. Virabhadrasana I .................... 38 times     │
│  3. Adho Mukha Svanasana ................ 32 times     │
│  4. Balasana ............................ 28 times     │
│  5. Bhujangasana ........................ 25 times     │
└─────────────────────────────────────────────────────────┘
```

## Key Points

1. **Session-based tracking** - All poses in one practice session are linked
2. **Real-time logging** - Data saved immediately when pose is detected
3. **Confidence filtering** - Only high-confidence (60%+) poses are logged
4. **Duration tracking** - Measures how long each pose is held
5. **Aggregated statistics** - Dashboard shows meaningful insights
6. **Streak calculation** - Encourages daily practice
7. **Visual feedback** - User knows when data is saved

## Performance Considerations

- Detection runs every 1.5 seconds (not too frequent)
- Only logs poses with 60%+ confidence (reduces noise)
- Uses indexes for fast queries
- Dashboard auto-refreshes every 30 seconds
- Aggregation pipelines for efficient statistics
