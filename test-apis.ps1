$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5000'
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$stuEmail = "stu$ts@university.edu"
$mEmail = "maint$ts@university.edu"
$pass = 0; $fail = 0

function Test-API {
  param($label, $block)
  try {
    $result = & $block
    Write-Host "  PASS  $label"
    if ($result) { Write-Host "        $result" }
    $script:pass++
  } catch {
    Write-Host "  FAIL  $label"
    Write-Host "        $($_.Exception.Message)" 
    $script:fail++
  }
}

function Expect-Fail {
  param($label, $block)
  try {
    & $block
    Write-Host "  FAIL  $label (should have been rejected)"
    $script:fail++
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "  PASS  $label (correctly rejected - HTTP $code)"
    $script:pass++
  }
}

Write-Host ""
Write-Host "=========================================================="
Write-Host "  SMART CAMPUS API TEST SUITE"
Write-Host "  Test emails: $stuEmail"
Write-Host "=========================================================="
Write-Host ""
Write-Host "--- HEALTH ---"

Test-API "Health Check" {
  $r = Invoke-RestMethod "$base/api/health"
  "ok=$($r.ok), db=$($r.database)"
}

Write-Host ""
Write-Host "--- AUTH ---"

Test-API "Student Register" {
  $r = Invoke-RestMethod "$base/api/auth/register/student" -Method Post -ContentType 'application/json' -Body (@{
    fullName='Test Student'; email=$stuEmail; registerNumber="REG$ts"; department='CSE'; semester='5'; password='Test@1234'
  } | ConvertTo-Json)
  $r.message
}

Test-API "Student Login" {
  $r = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email=$stuEmail; password='Test@1234'
  } | ConvertTo-Json)
  $script:stuUser = $r.data.user
  "role=$($r.data.user.role), redirectTo=$($r.data.redirectTo)"
}

Expect-Fail "Student Wrong Password Rejected" {
  Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email=$stuEmail; password='wrongpassword'
  } | ConvertTo-Json)
}

Test-API "Admin Login" {
  $r = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email='admin@university.edu'; password='Admin@123'
  } | ConvertTo-Json)
  $script:adminUser = $r.data.user
  "role=$($r.data.user.role), redirectTo=$($r.data.redirectTo)"
}

Test-API "Maintenance Register" {
  $r = Invoke-RestMethod "$base/api/auth/register/maintenance" -Method Post -ContentType 'application/json' -Body (@{
    fullName='Test Staff'; email=$mEmail; employeeId="EMP$ts"; department='electrical'; phoneNumber='9876543210'; password='Test@1234'
  } | ConvertTo-Json)
  $r.message
}

Expect-Fail "Maintenance Login Blocked Before Approval" {
  Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email=$mEmail; password='Test@1234'
  } | ConvertTo-Json)
}

Test-API "Pending Maintenance List" {
  $r = Invoke-RestMethod "$base/api/auth/maintenance/pending" -Method Get
  "count=$($r.count)"
}

Test-API "Approve Maintenance" {
  $enc = [Uri]::EscapeDataString($mEmail)
  $r = Invoke-RestMethod "$base/api/auth/maintenance/$enc/approve" -Method Patch
  $r.message
}

Test-API "Maintenance Login After Approval" {
  $r = Invoke-RestMethod "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body (@{
    email=$mEmail; password='Test@1234'
  } | ConvertTo-Json)
  $script:maintUser = $r.data.user
  "role=$($r.data.user.role), redirectTo=$($r.data.redirectTo)"
}

Test-API "All Maintenance List" {
  $r = Invoke-RestMethod "$base/api/auth/maintenance/pending" -Method Get
  "pending_count=$($r.count)"
}

Write-Host ""
Write-Host "--- ISSUES ---"

Test-API "Create Issue" {
  $issueId = "ISS-TEST-$ts"
  $r = Invoke-RestMethod "$base/api/issues" -Method Post -ContentType 'application/json' -Body (@{
    id=$issueId; title="Broken AC in Lab $ts"; description='Air conditioning not working'; category='electrical';
    location='Block A, Lab 3'; studentEmail=$stuEmail
  } | ConvertTo-Json)
  $script:issueId = $r.id
  "id=$($r.id), status=$($r.status), priority=$($r.priority)"
}

