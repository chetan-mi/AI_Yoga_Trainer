# MongoDB Queries for Yoga Tracking System

## Useful Queries to Check Your Data

### 1. Check Recent Activities (Last 10)
```javascript
db.user_activities.find().sort({timestamp: -1}).limit(10).pretty()
```

### 2. Count Total Activities for a User
```javascript
// Replace with your actual user_id
db.user_activities.countDocuments({
  user_id: ObjectId("YOUR_USER_ID_HERE")
})
```

### 3. Get All Activities from a Specific Session
```javascript
db.user_activities.find({
  session_id: "session_1696234567890_abc123"
}).sort({timestamp: 1}).pretty()
```

### 4. Get Unique Poses Performed by User
```javascript
db.user_activities.distinct("traditional_name", {
  user_id: ObjectId("YOUR_USER_ID_HERE")
})
```

### 5. Count Poses by Type (Top 5)
```javascript
db.user_activities.aggregate([
  {
    $match: {
      user_id: ObjectId("YOUR_USER_ID_HERE")
    }
  },
  {
    $group: {
      _id: "$traditional_name",
      count: { $sum: 1 },
      avgConfidence: { $avg: "$confidence" },
      totalDuration: { $sum: "$duration_seconds" }
    }
  },
  {
    $sort: { count: -1 }
  },
  {
    $limit: 5
  }
])
```

### 6. Get Today's Activities
```javascript
db.user_activities.find({
  user_id: ObjectId("YOUR_USER_ID_HERE"),
  timestamp: {
    $gte: new Date(new Date().setHours(0,0,0,0))
  }
}).sort({timestamp: -1}).pretty()
```

### 7. Get Activities from Last 7 Days
```javascript
var sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

db.user_activities.find({
  user_id: ObjectId("YOUR_USER_ID_HERE"),
  timestamp: { $gte: sevenDaysAgo }
}).sort({timestamp: -1}).pretty()
```

### 8. Get Session Summary
```javascript
db.user_activities.aggregate([
  {
    $match: {
      user_id: ObjectId("YOUR_USER_ID_HERE")
    }
  },
  {
    $group: {
      _id: "$session_id",
      poseCount: { $sum: 1 },
      uniquePoses: { $addToSet: "$traditional_name" },
      avgConfidence: { $avg: "$confidence" },
      totalDuration: { $sum: "$duration_seconds" },
      sessionStart: { $min: "$timestamp" },
      sessionEnd: { $max: "$timestamp" }
    }
  },
  {
    $project: {
      _id: 1,
      poseCount: 1,
      uniquePoseCount: { $size: "$uniquePoses" },
      uniquePoses: 1,
      avgConfidence: { $round: ["$avgConfidence", 2] },
      totalDuration: 1,
      sessionStart: 1,
      sessionEnd: 1,
      sessionLength: {
        $divide: [
          { $subtract: ["$sessionEnd", "$sessionStart"] },
          1000
        ]
      }
    }
  },
  {
    $sort: { sessionStart: -1 }
  }
])
```

### 9. Get Daily Activity Count (Last 7 Days)
```javascript
var sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

db.user_activities.aggregate([
  {
    $match: {
      user_id: ObjectId("YOUR_USER_ID_HERE"),
      timestamp: { $gte: sevenDaysAgo }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
      },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  }
])
```

### 10. Get User's Best Poses (Highest Average Confidence)
```javascript
db.user_activities.aggregate([
  {
    $match: {
      user_id: ObjectId("YOUR_USER_ID_HERE")
    }
  },
  {
    $group: {
      _id: "$traditional_name",
      count: { $sum: 1 },
      avgConfidence: { $avg: "$confidence" },
      maxConfidence: { $max: "$confidence" }
    }
  },
  {
    $match: {
      count: { $gte: 3 } // At least 3 attempts
    }
  },
  {
    $sort: { avgConfidence: -1 }
  },
  {
    $limit: 10
  }
])
```

### 11. Delete All Activities for Testing
```javascript
// ⚠️ WARNING: This deletes all activities for a user!
db.user_activities.deleteMany({
  user_id: ObjectId("YOUR_USER_ID_HERE")
})
```

### 12. Delete Activities from a Specific Session
```javascript
db.user_activities.deleteMany({
  session_id: "session_1696234567890_abc123"
})
```

### 13. Check Indexes
```javascript
db.user_activities.getIndexes()
```

### 14. Get User Info
```javascript
db.users.findOne({
  _id: ObjectId("YOUR_USER_ID_HERE")
})
```

### 15. Get User's Current Streak
```javascript
// This is complex - better to use the API endpoint
// GET /api/user/stats?days=30
```

## How to Get Your User ID

### Method 1: From Browser Console
1. Open webcam page
2. Open browser console (F12)
3. Look for: "Webcam session started for user: [YOUR_USER_ID]"

### Method 2: From MongoDB
```javascript
db.users.findOne({ username: "your_username" })
```

### Method 3: From Login
```javascript
db.users.findOne({ email: "your_email@example.com" })
```

## Example: Complete Analysis for a User

```javascript
// 1. Get user ID
var userId = db.users.findOne({ username: "john_doe" })._id;

// 2. Total activities
var totalActivities = db.user_activities.countDocuments({ user_id: userId });
print("Total Activities:", totalActivities);

// 3. Unique poses
var uniquePoses = db.user_activities.distinct("traditional_name", { user_id: userId });
print("Unique Poses:", uniquePoses.length);

// 4. Top 5 poses
print("\nTop 5 Poses:");
db.user_activities.aggregate([
  { $match: { user_id: userId } },
  { $group: { _id: "$traditional_name", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 }
]).forEach(doc => print(doc._id + ": " + doc.count));

// 5. Recent sessions
print("\nRecent Sessions:");
db.user_activities.aggregate([
  { $match: { user_id: userId } },
  { $group: {
      _id: "$session_id",
      poseCount: { $sum: 1 },
      sessionStart: { $min: "$timestamp" }
    }
  },
  { $sort: { sessionStart: -1 } },
  { $limit: 5 }
]).forEach(doc => print(doc._id + ": " + doc.poseCount + " poses"));
```

## Tips

1. **Always use ObjectId()** when querying by user_id or _id
2. **Use .pretty()** to format output nicely
3. **Use .limit()** to avoid overwhelming output
4. **Use .sort()** to get most recent first
5. **Use aggregation** for complex queries and statistics

## Backup Your Data

```javascript
// Export to JSON
mongoexport --db=your_database --collection=user_activities --out=activities_backup.json

// Import from JSON
mongoimport --db=your_database --collection=user_activities --file=activities_backup.json
```
