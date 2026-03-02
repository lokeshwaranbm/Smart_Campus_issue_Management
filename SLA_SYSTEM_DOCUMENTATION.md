# Category-Based Auto Assignment + SLA Monitoring System

## 📋 Overview

This document describes the **advanced workflow enhancement** system that implements:
- ✅ **Category-Based Automatic Staff Assignment**
- ✅ **Service Level Agreement (SLA) Monitoring**
- ✅ **Escalation & Warning System**
- ✅ **Overdue Issue Tracking & Notifications**

---

## 🏗️ System Architecture

### Backend Components

#### 1. **Database Models**

**Category Model** (`models/Category.js`)
- Stores issue categories (Electrical, Plumbing, Network, etc.)
- Links to assigned staff members
- Defines SLA hours for each category
- Tracks active/inactive status

**IssueSLA Model** (`models/IssueSLA.js`)
- Tracks SLA details for each issue
- Stores deadline calculation
- Records escalation level (0, 1, 2)
- Maintains overdue hours
- Tracks completion time and on-time status

**Notification Model** (`models/Notification.js`)
- User notifications about assignments, warnings, escalations
- Auto-expiring after 30 days
- Tracks read/unread status
- Links to issues for context

#### 2. **Services**

**SLA Service** (`services/slaService.js`)
- `createIssueSLA()` - Create SLA record when issue assigned
- `checkAndEscalateOverdueIssues()` - Monitor and escalate overdue issues
- `completeIssueSLA()` - Mark issue complete and check on-time status
- `reassignIssue()` - Reassign to different staff with reset

**Assignment Service** (`services/assignmentService.js`)
- `getAvailableStaffForCategory()` - Find least-burdened staff (round-robin)
- `getFallbackStaff()` - Get first available staff if needed

#### 3. **Background Jobs**

**SLA Monitor** (`jobs/slaMonitor.js`)
- **Every 10 minutes**: Check for overdue issues and escalate
- **Every hour**: Clean up old notifications
- **Daily (9 AM)**: Generate daily SLA report (optional)

### Frontend Components

#### 1. **Admin Pages**

**AdminCategoryManagementPage** (`/admin/categories`)
- Create, edit, delete issue categories
- Assign staff to categories
- Set SLA hours per category
- View category status

**AdminSLAMonitoringPage** (`/admin/sla-monitoring`)
- View all overdue and escalated issues
- Real-time SLA statistics:
  - On-time percentage
  - Completed on-time vs late
  - Critical issues count
- Reassign overdue issues to different staff
- Provide escalation reason

#### 2. **Staff Pages**

**MaintenanceAssignedIssuesPage** (`/maintenance/assigned-issues`)
- View all personally assigned issues
- Filter: All, Overdue, Critical, Completed
- SLA status indicators:
  - 🟢 ON TRACK (green) - plenty of time remaining
  - 🟡 URGENT (yellow) - <4 hours remaining
  - 🟠 OVERDUE (orange) - deadline missed (Level 1)
  - 🔴 CRITICAL (red) - severely overdue (Level 2)
- Quick update status action

---

## 🔄 Workflow Logic

### 1️⃣ Issue Reporting → Automatic Assignment

```
Student selects category
         ↓
Backend retrieves category details
         ↓
System finds available staff for category (round-robin load balancing)
         ↓
Issue assigned to staff
         ↓
SLA deadline calculated: current_time + category_sla_hours
         ↓
Staff receives notification: "New issue XYZ assigned to you"
         ↓
Issue appears in staff dashboard under "My Assigned Issues"
```

### 2️⃣ SLA Monitoring (Every 10 Minutes)

```
Cron job runs
         ↓
Query: issues where deadline < NOW and status != completed
         ↓
For each overdue issue:
```

**If first time overdue (escalationLevel = 0):**
- Set escalationLevel = 1 (OVERDUE)
- isOverdue = true
- warningSent = true
- Send notification to assigned staff: "⚠️ Issue XYZ is OVERDUE by N hours"

**If overdue for 24+ hours (escalationLevel = 1):**
- Set escalationLevel = 2 (CRITICAL)
- Send notification to ALL ADMINS: "🚨 CRITICAL: Issue XYZ is N+ hours overdue!"
- Issue marked for admin review and possible reassignment

### 3️⃣ Issue Completion

```
Staff marks issue as "Resolved"
         ↓
Backend calls completeIssueSLA()
         ↓
Calculate: completionTime vs slaDeadline
         ↓
If completionTime <= slaDeadline:
  completedOnTime = true ✅
  Notify staff: "✅ Issue XYZ completed ON TIME"
Else:
  completedOnTime = false
  overdueHours = calculated difference
  Notify staff: "⏱️ Issue XYZ completed N hours LATE"
         ↓
Statistics updated (on-time percentage, etc.)
```

### 4️⃣ Admin Reassignment

```
Admin views overdue issue in SLA Monitoring page
         ↓
Clicks "Reassign Issue"
         ↓
Select new staff member
         ↓
Provide reason: "Original staff overloaded"
         ↓
System calls reassignIssue():
  - Update assignedTo
  - Reset escalationLevel to 0
  - Reset isOverdue to false
  - Calculate new slaDeadline
         ↓
New staff receives notification: "Issue XYZ reassigned to you"
         ↓
Issue reappears in new staff's dashboard
```

---

## 📊 SLA Performance Metrics

