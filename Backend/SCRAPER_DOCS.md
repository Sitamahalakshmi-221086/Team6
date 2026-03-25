# Job Scraper Documentation

## Overview

The Job Scraper is an automated system that collects job postings from multiple job portals and stores them in the database. TPOs can then review, filter, and publish these jobs to students.

## Architecture

### Components

1. **jobScraper.js** - Main scraper logic
   - Scrapes from multiple job portals (LinkedIn, Indeed, Naukri, Glassdoor)
   - Deduplicates jobs
   - Normalizes job data
   - Stores in MongoDB

2. **jobScheduler.js** - Automated scheduling
   - Uses node-cron for scheduling
   - Runs daily at 2:00 AM (configurable)
   - Can also run hourly or on demand

3. **scraperRoutes.js** - REST API endpoints
   - Manual trigger
   - Status monitoring
   - Job retrieval with filtering
   - Cleanup operations

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `node-cron` - Job scheduling
- `axios` - HTTP requests for APIs
- `cheerio` - Web scraping

### 2. Environment Setup

Ensure your `.env` file has:

```env
MONGODB_URI=mongodb://localhost:27017/campusplace
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
```

## Usage

### 1. Manual Trigger via API

**Endpoint:**
```
POST /api/scraper/run
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/scraper/run
```

**Response:**
```json
{
  "success": true,
  "message": "Job scraper started in background",
  "status": "running"
}
```

### 2. Check Scraper Status

**Endpoint:**
```
GET /api/scraper/status
```

**Response:**
```json
{
  "success": true,
  "scheduler": {
    "isRunning": true,
    "nextRun": "Check logs for details"
  },
  "stats": {
    "totalJobs": 45,
    "jobsAddedIn24h": 8,
    "lastScrapedAt": "2026-03-25T10:30:00Z",
    "lastScrapedJob": {
      "company": "Google",
      "title": "Software Engineer - New Graduate",
      "portal": "LinkedIn"
    }
  }
}
```

### 3. Get Scraped Jobs

**Endpoint:**
```
GET /api/scraper/jobs
```

**Query Parameters:**
- `limit` - Number of jobs (default: 20, max: 100)
- `skip` - Pagination offset (default: 0)
- `branch` - Filter by branch (e.g., "CSE", "ECE")
- `portal` - Filter by job portal
- `published` - Filter by published status (true/false)

**Example:**
```bash
# Get latest 20 jobs
curl http://localhost:5000/api/scraper/jobs

# Get jobs for CSE branch
curl "http://localhost:5000/api/scraper/jobs?branch=CSE"

# Get unpublished jobs
curl "http://localhost:5000/api/scraper/jobs?published=false"

# Get from LinkedIn only
curl "http://localhost:5000/api/scraper/jobs?portal=LinkedIn"
```

### 4. Get Single Job Details

**Endpoint:**
```
GET /api/scraper/jobs/:id
```

### 5. Delete Old Jobs

**Endpoint:**
```
DELETE /api/scraper/clear-old-jobs
```

**Query Parameters:**
- `days` - Delete jobs older than N days (default: 30)

**Example:**
```bash
# Delete jobs older than 30 days
curl -X DELETE http://localhost:5000/api/scraper/clear-old-jobs

# Delete jobs older than 7 days
curl -X DELETE "http://localhost:5000/api/scraper/clear-old-jobs?days=7"
```

### 6. Run Scraper Manually (CLI)

```bash
npm run scraper:run
```

Output:
```
🚀 Starting Job Scraper...

🔍 Scraping LinkedIn...
🔍 Scraping Indeed...
🔍 Scraping Naukri...
🔍 Scraping Glassdoor...

✅ Saved: Google - Software Engineer - New Graduate
✅ Saved: Microsoft - Associate Software Engineer
⏭️ Skipping duplicate: TCS - Systems Engineer

📊 Scraping Summary:
   Total Scraped: 25
   New Jobs Saved: 8
   Total Jobs in DB: 127
   Jobs from Last 24hrs: 45
```

## Database Schema

### ScrapedJob Collection

