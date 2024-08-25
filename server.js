const express = require('express');
const cors = require('cors'); // Import the cors middleware
const cron = require('node-cron'); // Import node-cron for scheduling
const app = express();
const port = 8080;

// require('dotenv').config();

let randomNumbers = [];


// Middleware to handle CORS
app.use(cors());

// Middleware to serve static files
app.use(express.static('public'));

// Function to generate 4 unique random numbers
function generateRandomNumbers() {
    const numbers = [];
    
    // Generate 4 unique random numbers between 0 and 70
    while (numbers.length < 4) {
        const number = Math.floor(Math.random() * 71);
        if (!numbers.includes(number)) {
            numbers.push(number);
        }
    }
    
    // Generate an additional random number (0, 1, or 2)
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
    timezone: "America/Los_Angeles" // Ensure the correct timezone
});

// Endpoint to get the current random numbers
app.get('/randomMember', (req, res) => {
    res.status(200).json(randomNumbers);
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

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