The system tracks:

```
✅ On-Time Completion Rate (%)
   = (completed_on_time / total_completed) * 100

📈 Overdue Issues (count)
   = issues where completedOnTime = false

⏱️ Pending Issues (count)
   = issues where completedAt = null

🚨 Critical Issues (count)
   = issues where escalationLevel = 2 and completedAt = null

📅 Average Resolution Time
   = sum(completionTime - createdTime) / count(completed)
```

---

## 🔔 Notification Types

| Type | Priority | Recipient | Message Template |
|------|----------|-----------|-----------------|
| `assignment` | Normal | Assigned Staff | "📋 Issue XYZ assigned to you" |
| `warning` | High | Assigned Staff | "⚠️ Issue XYZ OVERDUE by N hours" |
| `escalation` | Critical | Admin | "🚨 CRITICAL: Issue XYZ overdue N+ hours" |
| `completion` | Normal | Assigned Staff | "✅/⏱️ Issue XYZ completed on/late" |
| `comment` | Normal | All involved | "💬 New comment on issue XYZ" |
| `support` | Normal | Student | "👍 User supported your issue" |

---

## 🛣️ API Endpoints

### Categories Management

```
GET    /api/categories
       Get all active categories

POST   /api/categories
       Create new category
       Body: { name, description, assignedStaff, slaHours }

PATCH  /api/categories/:id
       Update category
       Body: { name, description, assignedStaff, slaHours, isActive }

DELETE /api/categories/:id
       Soft delete (deactivate) category
```

### SLA Monitoring

```
GET    /api/admin/overdue-issues
       Get all overdue and escalated issues with details

GET    /api/admin/sla-stats
       Get SLA performance statistics (30-day period)
       Returns: { totalIssues, completedOnTime, completedLate, pendingIssues, criticalIssues, onTimePercentage }

PATCH  /api/issues/:issueId/reassign
       Reassign issue to different staff
       Body: { newStaffId, reason }
```

### Notifications

```
GET    /api/notifications
       Get user's notifications (latest 20)

PATCH  /api/notifications/:id/read
       Mark notification as read

GET    /api/notifications/unread-count
       Get count of unread notifications
```

---

## ⚙️ Configuration & Setup

### 1. Install Dependencies

```bash
cd backend
npm install mongoose node-cron
```

### 2. Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/smart-campus
PORT=5000
```

### 3. Start Backend

```bash
npm run dev    # Development with nodemon
npm run start  # Production
```

### 4. Create Initial Categories

Via API:
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electrical",
    "description": "Electrical issues in buildings",
    "slaHours": 24,
    "assignedStaff": ["staff_id_1", "staff_id_2"]
  }'
```

---

## 🎯 Best Practices

### For Admins
1. ✅ Create all issue categories upfront
2. ✅ Assign multiple staff per category for load balancing
3. ✅ Monitor SLA page daily for escalations
4. ✅ Reassign overdue issues promptly
5. ✅ Use reason field when reassigning

### For Staff
1. ✅ Check "My Assigned Issues" dashboard regularly
2. ✅ Respond to assignments within SLA deadline
3. ✅ Update issue status as you progress
4. ✅ Complete and mark resolved before deadline
5. ✅ Contact admin if SLA is unrealistic

### For System
1. ✅ Monitor cron job health (check server logs)
2. ✅ Keep notification DB clean (auto-TTL handles this)
3. ✅ Review SLA stats monthly
4. ✅ Adjust SLA hours based on historical data
5. ✅ Test escalation logic before production

---

## 🧪 Testing the System

### Manual Test Scenario

1. **Create Category**
   - Go to `/admin/categories`
   - Create "Testing" category with 1 hour SLA
   - Assign test staff

2. **Create Issue**
   - Report issue with "Testing" category
   - Verify notification sent to assigned staff

3. **Wait for SLA Check**
   - System checks every 10 minutes
   - After 1 hour + 10 minutes, should escalate
   - Check admin SLA monitoring page

4. **Test Reassignment**
   - From SLA page, reassign to different staff
   - Verify new staff receives notification
   - Verify escalation level resets

---

## 🔧 Troubleshooting

### Issue not auto-assigning
- Check: Category has `assignedStaff` populated
- Check: Staff user exists in database
- Check: Category `isActive = true`

### SLA job not running
- Check: MongoDB connection active
- Check: Backend logs for cron start message
- Server restart may be needed

### Notifications not appearing
- Check: User ID matches notification recipient
- Check: Notification collection TTL hasn't expired
- Clear browser cache and refresh

### Staff load not balancing
- Current: Uses least-burdened algorithm
- Check: IssueSLA records properly linked
- May need to manually redistribute older issues

---

## 📈 Future Enhancements

- [ ] WebSocket real-time notifications
- [ ] Machine learning for SLA time prediction
- [ ] Team/department hierarchies
- [ ] Multiple escalation levels per category
- [ ] Automatic email reminders
- [ ] Mobile app push notifications
- [ ] SLA compliance dashboard with charts
- [ ] Custom escalation rules

---

## 📝 Summary

This system automates the entire issue lifecycle:

1. **Submission** → Issues auto-assigned based on category
2. **Tracking** → SLA deadlines and progress monitored automatically
3. **Escalation** → Overdue issues escalate in real-time
4. **Resolution** → Performance tracked and reported

**Result**: Significant improvement in response times and service quality! 🚀
