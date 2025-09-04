const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const fetch = require('node-fetch'); // Import node-fetch to make HTTP requests
const rateLimit = require('express-rate-limit'); // Import express-rate-limit
const app = express();
const port = 8080;

app.set('trust proxy', 1); // Add this line to trust the first proxy

let randomNumbers = [ 21, 13, 3, 44, 2 ];
let memberData = {}; // Variable to store the fetched data
let pastAnswer = [ [ 8, 20, 4, 36, 0 ], [ 21, 13, 3, 44, 2 ]]; // Stores past sets of random numbers
let generationCounter = 2; // Tracks the number of sets generated



// Configure rate limiting: 400 requests per 10 mins
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 500,
    message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all requests
app.use(limiter);

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
cron.schedule('0 23 * * *', () => {
    fetchMemberData();
}, {
    scheduled: true,
    timezone: "America/Los_Angeles"
});

// Function to generate 4 unique random numbers
function generateRandomNumbers() {
    const usedNumbers = new Set(); // Collect all previously used numbers

    // Add all past numbers to the set
    pastAnswer.forEach(set => {
        set.slice(0, 4).forEach(num => usedNumbers.add(num));
    });

    const numbers = [];
    while (numbers.length < 4) {
        const number = Math.floor(Math.random() * 77);
        // Ensure the number is not already used
        if (!numbers.includes(number) && !usedNumbers.has(number)) {
            numbers.push(number);
        }
    }

    const additionalNumber = Math.floor(Math.random() * 3);
    numbers.push(additionalNumber);
    return numbers;
}

// Function to check if a set of numbers exists in pastAnswer
function isDuplicate(newNumbers) {
    const newSet = newNumbers.slice(0, 4).sort(); // Sort the first 4 numbers
    return pastAnswer.some(pastSet => {
        const pastSetSorted = pastSet.slice(0, 4).sort(); // Sort past first 4 numbers
        return JSON.stringify(newSet) === JSON.stringify(pastSetSorted); // Compare sets
    });
}

// Schedule a task to generate new random numbers at 12:05 AM PST every day
cron.schedule('0 23 * * *', () => {
    let newNumbers;

    // Ensure the new set of numbers is not in pastAnswer
    do {
        newNumbers = generateRandomNumbers();
    } while (isDuplicate(newNumbers));

    // Update randomNumbers and pastAnswer
    randomNumbers = newNumbers;
    pastAnswer.push(newNumbers);
    generationCounter++;

    // Reset pastAnswer and generationCounter if it reaches 7
    if (generationCounter === 11) {
        pastAnswer = [];
        generationCounter = 0;
    }

    console.log('Random numbers updated:', randomNumbers);
    console.log('Past answers:', pastAnswer);
    console.log('Generation counter:', generationCounter);
}, {
    scheduled: true,
    timezone: "America/Los_Angeles"
});

// Endpoint to get the current random numbers
app.get('/randomMember', (req, res) => {
    res.status(200).json(randomNumbers);
});

// Endpoint to get the current unlimited mode random number
app.get('/unlimitedMember', (req, res) => {
    unlimitedModeMember = generateRandomNumbers();
    res.status(200).json(unlimitedModeMember);
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
