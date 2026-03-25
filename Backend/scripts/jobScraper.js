const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const ScrapedJob = require('../models/ScrapedJob');

// Configuration
const SCRAPER_CONFIG = {
  sources: [
    { name: 'naukri', url: 'https://www.naukri.com', enabled: true },
    { name: 'linkedin', url: 'https://www.linkedin.com/jobs', enabled: true },
    { name: 'indeed', url: 'https://www.indeed.com', enabled: true },
    { name: 'glassdoor', url: 'https://www.glassdoor.com/jobs', enabled: true },
  ],
  branches: ['CSE', 'ECE', 'Mechanical', 'Civil', 'Electrical', 'IT'],
  keywords: ['fresher', 'graduate', 'entry level', 'campus', 'internship'],
  timeout: 10000,
};

// Mock Job Data (for demo - replace with real API calls)
const MOCK_JOBS = [
  {
    portal: 'LinkedIn',
    company: 'Google',
    title: 'Software Engineer - New Graduate',
    branches: ['CSE', 'IT'],
    type: 'Full-time',
    stipend: '$180,000 - $220,000',
    skills: ['Python', 'JavaScript', 'System Design', 'Data Structures'],
    location: 'Bangalore, India',
    postedDate: new Date().toISOString().split('T')[0],
    companyEmail: 'careers@google.com',
  },
  {
    portal: 'Indeed',
    company: 'Microsoft',
    title: 'Associate Software Engineer',
    branches: ['CSE', 'IT', 'ECE'],
    type: 'Full-time',
    stipend: '$160,000 - $200,000',
    skills: ['C++', 'C#', '.NET', 'Cloud'],
    location: 'Hyderabad, India',
    postedDate: new Date().toISOString().split('T')[0],
    companyEmail: 'careers@microsoft.com',
  },
  {
    portal: 'Naukri',
    company: 'Infosys',
    title: 'Systems Engineer',
    branches: ['CSE', 'IT', 'ECE', 'Electrical'],
    type: 'Full-time',
    stipend: '₹3,00,000 - ₹4,50,000',
    skills: ['Java', 'SQL', 'Spring Boot', 'REST API'],
    location: 'Pune, India',
    postedDate: new Date().toISOString().split('T')[0],
    companyEmail: 'careers@infosys.com',
  },
  {
    portal: 'Glassdoor',
    company: 'TCS',
    title: 'IT Consultant - Campus Hiring',
    branches: ['CSE', 'IT'],
    type: 'Full-time',
    stipend: '₹4,00,000 - ₹5,50,000',
    skills: ['Java', 'Python', 'Cloud Computing', 'DevOps'],
    location: 'Mumbai, India',
    postedDate: new Date().toISOString().split('T')[0],
    companyEmail: 'careers@tcs.com',
  },
  {
    portal: 'LinkedIn',
    company: 'Amazon',
    title: 'SDE I - New Grad',
    branches: ['CSE', 'IT'],
    type: 'Full-time',
    stipend: '$150,000 - $190,000',
    skills: ['Python', 'Java', 'Distributed Systems', 'AWS'],
    location: 'Bangalore, India',
    postedDate: new Date().toISOString().split('T')[0],
    companyEmail: 'careers@amazon.com',
  },
  {
    portal: 'Naukri',
    company: 'Wipro',
    title: 'Software Engineer - Campus Hiring',
    branches: ['CSE', 'ECE', 'IT'],
    type: 'Full-time',
    stipend: '₹3,50,000 - ₹4,80,000',
    skills: ['Java', 'Spring', 'Microservices', 'Docker'],
    location: 'Bangalore, India',
    postedDate: new Date().toISOString().split('T')[0],
    companyEmail: 'careers@wipro.com',
  },
  {
    portal: 'Indeed',
    company: 'Accenture',
    title: 'Technology Analyst',
    branches: ['CSE', 'IT', 'Electrical'],
    type: 'Full-time',
    stipend: '₹3,75,000 - ₹5,00,000',
    skills: ['Azure', 'Python', 'SQL', 'Cloud Services'],
    location: 'Pune, India',
    postedDate: new Date().toISOString().split('T')[0],
    companyEmail: 'careers@accenture.com',
  },
  {
    portal: 'Glassdoor',
    company: 'Cognizant',
    title: 'Cognizant Graduate Trainee Program',
    branches: ['CSE', 'IT', 'ECE', 'Mechanical'],
    type: 'Full-time',
    stipend: '₹3,25,000 - ₹4,50,000',
    skills: ['Java', 'Python', 'DevOps', 'Agile'],
    location: 'Chennai, India',
    postedDate: new Date().toISOString().split('T')[0],
    companyEmail: 'careers@cognizant.com',
  },
];

/**
 * Scrape jobs from LinkedIn using unofficial API
 * (Note: LinkedIn actively blocks scrapers. Use LinkedIn Talent Solutions API for production)
 */
async function scrapeLinkedIn() {
  try {
    console.log('🔍 Scraping LinkedIn...');
    // For production, use LinkedIn Talent Solutions API
    // For now, returning filtered mock data
    return MOCK_JOBS.filter(job => job.portal === 'LinkedIn');
  } catch (error) {
    console.error('❌ LinkedIn scraping error:', error.message);
    return [];
  }
}

/**
 * Scrape jobs from Indeed using unofficial scraping
 */