```javascript
{
  _id: ObjectId,
  portal: String,           // "LinkedIn", "Indeed", "Naukri", etc.
  company: String,          // "Google", "Microsoft", etc.
  title: String,            // Job title
  branches: [String],       // ["CSE", "IT"]
  type: String,             // "Full-time", "Internship"
  stipend: String,          // Salary/stipend
  skills: [String],         // ["Python", "JavaScript"]
  location: String,         // "Bangalore, India"
  postedDate: String,       // "2026-03-25"
  companyEmail: String,     // For drive requests
  scrapedAt: Date,          // Timestamp
  driveRequested: Boolean,  // false if not yet requested
  publishedToStudents: Boolean, // false if not published
  openJobId: ObjectId,      // Linked OpenJob after publishing
  createdAt: Date,
  updatedAt: Date
}
```

## Scheduling

### Current Schedule

- **Time**: 2:00 AM daily
- **Cron Pattern**: `0 2 * * *`

### Change Schedule

Edit `Backend/scripts/jobScheduler.js`:

```javascript
// Daily at 2 AM (default)
scraperSchedule = cron.schedule('0 2 * * *', runScraper);

// Every 6 hours
scraperSchedule = cron.schedule('0 */6 * * *', runScraper);

// Every hour
scraperSchedule = cron.schedule('0 * * * *', runScraper);

// Every 30 minutes
scraperSchedule = cron.schedule('*/30 * * * *', runScraper);
```

### Cron Pattern Format

`minute hour day month dayOfWeek`

Examples:
- `0 2 * * *` = Every day at 2:00 AM
- `0 */6 * * *` = Every 6 hours
- `0 9 * * 1-5` = Weekdays at 9:00 AM
- `*/30 * * * *` = Every 30 minutes

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ Stage 1: Job Scraper                                   │
│ ─────────────────────────────────────────────────────── │
│ 1. Fetch jobs from multiple portals                    │
│ 2. Normalize and clean data                            │
│ 3. Check for duplicates                                │
│ 4. Store in ScrapedJob collection                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 2: TPO Review Dashboard                          │
│ ─────────────────────────────────────────────────────── │
│ 1. TPO views all scraped jobs                          │
│ 2. Filters by branch, portal, company                  │
│ 3. Selects relevant jobs                               │
│ 4. Reviews eligibility and requirements                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 3: Publish to Students                           │
│ ─────────────────────────────────────────────────────── │
│ 1. TPO publishes selected jobs                         │
│ 2. Creates OpenJob record                              │
│ 3. Updates publishedToStudents = true                  │
│ 4. Students see jobs in career portal                  │
└─────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Scraper Not Running

1. Check if scheduler is enabled:
   ```bash
   curl http://localhost:5000/api/scraper/status
   ```

2. Make sure dependencies are installed:
   ```bash
   npm install node-cron axios cheerio
   ```

3. Check server logs for errors

### No Jobs Being Scraped

1. Current implementation uses mock data for demo
2. To enable real scraping, integrate with job portal APIs:
   - LinkedIn API (requires approval)
   - Indeed API (Indeed API)
   - Naukri API (if available)
   - Custom portal APIs

3. Update the scraper functions in `jobScraper.js` to use real APIs

### Duplicate Jobs

The scraper checks for duplicates using:
- Company name (case-insensitive)
- Job title (case-insensitive)
- Posted within last 7 days

If duplicates occur, adjust the deduplication logic in `jobExists()` function

## Future Enhancements

1. **Real API Integration**
   - LinkedIn Talent Solutions API
   - Indeed Publisher API
   - Naukri Partner API

2. **Advanced Filtering**
   - Salary range filtering
   - Skills matching
   - Branch-specific requirements

3. **Analytics**
   - Job market trends
   - Company hiring patterns
   - Skills demand analysis

4. **Smart Publishing**
   - Auto-publish based on eligibility
   - ML-based duplicate detection
   - Spam filtering

5. **Notifications**
   - Email TPO when new relevant jobs arrive
   - Notify students of available jobs

## Security Notes

1. Scraper runs in background - no blocking
2. Rate limiting recommended for production
3. Consider proxy rotation for web scraping
4. API keys should be in `.env` file
5. Validate all scraped data before storing

## Support

For issues or questions:
1. Check server logs: `npm run dev`
2. Test API endpoints manually
3. Verify MongoDB connection
4. Ensure all dependencies installed

---

**Last Updated**: March 25, 2026
