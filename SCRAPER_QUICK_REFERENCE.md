#!/bin/bash
# 🚀 Job Scraper - Quick Reference Commands

## 📥 Installation

# Install all dependencies
npm install

# Or only scraper dependencies
npm install node-cron axios cheerio

---

## ⚙️ Running

# Start development server (auto-runs scheduler)
npm run dev

# Run scraper manually from CLI
npm run scraper:run

# Start production server
npm start

---

## 🔌 API Endpoints (Examples with curl)

# Run scraper immediately
curl -X POST http://localhost:5000/api/scraper/run

# Get scraper status & stats
curl http://localhost:5000/api/scraper/status

# Get all scraped jobs
curl http://localhost:5000/api/scraper/jobs

# Get jobs for CSE branch
curl "http://localhost:5000/api/scraper/jobs?branch=CSE"

# Get jobs from LinkedIn
curl "http://localhost:5000/api/scraper/jobs?portal=LinkedIn"

# Get unpublished jobs
curl "http://localhost:5000/api/scraper/jobs?published=false"

# Pagination: Get 20 jobs, skip 0
curl "http://localhost:5000/api/scraper/jobs?limit=20&skip=0"

# Get single job details
curl http://localhost:5000/api/scraper/jobs/{JOB_ID}

# Delete a job
curl -X DELETE http://localhost:5000/api/scraper/jobs/{JOB_ID}

# Cleanup jobs older than 30 days
curl -X DELETE http://localhost:5000/api/scraper/clear-old-jobs

# Cleanup jobs older than 7 days
curl -X DELETE "http://localhost:5000/api/scraper/clear-old-jobs?days=7"

---

## 🌐 Browser URLs

# Dashboard (TPO view)
http://localhost:5000/scraper-dashboard.html
OR
http://localhost:3000/Frontend/pages/scraper-dashboard.html

---

## 📊 Database Commands

# Connect to mongo
mongosh

# Use campusplace database
use campusplace

# Count all scraped jobs
db.scraped_jobs.countDocuments()

# View latest 5 jobs
db.scraped_jobs.find().sort({scrapedAt: -1}).limit(5)

# Find jobs by company
db.scraped_jobs.find({company: "Google"})

# Find jobs for CSE branch
db.scraped_jobs.find({branches: "CSE"})

# Update job to published
db.scraped_jobs.findByIdAndUpdate({_id: ObjectId("...")}, {publishedToStudents: true})

# Delete all jobs from a specific date
db.scraped_jobs.deleteMany({scrapedAt: {$lt: new Date("2026-03-20")}})

---

## 📝 Cron Schedule Patterns

# Format: minute hour day month dayOfWeek

0 2 * * *       # Every day at 2:00 AM
0 */6 * * *     # Every 6 hours
0 * * * *       # Every hour
*/30 * * * *    # Every 30 minutes
0 9 * * 1-5     # Weekdays at 9:00 AM
0 0 1 * *       # First day of month at midnight
0 12 * * 0      # Every Sunday at noon

---

## 🐛 Debugging

# Check if scheduler started
npm run dev | grep "scheduler"

# View server logs
npm run dev

# Check MongoDB connection
mongosh --eval "db.admin().ping()"

# Test API response
curl -v http://localhost:5000/api/scraper/status

# Check if ports are in use (Windows)
netstat -ano | findstr :5000

# Kill process on port 5000 (Windows)
taskkill /PID <PID> /F

---

## 📂 Key Files

Backend/
├── scripts/jobScraper.js         # Main scraper logic
├── scripts/jobScheduler.js       # Scheduling logic  
├── routes/scraperRoutes.js       # API endpoints
├── server.js                     # Express app (updated)
├── package.json                  # Dependencies (updated)
└── SCRAPER_DOCS.md              # Full documentation

Frontend/
└── pages/scraper-dashboard.html  # UI for TPO

---

## 🔧 Configuration

# Change scheduler time (edit jobScheduler.js):
# Line 13: scraperSchedule = cron.schedule('0 2 * * *', ...)
# Change '0 2 * * *' to desired cron pattern

---

## ✅ Verification Checklist

- [ ] npm dependencies installed
- [ ] MongoDB running and connected
- [ ] Server starts without errors
- [ ] Can access /api/scraper/status
- [ ] Dashboard loads at /scraper-dashboard.html
- [ ] Can manually trigger scraper via button
- [ ] Jobs appear in database after running
- [ ] Can filter jobs by branch and portal
- [ ] Status updates in real-time

---

## 🆘 Quick Troubleshooting

Problem: "node-cron not found"
Fix: npm install node-cron

Problem: "Cannot connect to MongoDB"
Fix: Check MONGODB_URI in .env

Problem: "Port 5000 already in use"
Fix: Change PORT in .env or kill process

Problem: "No jobs appearing"
Fix: Check console for errors, verify MongoDB connection

Problem: "Dashboard not loading"
Fix: Check URL, verify server is running, check browser console

---

## 📞 Useful npm Scripts

# Add these to package.json for easier use:
"scraper:run"           # npm run scraper:run
"scraper:status"        # npm run scraper:status
"scraper:test"          # npm run scraper:test
"scraper:cleanup"       # npm run scraper:cleanup

---

## 🎯 Integration Points

# 1. Dashboard "Publish" button integrates with:
   → /api/tpo/publish-job/:scrapedJobId

# 2. TPO notifications update when:
   → Jobs are published to students
   → Company responds to drive requests

# 3. Student sees jobs in:
   → Career guidance page
   → Open jobs portal

---

**Last Updated**: March 25, 2026
**Version**: 1.0 - Production Ready