async function scrapeIndeed() {
  try {
    console.log('🔍 Scraping Indeed...');
    // Indeed also actively blocks scrapers. Use RapidAPI or official API
    // For now, returning filtered mock data
    return MOCK_JOBS.filter(job => job.portal === 'Indeed');
  } catch (error) {
    console.error('❌ Indeed scraping error:', error.message);
    return [];
  }
}

/**
 * Scrape jobs from Naukri.com
 */
async function scrapeNaukri() {
  try {
    console.log('🔍 Scraping Naukri...');
    // Naukri has anti-scraping measures. Use programmatic approach with delays
    // For now, returning filtered mock data
    return MOCK_JOBS.filter(job => job.portal === 'Naukri');
  } catch (error) {
    console.error('❌ Naukri scraping error:', error.message);
    return [];
  }
}

/**
 * Scrape jobs from Glassdoor
 */
async function scrapeGlassdoor() {
  try {
    console.log('🔍 Scraping Glassdoor...');
    // Glassdoor actively prevents scraping. Consider using their API or job feed
    // For now, returning filtered mock data
    return MOCK_JOBS.filter(job => job.portal === 'Glassdoor');
  } catch (error) {
    console.error('❌ Glassdoor scraping error:', error.message);
    return [];
  }
}

/**
 * Scrape jobs from custom portal/API
 */
async function scrapeCustomAPI() {
  try {
    console.log('🔍 Scraping Custom Job Portal...');
    // This could be your institution's job portal or a custom API
    // Placeholder for future implementation
    return [];
  } catch (error) {
    console.error('❌ Custom API scraping error:', error.message);
    return [];
  }
}

/**
 * Check if job already exists in database (deduplication)
 */
async function jobExists(company, title) {
  const existingJob = await ScrapedJob.findOne({
    company: new RegExp(company, 'i'),
    title: new RegExp(title, 'i'),
    scrapedAt: {
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    },
  });
  return !!existingJob;
}

/**
 * Clean and normalize job data
 */
function normalizeJobData(job) {
  return {
    portal: job.portal?.trim() || 'Unknown',
    company: job.company?.trim() || 'Unknown',
    title: job.title?.trim() || 'Job Opening',
    branches: Array.isArray(job.branches) ? job.branches : [],
    type: job.type?.trim() || 'Full-time',
    stipend: job.stipend?.toString().trim() || '',
    skills: Array.isArray(job.skills) ? job.skills.map(s => s.trim()) : [],
    location: job.location?.trim() || '',
    postedDate: job.postedDate || new Date().toISOString().split('T')[0],
    companyEmail: job.companyEmail?.trim() || '',
    scrapedAt: new Date(),
    driveRequested: false,
    publishedToStudents: false,
  };
}

/**
 * Save job to database
 */
async function saveJob(jobData) {
  try {
    const exists = await jobExists(jobData.company, jobData.title);
    if (exists) {
      console.log(`⏭️  Skipping duplicate: ${jobData.company} - ${jobData.title}`);
      return null;
    }

    const newJob = new ScrapedJob(jobData);
    await newJob.save();
    console.log(`✅ Saved: ${jobData.company} - ${jobData.title}`);
    return newJob;
  } catch (error) {
    console.error(`❌ Error saving job: ${error.message}`);
    return null;
  }
}

/**
 * Main scraper function
 */
async function runScraper() {
  try {
    console.log('\n🚀 Starting Job Scraper...');
    console.log(`📅 ${new Date().toLocaleString()}\n`);

    // Connect to database
    await connectDB();

    let totalScrapped = 0;
    let totalSaved = 0;

    // Scrape from all sources
    const scrapingTasks = [
      scrapeLinkedIn(),
      scrapeIndeed(),
      scrapeNaukri(),
      scrapeGlassdoor(),
      scrapeCustomAPI(),
    ];

    const results = await Promise.allSettled(scrapingTasks);

    // Process results
    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        for (const job of result.value) {
          totalScrapped++;
          const normalizedJob = normalizeJobData(job);
          const saved = await saveJob(normalizedJob);
          if (saved) totalSaved++;
        }
      }
    }

    // Get statistics
    const totalInDB = await ScrapedJob.countDocuments();
    const recentJobs = await ScrapedJob.countDocuments({
      scrapedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    console.log('\n📊 Scraping Summary:');
    console.log(`   Total Scraped: ${totalScrapped}`);
    console.log(`   New Jobs Saved: ${totalSaved}`);
    console.log(`   Total Jobs in DB: ${totalInDB}`);
    console.log(`   Jobs from Last 24hrs: ${recentJobs}`);

    // List recent jobs
    const latestJobs = await ScrapedJob.find({})
      .sort({ scrapedAt: -1 })
      .limit(5)
      .lean();

    if (latestJobs.length > 0) {
      console.log('\n🆕 Latest Jobs Added:');
      latestJobs.forEach((job, index) => {
        console.log(
          `   ${index + 1}. ${job.company} - ${job.title} (${job.portal})`
        );
      });
    }

    console.log('\n✅ Scraper completed successfully!\n');
  } catch (error) {
    console.error('❌ Scraper error:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Run scraper if executed directly
if (require.main === module) {
  runScraper().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runScraper,
  scrapeLinkedIn,
  scrapeIndeed,
  scrapeNaukri,
  scrapeGlassdoor,
  normalizeJobData,
  saveJob,
};
