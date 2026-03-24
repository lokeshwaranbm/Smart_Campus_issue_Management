# 🚀 Quick Start Guide - Database Ready!

## Your Database Is Now Production-Ready ✅

All collections are properly seeded and aligned with backend code.

---

## ⚡ Quick Test

### Step 1: Verify Everything Works
```bash
cd backend
npm install
npm start
```

### Step 2: Open Browser
```
http://localhost:5000/api/health
```
Should return: `{ "ok": true, "service": "smart-campus-backend", "database": "connected" }`

### Step 3: Test Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "password": "Admin@123"
  }'
```

Response: ✅ Login successful with redirect to `/dashboard/admin`

---

## 👥 Test Credentials (Copy & Paste)

### Admin Account
```
Email:    admin@university.edu
Password: Admin@123
```

### Active Staff (for testing approval/approval)
```
Email:    rajesh@university.edu
Password: Staff@123
```

OR

```
Email:    priya@university.edu
Password: Staff@123
```

### Pending Staff (testing approval workflow)
```
Email:    amit@university.edu
Password: Staff@123
(Use Admin account to approve this staff)
```

### Student
```
Email:    s1@gmail.com
Password: Student@123
```

---

## 📊 Database Status

### Collections Created: 12
- **Active (7)**: users, issues, categories, issueslas, issuecomments, issueupdates, notifications
- **Seeded (5)**: departments, campuslocations, slapolicies, issueattachments, auditlogs

### Total Documents: ~35
- Users: 7 (1 admin, 2 active staff, 1 pending staff, 3 students)
- Issues: 5 (all statuses: submitted, assigned, in_progress, resolved, closed)
- Categories: 8 (with staff assignments)
- SLA Records: 3 (including 1 overdue for testing)
- Comments: 3
- Notifications: 3

---

## 🧪 Quick Test Scenarios

### Scenario 1: Admin Approval Flow (5 min)
1. **Login as admin**: admin@university.edu / Admin@123
2. **Go to**: Admin Dashboard → Approvals
3. **See**: Pending staff "Amit Verma"
4. **Click**: Approve Button
5. **Verify**: Staff now appears in Staff list as "active"
6. **Test**: Try logging in as amit@university.edu / Staff@123 (should now work!)

### Scenario 2: Issue Management (10 min)
1. **Login as student**: s1@gmail.com / Student@123
2. **Create Issue**: Report Issue → Fill form → Submit
3. **Verify**: Issue auto-assigned to available staff (Rajesh or Priya)
4. **Check**: Issue appears in Maintenance dashboard
5. **Add Comment**: Staff adds update on issue
6. **Track**: See timeline and status changes

### Scenario 3: SLA Monitoring (5 min)
1. **Login as admin**: admin@university.edu
2. **Go to**: Admin Dashboard → SLA Monitoring
3. **See**: ISS-003 marked as OVERDUE (red alert)
4. **Info**: 2 hours past SLA deadline
5. **Action**: Reassign to different staff if needed

### Scenario 4: Staff Performance (5 min)
1. **Login as admin**
2. **Go to**: Admin Dashboard → Staff Workload
3. **See**: Rajesh Kumar - 1 completed, 1 active, SLA compliance 50%
4. **See**: Priya Singh - Performance metrics

---

## 🔍 What's Actually in the Database Now?

### Users Table
| Email | Name | Role | Status | Notes |
|---|---|---|---|---|
| admin@university.edu | System Admin | admin | active | Full access |
| rajesh@university.edu | Rajesh Kumar | staff | active | Electrical + Network |
| priya@university.edu | Priya Singh | staff | active | Plumbing |
| amit@university.edu | Amit Verma | staff | pending | Needs approval |
| s1@gmail.com | Arjun Patel | student | active | Can report issues |
| s2@gmail.com | Divya Sharma | student | active | Can report issues |
| s3@gmail.com | Vikram Singh | student | inactive | Cannot login |

### Issues Table
| ID | Title | Status | Category | Assigned To | SLA Status |
|---|---|---|---|---|---|
| ISS-001 | Main Gate Power Outage | submitted | electrical | None | Pending |
| ISS-002 | Hostel Water Leakage | assigned | plumbing | Priya Singh | On Track |
| ISS-003 | WiFi Network Down | in_progress | network | Rajesh Kumar | ⚠️ **OVERDUE** |
| ISS-004 | Broken Window | resolved | maintenance | Rajesh Kumar | Completed (late) |
| ISS-005 | Corridor Lights | closed | electrical | Rajesh Kumar | Completed |

---

## 📋 Endpoint Testing Order

### Test These First (Foundation)
1. ✅ `POST /api/auth/login` - Test with admin account
2. ✅ `GET /api/health` - Verify backend is live
3. ✅ `GET /api/categories` - See all 8 categories

### Test These Second (Core Features)
4. ✅ `GET /api/auth/maintenance/pending` - See pending staff
5. ✅ `PATCH /api/auth/maintenance/amit@university.edu/approve` - Approve staff
6. ✅ `GET /api/issues` - See all issues
7. ✅ `GET /api/issues/stats` - Check statistics

### Test These Third (Advanced)
8. ✅ `GET /api/admin/overdue-issues` - See overdue ISS-003
9. ✅ `GET /api/admin/sla-stats` - View SLA compliance
10. ✅ `GET /api/admin/staff-performance` - Staff metrics

---

## 🐛 Common Issues & Fixes

### Q: Backend won't start
**A**: 
```bash
# Make sure MongoDB is running
# Check: node verify-workflow.js
# Should show ✅ Database Verification
```

### Q: Can't login as admin
**A**: password is case-sensitive
- Correct: `Admin@123` (capital A, then lowercase)
- Wrong: `admin@123` or `ADMIN@123`

### Q: Pending staff says "Account pending admin approval"
**A**: That's correct! Use admin account to approve first.
```bash
curl -X PATCH http://localhost:5000/api/auth/maintenance/amit@university.edu/approve
```

### Q: No issues showing up
**A**: Check if frontend is calling the right endpoint
```bash
curl http://localhost:5000/api/issues
```
Should return array with 5 issues.

### Q: SLA monitoring not showing overdue
**A**: ISS-003 is the overdue one. Check:
```bash
curl http://localhost:5000/api/admin/overdue-issues
```

---

## 📞 Key Files Reference

### Backend
- Start: `backend/src/server.js`
- Auth: `backend/src/routes/auth.routes.js`
- Issues: `backend/src/routes/issues.routes.js`
- Categories: `backend/src/routes/categories.routes.js`
- Staff: `backend/src/routes/staff.routes.js`
- Database: Uses MongoDB (local or Atlas)

### Frontend
- Start: `frontend/src/main.jsx`
- Login: `frontend/src/pages/auth/LoginPage.jsx`
- Admin Dashboard: `frontend/src/pages/admin/AdminDashboardPage.jsx`
- API Helpers: `frontend/src/utils/auth.js`, `issues.js`

### Database Scripts
- Seed (create test data): `backend/seed-complete-workflow.js`
- Verify (check status): `backend/verify-workflow.js`

---

## 🎯 Success Criteria

After your test, you should be able to:

✅ Login as admin  
✅ See 7 users in database  
✅ See 5 issues with different statuses  
✅ See 8 categories  
✅ View pending staff (Amit Verma)  
✅ Approve pending staff  
✅ See ISS-003 marked as overdue  
✅ View 3 SLA records  
✅ See 3 issue comments  
✅ Receive notifications on issue assignment  

---

## 🚀 Next Steps

1. **Run backend**: `npm start` (from backend folder)
2. **Run frontend**: `npm run dev` (from frontend folder)
3. **Open browser**: `http://localhost:5173`
4. **Login**: Use any test account above
5. **Explore**: Click through dashboards and test workflows
6. **Deploy**: When ready, deploy to Render (backend) + Netlify (frontend)

---

**Your database is 100% ready for testing and development!** 🎉

Generated: March 24, 2026
