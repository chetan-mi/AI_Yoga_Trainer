# Testing Checklist for Yoga Pose Tracking System

## Pre-Testing Setup

- [ ] MongoDB is running
- [ ] Flask app is running (`python app.py`)
- [ ] You have a registered user account
- [ ] You are logged in to the application

## Test 1: Basic Session Flow

### Steps:
1. [ ] Navigate to `/webcam` page
2. [ ] Open browser console (F12)
3. [ ] Click "Start Session" button
4. [ ] Perform a yoga pose in front of camera
5. [ ] Wait for pose detection (1-2 seconds)
6. [ ] Click "End Session" button

### Expected Results:
- [ ] Console shows: "🎯 Session started: session_[timestamp]_[random]"
- [ ] Console shows: "🎯 Detected pose: [Pose Name] with XX% confidence"
- [ ] Console shows: "✅ Activity logged (X): [Pose Name] - XX%"
- [ ] Green indicator appears: "✅ Logged: [Pose Name] (XX%)"
- [ ] Console shows: "✅ Session summary: X poses detected, Y unique poses, Zs duration"
- [ ] Console shows: "✅ Session ended and saved"

## Test 2: MongoDB Data Verification

### Steps:
1. [ ] Open MongoDB Compass or mongo shell
2. [ ] Connect to your database
3. [ ] Navigate to `user_activities` collection
4. [ ] Run query: `db.user_activities.find().sort({timestamp: -1}).limit(5)`

### Expected Results:
- [ ] Documents exist in the collection
- [ ] Each document has:
  - [ ] `user_id` (ObjectId)
  - [ ] `pose_name` (string)
  - [ ] `traditional_name` (string)
  - [ ] `confidence` (number between 0 and 1)
  - [ ] `session_id` (string starting with "session_")
  - [ ] `duration_seconds` (number)
  - [ ] `timestamp` (ISODate)

## Test 3: Dashboard Statistics

### Steps:
1. [ ] Navigate to `/dashboard` page
2. [ ] Wait for stats to load (1-2 seconds)
3. [ ] Check "Your Yoga Journey" section

### Expected Results:
- [ ] "Total Asanas" shows a number > 0
- [ ] "Unique Poses" shows a number > 0
- [ ] "Day Streak" shows a number >= 0
- [ ] "Your Level" shows a level (e.g., "New Yogi 🎯")
- [ ] "7-Day Activity" chart displays bars
- [ ] "Top Asanas" list shows pose names with counts

## Test 4: Multiple Poses in One Session

### Steps:
1. [ ] Navigate to `/webcam` page
2. [ ] Click "Start Session"
3. [ ] Perform Tree Pose (hold for 3-5 seconds)
4. [ ] Switch to Warrior I Pose (hold for 3-5 seconds)
5. [ ] Switch to Child Pose (hold for 3-5 seconds)
6. [ ] Click "End Session"

### Expected Results:
- [ ] Console shows detections for all 3 poses
- [ ] Green indicator appears for each pose
- [ ] Session summary shows: "3+ poses detected, 3 unique poses"
- [ ] MongoDB has documents for all 3 poses with same `session_id`

## Test 5: Confidence Threshold

### Steps:
1. [ ] Navigate to `/webcam` page
2. [ ] Click "Start Session"
3. [ ] Stand in an unclear position (not a proper pose)
4. [ ] Watch console for confidence values

### Expected Results:
- [ ] Poses with confidence < 60% are NOT logged
- [ ] Console may show detection but no "✅ Activity logged" message
- [ ] No green indicator appears for low-confidence poses
- [ ] Only poses with confidence >= 60% are saved to database

## Test 6: Session Isolation

### Steps:
1. [ ] Complete a full session (start → poses → stop)
2. [ ] Note the session_id from console
3. [ ] Start a new session
4. [ ] Note the new session_id
5. [ ] Check MongoDB

### Expected Results:
- [ ] Each session has a unique `session_id`
- [ ] Session IDs are different
- [ ] Poses from different sessions have different `session_id` values
- [ ] Can query poses by session_id to get only that session's data

## Test 7: Dashboard Auto-Refresh

### Steps:
1. [ ] Open `/dashboard` in one browser tab
2. [ ] Open `/webcam` in another tab
3. [ ] Perform a yoga session in webcam tab
4. [ ] Switch back to dashboard tab
5. [ ] Wait 30 seconds (or click refresh button)

### Expected Results:
- [ ] Dashboard statistics update automatically
- [ ] "Total Asanas" count increases
- [ ] "7-Day Activity" chart updates
- [ ] "Top Asanas" list updates

## Test 8: User Authentication

### Steps:
1. [ ] Logout from the application
2. [ ] Try to access `/webcam` directly
3. [ ] Try to access `/api/log_activity` directly

### Expected Results:
- [ ] Redirected to login page
- [ ] Cannot access webcam without login
- [ ] API returns 401 Unauthorized

## Test 9: Multiple Users

### Steps:
1. [ ] Login as User A
2. [ ] Perform a yoga session
3. [ ] Logout
4. [ ] Login as User B
5. [ ] Perform a yoga session
6. [ ] Check MongoDB

### Expected Results:
- [ ] User A's activities have User A's `user_id`
- [ ] User B's activities have User B's `user_id`
- [ ] Each user sees only their own stats on dashboard
- [ ] Activities are properly isolated by user

