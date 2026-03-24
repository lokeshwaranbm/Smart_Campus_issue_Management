# 🚀 SLA System - Complete Setup & Integration Guide

## Quick Start (5-10 minutes)

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

This installs:
- `mongoose` - MongoDB driver
- `node-cron` - For background SLA monitoring jobs

### 2. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
```
Create cluster at https://www.mongodb.com/cloud/atlas
Copy connection string into .env or use directly
```

### 3. Start Backend Server

```bash
npm run dev
```

Expected output:
```
✅ MongoDB connected successfully
🚀 Backend running on http://localhost:5000
🚀 Initializing SLA Monitoring Jobs...
```

### 4. Seed Initial Categories

```bash
node seed-categories.js
```

Expected output:
```
✅ Connected to MongoDB
🗑️  Cleared existing categories
✅ Created 8 categories:
   - Electrical (24h SLA)
   - Plumbing (48h SLA)
   - Network (16h SLA)
   - Cleanliness (72h SLA)
   - Hostel (48h SLA)
   - Transport (96h SLA)
   - Maintenance (48h SLA)
   - Other (72h SLA)
```

### 5. Start Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

Visit: `http://localhost:5174`

---

## 🔌 Integration Points

### Frontend ↔ Backend Communication

**When a student reports an issue:**

```
1. Student selects category (e.g., "Electrical")
2. Frontend calls: POST /api/issues
3. Backend:
   - Creates issue in database
   - Gets category details
   - Finds available staff (round-robin)
   - Creates SLA record with deadline
   - Creates notification for staff
   - Returns success

4. Staff gets notification: "Issue XYZ assigned"
5. Staff dashboard updates: issue appears in "My Assigned Issues"
6. Admin dashboard: issue appears with SLA countdown
```

### Background SLA Monitoring

**Every 10 minutes (automatic):**

```
1. Cron job runs
2. Checks: issues where deadline < NOW and status != completed
3. For each overdue issue:
   - Level 1: Notifies staff "⚠️ OVERDUE"
   - Level 2: Notifies admin "🚨 CRITICAL"
4. Updates database
5. Re-runs in 10 minutes
```

---

## 🎮 Using the System

### For Admin Users

#### Create Categories
1. Go to `http://localhost:5174/admin/categories`
2. Fill form:
   - **Category Name**: Select from dropdown (Electrical, Plumbing, etc.)
   - **Description**: (optional) What does this category cover?
   - **SLA Hours**: How long to respond? (e.g., 24 = 1 day)
   - **Assign Staff**: Checkboxes for maintenance staff
3. Click "Create Category"

#### Monitor SLA Performance
1. Go to `http://localhost:5174/admin/sla-monitoring`
2. View:
   - **Statistics**: On-time %, total issues, critical count
   - **Overdue Issues**: List of missed deadlines
3. For overdue issue:
   - Click "Reassign Issue"
   - Select new staff member
   - Enter reason
   - System resets deadline for new staff

### For Staff Users

#### View Assigned Issues
1. Go to `http://localhost:5174/maintenance/assigned-issues`
2. Dashboard shows:
   - **🟢 ON TRACK**: Plenty of time left (green)
   - **🟡 URGENT**: <4 hours left (yellow)
   - **🟠 OVERDUE**: Deadline missed (orange)
   - **🔴 CRITICAL**: Severely overdue (red)
3. Click "View Details" to see issue
4. Click "Update Status" to progress work

### For Students

#### Report Issue
1. Log in at `http://localhost:5174/login` with student credentials
2. Go to `/report-issue`
3. Fill form:
   - **Category**: Critical! This determines which staff gets it
   - **Title & Description**: Issue details
   - **Location**: GPS auto-detected
   - **Photo**: Camera capture required
4. Submit
5. See confirmation with issue ID

#### Track Issue
1. Go to Student Dashboard
2. Click "View Details" on any issue
3. See:
   - Current status
   - Assigned staff
   - Comments
   - Support count

---

## 📊 Testing the Complete Flow

### Scenario: Test Auto-Assignment & Escalation

**Setup (5 min):**
1. Create test category with 1-hour SLA
2. Assign test staff to category
3. Report test issue with that category

**Expected Behavior:**
```
✅ T+0min: Issue auto-assigned to staff
           Staff gets notification
           Issue appears in their dashboard

✅ T+10min: Cron runs, issue still on time (50 min left)

✅ T+60min: Cron runs, deadline missed
            Issue escalates to OVERDUE (Level 1)
            Staff gets warning notification

✅ T+70min: Cron runs again, still overdue

✅ T+84min: (24 hours from deadline)
            Issue escalates to CRITICAL (Level 2)
            Admin gets urgent notification

✅ Verify in Admin SLA Monitoring page
```

### Scenario: Test Reassignment

1. From SLA Monitoring page, click "Reassign Issue" on overdue item
2. Select different staff member
3. Add reason: "Original staff unavailable"
4. System:
   - Updates assignedTo
   - Resets escalationLevel to 0
   - Recalculates new deadline
   - Sends notification to new staff
