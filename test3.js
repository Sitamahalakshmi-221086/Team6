require('dotenv').config({ path: './Backend/.env' });
const fs = require('fs');
const API = 'http://localhost:5005/api';

let log = '';
function l(msg) {
    console.log(msg);
    log += msg + '\n';
}

async function runWorkflow() {
    try {
        l("1. TPO Parsing Scraped Jobs...");
        const res1 = await fetch(`${API}/tpo/save-scraped-jobs`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ jobs: [{ company: 'Microsoft', companyEmail: process.env.GMAIL_USER || 'gurazalasrisantoshi@gmail.com', title: 'Software Engineer', branches: ['CSE'], location: 'Hyderabad' }]})
        });
        const d1 = await res1.json();
        l('Save Scraped Result: ' + JSON.stringify(d1));

        l("\n2. TPO Fetching Scraped Jobs...");
        const res2 = await fetch(`${API}/tpo/scraped-jobs`);
        const d2 = await res2.json();
        const jId = d2.jobs && d2.jobs.length > 0 ? d2.jobs[0]._id : null;
        l('Found jobs: ' + (d2.jobs ? d2.jobs.length : 0));

        if (!jId) throw new Error("No scraped job found");

        l("\n3. TPO Sending Drive Request to Company...");
        const res3 = await fetch(`${API}/tpo/send-drive-request`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ companyName: 'Microsoft Test', companyEmail: process.env.GMAIL_USER || 'test@test.com', role: 'Software Engineer', message: 'Lets interview', scrapedJobId: jId })
        });
        const d3 = await res3.json();
        l('Drive Request Sent: ' + JSON.stringify(d3).substring(0, 100)); 
        
        if (!d3.companyRequest || !d3.companyRequest.token) throw new Error("No token returned");
        const token = d3.companyRequest.token;

        l("\n4. Company Receives Email and Clicks [Accept]...");
        const res4 = await fetch(`http://localhost:5005/api/drive-response/${token}/accept`);
        const d4 = await res4.text();
        l('Company Action Result:\n' + d4.substring(0, 80).replace(/\n/g, '') + '...');

        l("\n5. TPO Checking Drives...");
        const res6 = await fetch(`${API}/tpo/drives`);
        const d6 = await res6.json();
        const drive = d6.drives ? d6.drives.find(d => d.companyName.includes('Microsoft Test')) : null;
        l('Drive Created: ' + (drive ? 'Yes' : 'No') + ' ' + (drive ? drive._id : ''));

        if (!drive) throw new Error("Drive not found after accepting");

        l("\n6. TPO Shortlisting students for the drive...");
        const res7 = await fetch(`${API}/tpo/shortlist/${drive._id}`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ minCgpa: 5 })
        });
        const d7 = await res7.json();
        l('Shortlisting Result: ' + JSON.stringify(d7));

        l("\n🎉 End-to-end integration workflow test successful!");
    } catch (err) {
        l("\nWorkflow failed! Message: " + err.message);
        l(String(err));
    }
    fs.writeFileSync('workflow_output.txt', log);
}
runWorkflow();