## Test 10: Error Handling

### Steps:
1. [ ] Stop MongoDB server
2. [ ] Try to perform a yoga session
3. [ ] Check console for errors
4. [ ] Restart MongoDB
5. [ ] Try again

### Expected Results:
- [ ] Console shows error messages
- [ ] Application doesn't crash
- [ ] After MongoDB restart, logging works again

## Test 11: Long Session

### Steps:
1. [ ] Start a session
2. [ ] Perform various poses for 5+ minutes
3. [ ] End session
4. [ ] Check console summary

### Expected Results:
- [ ] Session summary shows correct duration (300+ seconds)
- [ ] All poses are logged
- [ ] No memory leaks or performance issues
- [ ] Dashboard updates correctly

## Test 12: API Endpoints

### Using curl or Postman:

#### Test /api/current_user
```bash
curl -X GET http://localhost:5000/api/current_user \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```
- [ ] Returns user info with `user_id`, `username`, `email`

#### Test /api/log_activity
```bash
curl -X POST http://localhost:5000/api/log_activity \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{
    "pose_name": "Tree_Pose_or_Vrksasana_",
    "confidence": 0.85,
    "duration_seconds": 3,
    "session_id": "test_session_123"
  }'
```
- [ ] Returns `{"success": true, "activity_id": "..."}`

#### Test /api/user/stats
```bash
curl -X GET "http://localhost:5000/api/user/stats?days=30" \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```
- [ ] Returns statistics object with all required fields

## MongoDB Verification Queries

### Query 1: Check Recent Activities
```javascript
db.user_activities.find().sort({timestamp: -1}).limit(10).pretty()
```
- [ ] Shows recent activities

### Query 2: Count User Activities
```javascript
db.user_activities.countDocuments({user_id: ObjectId("YOUR_USER_ID")})
```
- [ ] Returns correct count

### Query 3: Get Session Data
```javascript
db.user_activities.find({session_id: "YOUR_SESSION_ID"}).pretty()
```
- [ ] Shows all poses from that session

### Query 4: Check Indexes
```javascript
db.user_activities.getIndexes()
```
- [ ] Shows indexes on `user_id`, `pose_name`, `session_id`, `timestamp`

## Performance Checks

- [ ] Page loads in < 2 seconds
- [ ] Pose detection happens every 1.5 seconds
- [ ] No lag or freezing during session
- [ ] Dashboard loads stats in < 1 second
- [ ] MongoDB queries execute in < 100ms

## Browser Console Checks

### No Errors:
- [ ] No JavaScript errors in console
- [ ] No 404 errors for resources
- [ ] No CORS errors
- [ ] No authentication errors

### Expected Logs:
- [ ] "User authenticated: [username]"
- [ ] "Webcam session started for user: [user_id]"
- [ ] "🎯 Session started: [session_id]"
- [ ] "🎯 Detected pose: [pose] with XX% confidence"
- [ ] "✅ Activity logged (X): [pose] - XX%"
- [ ] "✅ Session summary: ..."
- [ ] "✅ Session ended and saved"

## Final Verification

### Complete Flow Test:
1. [ ] Login
2. [ ] Go to dashboard - verify initial stats
3. [ ] Go to webcam page
4. [ ] Start session
5. [ ] Perform 5 different poses
6. [ ] End session
7. [ ] Go back to dashboard
8. [ ] Verify stats increased by 5+ asanas
9. [ ] Check MongoDB - verify 5+ new documents
10. [ ] Logout

## Troubleshooting Guide

### Issue: Poses not being logged
**Check:**
- [ ] User is logged in (check console for user_id)
- [ ] Session is active (check console for "Session started")
- [ ] Confidence is >= 60%
- [ ] MongoDB is running
- [ ] No errors in console

### Issue: Dashboard not showing stats
**Check:**
- [ ] User is logged in
- [ ] MongoDB has data for this user
- [ ] No errors in browser console
- [ ] API endpoint `/api/user/stats` returns data
- [ ] Try refreshing the page

### Issue: Green indicator not showing
**Check:**
- [ ] Pose confidence is >= 60%
- [ ] `showActivityIndicator()` function exists
- [ ] No CSS issues hiding the indicator
- [ ] Check browser console for errors

### Issue: Session ID not generated
**Check:**
- [ ] `generateSessionId()` function exists
- [ ] Start button handler calls it
- [ ] Check console for session ID log

## Success Criteria

✅ All tests pass
✅ No errors in console
✅ Data appears in MongoDB
✅ Dashboard shows correct statistics
✅ Green indicators appear for logged poses
✅ Session summaries are accurate
✅ Multiple sessions work correctly
✅ User isolation works properly

## Next Steps After Testing

1. [ ] Document any issues found
2. [ ] Fix any bugs discovered
3. [ ] Optimize performance if needed
4. [ ] Add more features (optional):
   - Session history page
   - Pose recommendations
   - Progress charts
   - Export data feature
   - Social sharing
   - Achievements/badges

## Notes

- Keep browser console open during testing
- Check MongoDB after each test
- Take screenshots of any errors
- Note any performance issues
- Test with different poses
- Test with different lighting conditions
- Test with different camera angles