Test-API "Get All Issues" {
  $r = Invoke-RestMethod "$base/api/issues" -Method Get
  "count=$($r.Count)"
}

Test-API "Get Stats" {
  $r = Invoke-RestMethod "$base/api/issues/stats" -Method Get
  "total=$($r.total), submitted=$($r.submitted), assigned=$($r.assigned)"
}

Test-API "Get Issue by ID" {
  $r = Invoke-RestMethod "$base/api/issues/$($script:issueId)" -Method Get
  "title=$($r.title), status=$($r.status)"
}

Test-API "Update Status -> in_progress" {
  $r = Invoke-RestMethod "$base/api/issues/$($script:issueId)/status" -Method Patch -ContentType 'application/json' -Body (@{
    status='in_progress'; updatedBy=$mEmail
  } | ConvertTo-Json)
  "status=$($r.status)"
}

Test-API "Assign Issue" {
  $r = Invoke-RestMethod "$base/api/issues/$($script:issueId)/assign" -Method Patch -ContentType 'application/json' -Body (@{
    department='electrical'; assignedTo=$mEmail
  } | ConvertTo-Json)
  "dept=$($r.assignedDepartment), assignedTo=$($r.assignedTo)"
}

Test-API "Add Remark" {
  $r = Invoke-RestMethod "$base/api/issues/$($script:issueId)/remarks" -Method Post -ContentType 'application/json' -Body (@{
    text='Parts ordered, fix scheduled for Monday'; authorEmail=$mEmail
  } | ConvertTo-Json)
  "remarks=$($r.remarks.Count)"
}

Test-API "Add Comment" {
  $r = Invoke-RestMethod "$base/api/issues/$($script:issueId)/comments" -Method Post -ContentType 'application/json' -Body (@{
    text='Please hurry, exams next week'; userEmail=$stuEmail; userName='Test Student'
  } | ConvertTo-Json)
  "comments=$($r.comments.Count)"
}

Test-API "Support Toggle (Add)" {
  $r = Invoke-RestMethod "$base/api/issues/$($script:issueId)/support" -Method Post -ContentType 'application/json' -Body (@{
    userEmail="supporter1@university.edu"
  } | ConvertTo-Json)
  "added=$($r.added), supports=$($r.issue.supports)"
}

Test-API "Support Toggle (Remove)" {
  $r = Invoke-RestMethod "$base/api/issues/$($script:issueId)/support" -Method Post -ContentType 'application/json' -Body (@{
    userEmail="supporter1@university.edu"
  } | ConvertTo-Json)
  "added=$($r.added), supports=$($r.issue.supports)"
}

Test-API "Filter by Category (electrical)" {
  $r = Invoke-RestMethod "$base/api/issues?category=electrical" -Method Get
  "count=$($r.Count)"
}

Test-API "Filter by Student Email" {
  $enc = [Uri]::EscapeDataString($stuEmail)
  $r = Invoke-RestMethod "$base/api/issues?studentEmail=$enc" -Method Get
  "count=$($r.Count)"
}

Test-API "Filter by Status (in_progress)" {
  $r = Invoke-RestMethod "$base/api/issues?status=in_progress" -Method Get
  "count=$($r.Count)"
}

Test-API "Update Status -> resolved" {
  $r = Invoke-RestMethod "$base/api/issues/$($script:issueId)/status" -Method Patch -ContentType 'application/json' -Body (@{
    status='resolved'; updatedBy=$mEmail
  } | ConvertTo-Json)
  "status=$($r.status)"
}

Test-API "Delete Issue" {
  $r = Invoke-RestMethod "$base/api/issues/$($script:issueId)" -Method Delete
  "deleted=$($r.id)"
}

Expect-Fail "Verify Issue Deleted (404)" {
  Invoke-RestMethod "$base/api/issues/$($script:issueId)" -Method Get
}

Write-Host ""
Write-Host "=========================================================="
Write-Host "  RESULTS:  PASSED=$pass   FAILED=$fail   TOTAL=$($pass+$fail)"
Write-Host "=========================================================="
Write-Host ""
