param(
  [string]$ApiBase = "http://localhost:5000/api"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

function Assert-Has([object]$Value, [string]$Message) {
  Assert-True ($null -ne $Value) $Message
}

function Invoke-Json($Method, $Uri, $Body) {
  if ($Method -ieq "get") {
    return Invoke-RestMethod -Method $Method -Uri $Uri -ContentType "application/json"
  }
  $json = ($Body | ConvertTo-Json -Depth 10)
  return Invoke-RestMethod -Method $Method -Uri $Uri -ContentType "application/json" -Body $json
}

function New-DummyEmail([string]$prefix) {
  $rand = [System.Guid]::NewGuid().ToString("N").Substring(0, 10)
  return "$prefix+$rand@campusplace.test"
}

$ts = Get-Date -Format "yyyyMMddHHmmss"
$jobId = $null
$companyId = $null
$studentId = $null

Write-Host "== Step 0: Create dummy Company =="
$companyName = "Dummy Campus Company $ts"
$companyPayload = @{
  companyName   = $companyName
  email         = (New-DummyEmail "company")
  password      = "DummyPass123!"
  contactPerson = "HR Dummy"
  phone         = "9999999999"
  industry      = "IT Services"
  companySize   = "5000+ employees"
  website       = "https://example.com"
  address       = "Hyderabad"
  hiringRoles   = @("SDE")
  description   = "Dummy company for job flow testing"
}

$companyResp = Invoke-Json -Method Post -Uri "$ApiBase/companies/signup" -Body $companyPayload
Assert-True $companyResp.success "Company signup failed: $($companyResp.message)"
$companyId = $companyResp.companyId
Assert-Has $companyId "companyId missing from signup response"

Write-Host "== Step 1: Create dummy Student (needed for apply) =="
$studentFullName = "Dummy Student $ts"
$studentEmail = (New-DummyEmail "student")
$studentPayload = @{
  fullName   = $studentFullName
  email      = $studentEmail
  password   = "StudentPass123!"
  phone      = "8888888888"
  branch     = "CSE"
  year       = "3"
  cgpa       = 8.5
  rollNumber = "R-$ts"
  linkedin   = "https://linkedin.com/in/dummy-$ts"
  skills     = @("JavaScript", "React")
}

$resumePath = Join-Path $env:TEMP "resume-$ts.txt"
"Dummy resume for $studentFullName" | Out-File -FilePath $resumePath -Encoding UTF8 -Force

$skillsJson = ($studentPayload.skills | ConvertTo-Json -Compress)
$curlCmd = @(
  "curl.exe", "-s",
  "-X", "POST", "`"$ApiBase/students/signup`"",
  "-F", "fullName=`"$($studentPayload.fullName)`"",
  "-F", "email=`"$($studentPayload.email)`"",
  "-F", "password=`"$($studentPayload.password)`"",
  "-F", "phone=`"$($studentPayload.phone)`"",
  "-F", "branch=`"$($studentPayload.branch)`"",
  "-F", "year=`"$($studentPayload.year)`"",
  "-F", "cgpa=`"$($studentPayload.cgpa)`"",
  "-F", "rollNumber=`"$($studentPayload.rollNumber)`"",
  "-F", "linkedin=`"$($studentPayload.linkedin)`"",
  "-F", "skills=`"$skillsJson`"",
  "-F", "resume=@`"$resumePath`""
)

$studentRaw = & $curlCmd
$studentResp = $studentRaw | ConvertFrom-Json
Assert-True $studentResp.success "Student signup failed: $($studentResp.message)"
$studentId = $studentResp.studentId
Assert-Has $studentId "studentId missing from signup response"

Write-Host "== Step 2: Baseline analytics =="
$baseStudentAnalytics = Invoke-Json -Method Get -Uri "$ApiBase/students/analytics/$studentId" -Body @{}
$baseCompanyStats = Invoke-Json -Method Get -Uri "$ApiBase/companies/stats/$companyId" -Body @{}
$baseTpoAnalytics = Invoke-Json -Method Get -Uri "$ApiBase/tpo/analytics" -Body @{}

$baseTotalApps = $baseStudentAnalytics.stats.totalApplications

Write-Host "== Step 3: Create Dummy Job (Company -> TPO) =="
$jobTitle = "Test Software Engineer $ts"
$jobDescription = "Test job for end-to-end flow validation"
$jobPackage = "10 LPA"
$jobLocation = "Hyderabad"
$jobRequirements = @("Role")

$jobPayload = @{
  companyId   = $companyId
  companyName = $companyName
  title       = $jobTitle
  description = $jobDescription
  requirements = $jobRequirements
  package     = $jobPackage
  location    = $jobLocation
  jobType     = "Full Time"
  workMode    = "On-site"
}

$jobResp = Invoke-Json -Method Post -Uri "$ApiBase/jobs/create" -Body $jobPayload
Assert-True $jobResp.success "Job create failed: $($jobResp.message)"
$jobId = $jobResp.job._id
Assert-Has $jobId "Job _id missing from create response"

$companyJobs = Invoke-Json -Method Get -Uri "$ApiBase/companies/jobs/$companyId" -Body @{}
$createdJob = ($companyJobs.jobs | Where-Object { $_._id -eq $jobId }) | Select-Object -First 1
Assert-Has $createdJob "Created job not found under /companies/jobs/$companyId"
Assert-True ($createdJob.tpoApproval -eq "pending") "Expected job.tpoApproval='pending' but got '$($createdJob.tpoApproval)'"

Write-Host "== Step 4: TPO fetch pending requests =="
$tpoReq = Invoke-Json -Method Get -Uri "$ApiBase/tpo/requests" -Body @{}
$pendingJobs = $tpoReq.pendingJobs
Assert-True ($pendingJobs | Where-Object { $_._id -eq $jobId }).Count -ge 1 "Job not found in TPO pendingJobs"

Write-Host "== Step 5: TPO approve job =="
$approvePayload = @{ resourceType = "job" }
$approveResp = Invoke-Json -Method Patch -Uri "$ApiBase/tpo/approve/$jobId" -Body $approvePayload
Assert-True $approveResp.success "Approve failed: $($approveResp.message)"

$companyJobs2 = Invoke-Json -Method Get -Uri "$ApiBase/companies/jobs/$companyId" -Body @{}
$updatedJob = ($companyJobs2.jobs | Where-Object { $_._id -eq $jobId }) | Select-Object -First 1
Assert-Has $updatedJob "Updated job not found after approval"
Assert-True ($updatedJob.tpoApproval -eq "approved") "Expected job.tpoApproval='approved' but got '$($updatedJob.tpoApproval)'"

Write-Host "== Step 6: Student job visibility (approved only) =="
$approvedJobsResp = Invoke-Json -Method Get -Uri "$ApiBase/jobs" -Body @{}
$approvedJobs = $approvedJobsResp.jobs
Assert-True ($approvedJobs | Where-Object { $_._id -eq $jobId }).Count -ge 1 "Approved job not visible in GET /api/jobs"

$pendingVisible = ($approvedJobs | Where-Object { $_.tpoApproval -eq "pending" }).Count
Assert-True ($pendingVisible -eq 0) "Pending jobs should not be visible in GET /api/jobs"

Write-Host "== Step 7: Student apply =="
$applyPayload = @{
  jobId     = $jobId
  studentId = $studentId
}
$applyResp = Invoke-Json -Method Post -Uri "$ApiBase/applications/apply" -Body $applyPayload
Assert-True $applyResp.success "Apply failed: $($applyResp.message)"

$studentAppsResp = Invoke-Json -Method Get -Uri "$ApiBase/applications/student/$studentId" -Body @{}
$applied = ($studentAppsResp.applications | Where-Object { $_.jobId._id -eq $jobId -or $_.jobId -eq $jobId })
Assert-True ($applied.Count -ge 1) "Application not found under GET /api/applications/student/$studentId"

Write-Host "== Step 8: Analytics update checks =="
$afterStudentAnalytics = Invoke-Json -Method Get -Uri "$ApiBase/students/analytics/$studentId" -Body @{}
$afterCompanyStats = Invoke-Json -Method Get -Uri "$ApiBase/companies/stats/$companyId" -Body @{}
$afterTpoAnalytics = Invoke-Json -Method Get -Uri "$ApiBase/tpo/analytics" -Body @{}

Assert-True ($afterStudentAnalytics.stats.totalApplications -ge ($baseTotalApps + 1)) "Student analytics did not update (totalApplications)"
Assert-True ($afterCompanyStats.stats.totalApplicants -ge ($baseCompanyStats.stats.totalApplicants + 1)) "Company stats did not update (totalApplicants)"
Assert-True ($afterTpoAnalytics.stats.totalApplications -ge ($baseTpoAnalytics.stats.totalApplications + 1)) "TPO analytics did not update (totalApplications)"

Assert-True ($afterStudentAnalytics.stats.offers -eq 0) "Offers should be 0 after a New application"
Assert-True ($afterStudentAnalytics.stats.shortlisted -eq 0) "Shortlisted should be 0 after a New application"

Write-Host "JOB FLOW END-TO-END TEST PASSED."