5. Verify:
   - Issue appears in new staff's dashboard
   - Old staff no longer sees it
   - Issue removed from OVERDUE list

---

## 🔍 Database Structure Reference

### Categories Collection
```json
{
  "_id": ObjectId,
  "name": "Electrical",
  "description": "...",
  "assignedStaff": [ObjectId, ObjectId],
  "slaHours": 24,
  "isActive": true,
  "createdAt": Date,
  "updatedAt": Date
}
```

### IssueSLA Collection
```json
{
  "_id": ObjectId,
  "issueId": ObjectId,
  "categoryId": ObjectId,
  "assignedTo": ObjectId,
  "slaDeadline": Date,
  "escalationLevel": 0,  // 0=normal, 1=overdue, 2=critical
  "isOverdue": false,
  "warningSent": false,
  "overdueHours": 0,
  "completedAt": Date,
  "completedOnTime": boolean,
  "createdAt": Date
}
```

### Notifications Collection
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "issueId": ObjectId,
  "message": "⚠️ Issue XYZ is now OVERDUE by 2 hours!",
  "type": "warning",  // assignment, warning, escalation, etc.
  "escalationLevel": 1,
  "isRead": false,
  "createdAt": Date  // Auto-deletes after 30 days
}
```

---

## 🔧 Configuration Options

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/smart-campus
# or for MongoDB Atlas:
MONGODB_URI=[your-mongodb-atlas-connection-string]

# Server
PORT=5000
NODE_ENV=development
```

### SLA Cron Schedules (in `slaMonitor.js`)

```javascript
// Current: Every 10 minutes
cron.schedule('*/10 * * * *', ...)

// Change to every 5 minutes:
cron.schedule('*/5 * * * *', ...)

// Change to every hour:
cron.schedule('0 * * * *', ...)

// Change to every 30 minutes:
cron.schedule('*/30 * * * *', ...)
```

---

## 📋 API Quick Reference

### Get All Categories
```bash
GET http://localhost:5000/api/categories
```

### Get Overdue Issues
```bash
GET http://localhost:5000/api/admin/overdue-issues
```

### Get SLA Statistics
```bash
GET http://localhost:5000/api/admin/sla-stats
```

### Reassign Issue
```bash
PATCH http://localhost:5000/api/issues/{issueId}/reassign
Body: {
  "newStaffId": "staff_id_here",
  "reason": "Original staff overloaded"
}
```

### Get Notifications
```bash
GET http://localhost:5000/api/notifications
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017

Solution:
1. Make sure MongoDB is running (mongod)
2. Check MONGODB_URI in .env
3. Try connecting to MongoDB Atlas instead (cloud)
```

### SLA Job Not Running
```
Solution:
1. Check backend logs for "Initializing SLA Monitoring Jobs"
2. Verify MongoDB is connected
3. Check server hasn't crashed
4. Restart: npm run dev
```

### Staff Not Assigned to Issue
```
Causes:
1. Category has no staff assigned
2. Category marked as inactive (isActive=false)
3. Category doesn't exist in database

Solution:
1. Create/edit category
2. Assign staff members
3. Mark category as active
```

### Notifications Not Showing
```
Solution:
1. Check notification collection in MongoDB
2. Verify userId matches current user
3. Clear browser cache
4. Check if 30-day TTL expired notification
```

---

## ✅ Checklist for Production Deployment

- [ ] MongoDB hosted on Atlas or cloud provider
- [ ] Environment variables set (.env)
- [ ] Categories seeded with realistic SLA times
- [ ] All staff members created and assigned
- [ ] Backend running on production server
- [ ] Frontend deployed to production
- [ ] HTTPS enabled
- [ ] Backup strategy for database
- [ ] Monitor server logs regularly
- [ ] Test SLA escalation at least once
- [ ] Admin trained on SLA management page
- [ ] Staff trained on "My Assigned Issues" page

---

## 🎯 Next Steps

### Optional Enhancements
1. **WebSocket Real-time Updates** - Instant notifications
2. **Email Alerts** - Send to staff Gmail
3. **Mobile App** - Push notifications
4. **Analytics Dashboard** - Charts and trends
5. **Custom SLA Rules** - Time-based (e.g., faster on weekends)

### Performance Optimization
1. Add database indexes on frequently queried fields
2. Implement Redis caching for statistics
3. Batch SLA checks for large systems
4. Archive complete issues after 90 days

---

## 📙 Documentation Files

1. **SLA_SYSTEM_DOCUMENTATION.md** - Complete system architecture
2. **This file** - Setup & integration guide

---

## 🆘 Support

For issues:
1. Check troubleshooting section above
2. Review logs: `npm run dev` output
3. Check MongoDB: `mongosh` → `show databases`
4. Review API responses for error messages

---

**You're all set! 🎉 The SLA System is ready to manage issues intelligently.**
