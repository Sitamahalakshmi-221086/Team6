const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: './Backend/.env' });

const API = 'http://localhost:5005/api';

async function runWorkflow() {
    try {
        console.log("1. TPO Parsing Scraped Jobs...");
        const res1 = await fetch(`${API}/tpo/save-scraped-jobs`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ jobs: [{ company: 'Google', companyEmail: process.env.GMAIL_USER, title: 'Software Engineer', branches: ['CSE'], location: 'Hyderabad' }]})
        });
        const d1 = await res1.json();
        console.log('Result:', d1);

        console.log("\n2. TPO Fetching Scraped Jobs...");
        const res2 = await fetch(`${API}/tpo/scraped-jobs`);
        const d2 = await res2.json();
        const jId = d2.jobs && d2.jobs.length > 0 ? d2.jobs[0]._id : null;
        console.log('Found jobs:', d2.jobs.length);

        if (!jId) throw new Error("No scraped job found");

        console.log("\n3. TPO Sending Drive Request to Company...");
        const res3 = await fetch(`${API}/tpo/send-drive-request`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ companyName: 'Google Test', companyEmail: process.env.GMAIL_USER, role: 'Software Engineer', message: 'Lets interview', scrapedJobId: jId })
        });
        const d3 = await res3.json();
        console.log('Drive Request Sent:', d3.success);
        
        if (!d3.companyRequest || !d3.companyRequest.token) throw new Error("No token returned");
        const token = d3.companyRequest.token;

        console.log("\n4. Company Receives Email and Clicks [Accept]...");
        const res4 = await fetch(`http://localhost:5005/api/drive-response/${token}/accept`);
        const d4 = await res4.text();
        console.log('Company Action Result:', d4.substring(0, 80).replace(/\n/g, ''), '...');

        console.log("\n5. TPO Checking Drives...");
        const res6 = await fetch(`${API}/tpo/drives`);
        const d6 = await res6.json();
        const drive = d6.drives ? d6.drives.find(d => d.companyName.includes('Google Test')) : null;
        console.log('Drive Created:', drive ? 'Yes' : 'No', drive ? drive._id : '');

        if (!drive) throw new Error("Drive not found after accepting");

        console.log("\n6. TPO Shortlisting students for the drive...");
        const res7 = await fetch(`${API}/tpo/shortlist/${drive._id}`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ minCgpa: 5 })
        });
        const d7 = await res7.json();
        console.log('Shortlisting Result:', d7);

        console.log("\n🎉 End-to-end integration workflow test successful!");
    } catch (err) {
        console.error("Workflow failed:", err.message);
    }
}
runWorkflow();
