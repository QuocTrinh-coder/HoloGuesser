const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const fetch = require('node-fetch'); // Import node-fetch to make HTTP requests
const app = express();
const port = 8080;

let randomNumbers = [];
let memberData = {}; // Variable to store the fetched data

// Middleware to handle CORS
app.use(cors());

// Middleware to serve static files
app.use(express.static('public'));

// Function to fetch member data from DigitalOcean Space
async function fetchMemberData() {
    try {
        const response = await fetch('https://hololive-assets.sfo3.digitaloceanspaces.com/hololive-json-file/hololive_members.json');
        if (!response.ok) throw new Error('Failed to fetch member data');
        const data = await response.json();
        memberData = data; // Store the fetched data
        console.log('Member data fetched and stored');
    } catch (error) {
        console.error('Error fetching member data:', error);
    }
}

// Fetch data when the server starts
fetchMemberData();

// Schedule a task to fetch new data every day at 12:05 AM PST
cron.schedule('5 0 * * *', () => {
    fetchMemberData();
}, {
    scheduled: true,
    timezone: "America/Los_Angeles"
});

// Function to generate 4 unique random numbers
function generateRandomNumbers() {
    const numbers = [];
    while (numbers.length < 4) {
        const number = Math.floor(Math.random() * 71);
        if (!numbers.includes(number)) {
            numbers.push(number);
        }
    }
    const additionalNumber = Math.floor(Math.random() * 3);
    numbers.push(additionalNumber);
    return numbers;
}

// Generate initial random numbers
randomNumbers = generateRandomNumbers();

// Schedule a task to generate new random numbers at 12:05 AM PST every day
cron.schedule('0 23 * * *', () => {
    randomNumbers = generateRandomNumbers();
    console.log('Random numbers updated:', randomNumbers);
}, {
    scheduled: true,
    timezone: "America/Los_Angeles"
});


app.get('/credits', async (req, res) => {
    try {
        const response = await fetch('https://hololive-assets.sfo3.digitaloceanspaces.com/Credits/Credits-page.pdf');
        if (!response.ok) throw new Error('Failed to fetch PDF');

        // Set the content type to PDF
        res.setHeader('Content-Type', 'application/pdf');

        // Pipe the PDF response to the client
        response.body.pipe(res);
    } catch (error) {
        console.error('Error fetching PDF:', error);
        res.status(500).send('Failed to fetch PDF');
    }
});

// Endpoint to get the current random numbers
app.get('/randomMember', (req, res) => {
    res.status(200).json(randomNumbers);
});

// Endpoint to get the member data
app.get('/members', (req, res) => {
    if (Object.keys(memberData).length === 0) {
        return res.status(503).json({ error: 'Member data not available' });
    }
    res.status(200).json(memberData);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

app.get('/classic', (req, res) => {
    res.sendFile(__dirname + '/public/classic.html');
});

app.get('/fanbase', (req, res) => {
    res.sendFile(__dirname + '/public/fanbase.html');
});

app.get('/music', (req, res) => {
    res.sendFile(__dirname + '/public/music.html');
});

app.get('/stream', (req, res) => {
    res.sendFile(__dirname + '/public/stream.html');
});

