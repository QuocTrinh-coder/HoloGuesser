const PAGE_KEY_PREFIX = 'music_mode_'; // Unique prefix for this page or functionality

function setLocalStorage(key, value) {
    localStorage.setItem(PAGE_KEY_PREFIX + key, value);
}

function getLocalStorage(key) {
    return localStorage.getItem(PAGE_KEY_PREFIX + key);
}

function removeLocalStorage(key) {
    localStorage.removeItem(PAGE_KEY_PREFIX + key);
}

function clearPageLocalStorage() {
    // Get all keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(PAGE_KEY_PREFIX)) {
            removeLocalStorage(key.replace(PAGE_KEY_PREFIX, ''));
        }
    }
}

let members = [];
let selectedMember = null;
let randomMember = null;
let randomNumber = null;
let randomIndex = null;
let guessedMembers = JSON.parse(getLocalStorage('guessedMembers')) || [];
let isFirstGuess = false;
let correctGuess = getLocalStorage('correctGuess') === 'true';
let wrongGuessCount = 0; // Counter for wrong guesses
const countdownElement = document.getElementById('countdown');
const baseUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/randomMember';

document.addEventListener('DOMContentLoaded', () => {
    // Initial hiding of hints
    document.getElementById('hint1').style.display = 'none';
    document.getElementById('hint2').style.display = 'none';
    document.getElementById('hint3').style.display = 'none';

});


fetch(baseUrl)
    .then(res => {
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        return res.json();
    })
    .then(random_number => {
        randomNumber = random_number[1];
        randomIndex = random_number[4];

        // Fetch members data after getting the random number
        return fetch('https://holomemsguesser-kqvor.ondigitalocean.app/members');
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        members = Object.keys(data).map(name => ({
            name: name,
            img: data[name].ImageURL,
            debut: data[name].Debut_Date,
            generation: data[name].Generation,
            branch: data[name].Branch,
            songLink: data[name].Song_link // Add Song_link to the member data
        }));
        randomMember = members[randomNumber]; // Access the random number from the data
        setLocalStorage('randomMember', JSON.stringify(randomMember));
        resetDailyMember();
        startCountdown();
        updateGuessList();
        playRandomSongForMember(randomMember);
    })
    .catch(error => console.error('Error:', error));


const searchInput = document.getElementById('search-input');
const menuItems = document.getElementById('menu-items');
const submitButton = document.getElementById('submit-button');
const selectedMemberDiv = document.getElementById('selected-member');
const guessTableBody = document.querySelector('#guess-table tbody');
const tableContainer = document.getElementById('table-container');
const confettiContainer = document.getElementById('confetti-container');
const audioElement = document.querySelector('audio');

function resetDailyMember() {
    const now = new Date();
    
    // Convert local time to PST
    const nowInPST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const resetHourPST = 23; // 11 PM PST
    let resetTimePST = new Date(nowInPST.getFullYear(), nowInPST.getMonth(), nowInPST.getDate(), resetHourPST);

    // If the current time is past the reset time in PST, set resetTime to 11 PM PST the next day
    if (nowInPST > resetTimePST) {
        resetTimePST.setDate(resetTimePST.getDate() + 1);
    }

    const savedResetTime = getLocalStorage('resetTime');
    if (!savedResetTime || new Date(savedResetTime) < nowInPST) {
        selectRandomMember();
        setLocalStorage('resetTime', resetTimePST.toISOString());
        setLocalStorage('randomMember', JSON.stringify(randomMember));
        setLocalStorage('guessedMembers', JSON.stringify([])); // Reset guessed members
        setLocalStorage('correctGuess', 'false'); // Reset correct guess state
        guessedMembers = []; // Clear local guessedMembers array
        correctGuess = false; // Reset correctGuess variable
        document.getElementById('submit-button').style.pointerEvents = 'auto'; // Enable the submit button
        document.getElementById('submit-button').style.opacity = '1.0'; // Reset button opacity
        startCountdown(); // Restart countdown

        // Select and save a random song for the selected member
        const { songName, songURL } = getRandomSong(randomMember);
        localStorage.setItem('selectedSong', songName);

        // Clear hint visibility states on daily reset
        ['1', '2', '3'].forEach(hintNumber => {
            localStorage.removeItem(`hint${hintNumber}Visibility`);
            document.getElementById(`hint${hintNumber}`).style.display = 'none';
        });
    } else {
        randomMember = JSON.parse(getLocalStorage('randomMember'));
        guessedMembers = JSON.parse(getLocalStorage('guessedMembers')) || [];
        correctGuess = JSON.parse(getLocalStorage('correctGuess') === 'true');
        wrongGuessCount = parseInt(getLocalStorage('wrongGuessCount'), 10) || 0; // Load wrong guess count from localStorage
    }
    updateHints();
    updateHintAvailability();
}

tableContainer.style.display = 'none';
if (correctGuess) {
    submitButton.style.pointerEvents = 'none';
    submitButton.style.opacity = '0.5';
}

function handleGuess(isCorrect) {
    if (!isCorrect) {
        wrongGuessCount++; // Increase wrong guesses count
        updateHintAvailability(); // Update hint availability based on wrong guesses
    }
}
function updateGuessList() {
    guessedMembers.forEach(memberName => {
        const member = members.find(m => m.name === memberName);
        if (member) {
            addMemberToTable(member, true); // Skip animation for loaded guesses
        }
    });
}

// Countdown timer
function startCountdown() {
    const now = new Date();
    
    // Convert local time to PST
    const nowInPST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const resetHourPST = 23; // 11 PM PST
    let nextResetPST = new Date(nowInPST.getFullYear(), nowInPST.getMonth(), nowInPST.getDate(), resetHourPST);
    
    // If the current time is past the reset time, set nextReset to 11 PM PST the next day
    if (nowInPST > nextResetPST) {
        nextResetPST.setDate(nextResetPST.getDate() + 1);
    }
    
    const timeRemaining = nextResetPST - nowInPST;
    updateCountdownDisplay(timeRemaining);
    
    const countdownInterval = setInterval(() => {
        const now = new Date();
        const nowInPST = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
        const timeRemaining = nextResetPST - nowInPST;
        
        if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            resetDailyMember();
            startCountdown();
            resetForTesting();
            setLocalStorage('wrongGuessCount', 0); // Reset correct guess state
            location.reload(); // Refresh the page when the countdown reaches zero
        } else {
            updateCountdownDisplay(timeRemaining);
        }
    }, 1000);
}

function updateCountdownDisplay(timeRemaining) {
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    countdownElement.textContent = `New member in: ${hours}h ${minutes}m ${seconds}s`;
}

function updateHintAvailability() {
    const hint1Button = document.getElementById('hint1-button');
    const hint2Button = document.getElementById('hint2-button');
    const hint3Button = document.getElementById('hint3-button');

    hint1Button.disabled = wrongGuessCount < 3;
    hint2Button.disabled = wrongGuessCount < 5;
    hint3Button.disabled = wrongGuessCount < 7;

    hint1Button.textContent = wrongGuessCount >= 3 ? 'Show Debut Year' : `${3 - wrongGuessCount} more guesses until Hint 1`;
    hint2Button.textContent = wrongGuessCount >= 5 ? 'Show Branch' : `${5 - wrongGuessCount} more guesses until Hint 2`;
    hint3Button.textContent = wrongGuessCount >= 7 ? 'Show Generation' : `${7 - wrongGuessCount} more guesses until Hint 3`;
    
}

searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    menuItems.innerHTML = '';

    if (query) {
        const filteredMembers = members
            .filter(member => !guessedMembers.includes(member.name))
            .filter(member => member.name.toLowerCase().includes(query));
        filteredMembers.forEach(member => {
            const item = document.createElement('div');
            item.classList.add('IZ-select__item');
            item.innerHTML = `
                <div class="select-content">
                    <div><img src="${member.img}" width="40px" height="40px"></div>
                    <div>${member.name}</div>
                </div>
            `;
            item.addEventListener('click', () => {
                selectedMember = member;
                searchInput.value = member.name;
                menuItems.style.display = 'none';
            });
            menuItems.appendChild(item);
        });
        menuItems.style.display = 'block';
    } else {
        menuItems.style.display = 'none';
    }
});

submitButton.addEventListener('click', () => {
    if (selectedMember && !correctGuess) {
        if (!guessedMembers.includes(selectedMember.name)) {
            addMemberToTable(selectedMember);
            guessedMembers.push(selectedMember.name);
            setLocalStorage('guessedMembers', JSON.stringify(guessedMembers));

            searchInput.value = '';
            menuItems.style.display = 'none';

            if (!isFirstGuess) {
                tableContainer.style.display = 'none'; // Show table after first guess
                isFirstGuess = true;
            }

            if (selectedMember.name === randomMember.name) {
                correctGuess = true;
                setLocalStorage('correctGuess', 'true'); // Save correct guess state to local storage
                submitButton.style.pointerEvents = 'none';
                submitButton.style.opacity = '0.5';
                playFullAudio();
                showConfetti();
            } else {
                wrongGuessCount++; // Increase wrong guesses count
                updateGrayBar();
                setLocalStorage('wrongGuessCount', wrongGuessCount);
                updateHintAvailability(); // Update hint availability based on wrong guesses

            }
        }
    }
});

function saveButtonStateToLocalStorage(isDisabled) {
    localStorage.setItem('submitButtonState', JSON.stringify({ disabled: isDisabled }));
}

document.addEventListener('click', (event) => {
    if (!event.target.closest('.guessbox')) {
        menuItems.style.display = 'none';
    }
});

function selectRandomMember() {
    return randomMember
}


function getRandomSong(memberData) {
    // Split the Song_link into a list of song names
    const songList = memberData.songLink.split(',').map(song => song.trim());

    // Select a random song from the list
    const selectedSong = songList[randomIndex];

    // Return the selected song name and the complete URL for the song
    return {
        songName: selectedSong,
        songURL: `hololive-songs/${selectedSong}.mp3`
    };
}

function playRandomSongForMember(memberData) {
    let selectedSong;

    // Check if a song has been selected for the day
    if (localStorage.getItem('selectedSong')) {
        selectedSong = localStorage.getItem('selectedSong');
    } else {
        // Select and save a random song for the member
        const { songName, songURL } = getRandomSong(memberData);
        selectedSong = songName;
        localStorage.setItem('selectedSong', selectedSong);
    }

    const songURL = `https://hololive-assets.sfo3.digitaloceanspaces.com/hololive-songs/${selectedSong}.mp3`;

    // Set the source of the audio element
    audioElement.src = songURL;

//            console.log(`Playing song: ${selectedSong}`);
}

let maxPlayTime = 0;
const playButton = document.getElementById('play-btn');
const loadingBar = document.getElementById('loading-bar');
const grayBar = document.getElementById('gray-bar');
const volumeSlider = document.getElementById('volume-slider');
const markerContainer = document.getElementById('marker-container');
const MAX_PLAY_DURATION = 30; // Limit the play time to a maximum of 60 seconds

function playFullAudio() {
    // Remove all markers from the marker container
    markerContainer.innerHTML = ''; 

    // Set the maxPlayTime to the full duration of the audio
    maxPlayTime = audioElement.duration;

    // Allow the gray bar to cover the full duration
    grayBar.style.width = '100%';

    // Reset the audio to the beginning without playing it
    audioElement.currentTime = 0; // Start from the beginning

    // Update the loading bar for the full duration (without playing yet)
    audioElement.addEventListener('timeupdate', function() {
        const percentage = (audioElement.currentTime / audioElement.duration) * 100;
        loadingBar.style.width = percentage + "%";
    });

    // Set the play button to show the play icon (▶) initially, not auto-playing the audio
    playButton.innerHTML = "&#9658;"; // Play icon (▶)
    
    // Set up the event for when the audio ends to reset the button and bar
    audioElement.addEventListener('ended', function() {
        playButton.innerHTML = "&#9658;"; // Reset to play icon (▶)
        loadingBar.style.width = "0%"; // Reset loading bar
    });
}


function generateFibonacciUpTo(maxValue) {
    let fib = [1, 2]; // Start with the first two Fibonacci numbers
    while (true) {
        let next = fib[fib.length - 1] + fib[fib.length - 2];
        if (next > maxValue) break;
        fib.push(next);
    }
    return fib.slice(1); // Return all Fibonacci numbers
}

// Function to get the Fibonacci number for a given wrong guess count
function getFibonacciNumber(index) {
    const fibonacciNumbers = generateFibonacciUpTo(audioElement.duration);
    if (index < fibonacciNumbers.length) {
        return fibonacciNumbers[index];
    } else {
        return audioElement.duration; // If index is out of bounds, return the full duration
    }
}

function createMarkers() {
    const totalDuration = Math.min(audioElement.duration, MAX_PLAY_DURATION); // Cap the markers at 60 seconds
    markerContainer.innerHTML = ''; // Clear existing markers

    // Generate Fibonacci numbers up to the capped total duration
    const fibonacciNumbers = generateFibonacciUpTo(totalDuration);

    // Create markers based on the Fibonacci sequence
    fibonacciNumbers.forEach(number => {
        const marker = document.createElement('div');
        marker.classList.add('marker');

        // Calculate position in percentage relative to the capped total duration
        const position = (number / totalDuration) * 100;
        marker.style.left = position + '%';

        markerContainer.appendChild(marker);
    });
}

function updateGrayBar() {
    const totalDuration = Math.min(audioElement.duration, MAX_PLAY_DURATION); // Cap the gray bar to 60 seconds
    const fibonacciValue = getFibonacciNumber(wrongGuessCount);

    // Calculate the width of the gray bar based on the Fibonacci number
    const grayBarWidth = (Math.min(fibonacciValue, MAX_PLAY_DURATION) / totalDuration) * 100;
    grayBar.style.width = grayBarWidth + '%';
}

// Play/Pause functionality with time limit control
playButton.addEventListener('click', function() {
    if (correctGuess) {
        // User has made the correct guess, so allow manual play/pause control
        if (audioElement.paused) {
            audioElement.play();
            playButton.innerHTML = "&#10074;&#10074;"; // Pause icon (⏸)
        } else {
            audioElement.pause();
            playButton.innerHTML = "&#9658;"; // Play icon (▶)
        }
    } else {
        // Handle the usual incorrect guess logic here, using Fibonacci or restricted playtime logic
        maxPlayTime = Math.min(getFibonacciNumber(wrongGuessCount), audioElement.duration, MAX_PLAY_DURATION);
        if (audioElement.paused) {
            audioElement.play();
            playButton.innerHTML = "&#10074;&#10074;"; // Pause icon (⏸)
        } else {
            audioElement.pause();
            playButton.innerHTML = "&#9658;"; // Play icon (▶)
        }
    }
});

// Update the loading bar as the audio plays
audioElement.addEventListener('timeupdate', function() {
    if (!correctGuess) {  // Only update the loading bar if the guess is incorrect
        const percentage = (audioElement.currentTime / MAX_PLAY_DURATION) * 100;
        loadingBar.style.width = percentage + "%";

        // If the current time exceeds the allowed maxPlayTime, pause the audio
        if (audioElement.currentTime >= maxPlayTime) {
            audioElement.pause();
            audioElement.currentTime = 0; // Start from the beginning
            playButton.innerHTML = "&#9658;"; // Reset to play icon (▶)
        }
    }
});

// Reset the button and bar when the audio ends
audioElement.addEventListener('ended', function() {
    playButton.innerHTML = "&#9658;"; // Reset to play icon (▶)
    loadingBar.style.width = "0%";
});

// Volume control
volumeSlider.addEventListener('input', function() {
    audioElement.volume = volumeSlider.value; // Set the audio volume based on the slider value
});

// When audio metadata is loaded, check for correct guess
audioElement.addEventListener('loadedmetadata', function() {
    if (correctGuess) {
        playFullAudio();  // Play the full audio right away if correct
    } else {
        createMarkers();   // Otherwise, create markers
        updateGrayBar();   // Set initial gray bar
    }
});


function addMemberToTable(member) {
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td class="guessed-pic"><img src="${member.img}" width="100px" height="100px"></td>
    `;

    guessTableBody.insertBefore(newRow, guessTableBody.firstChild);

    const imgCell = newRow.querySelector('.guessed-pic');
    const isCorrectGuess = member.name === randomMember.name;

    // Check if this member has been guessed before
    const hasBeenGuessedBefore = guessedMembers.some(guess => guess.name === member.name);

    if (!isFirstGuess) {
        // Show table after the first guess
        tableContainer.style.display = 'block';
        guessTableBody.style.display = 'table-row-group'; // Ensure tbody is displayed as table-row-group
        isFirstGuess = true;
    }
    
    // Apply class based on whether the guess was correct or not
    if (isCorrectGuess) {
        imgCell.classList.add('correct');
    } else {
        imgCell.classList.add('incorrect');
    }

    // Apply fade-in animation only if it's a new guess
    if (!hasBeenGuessedBefore) {
        imgCell.classList.add('fade-in');
    }
}



// Function to create a confetti element
function createConfettiElement() {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = Math.random() * 100 + 'vw'; // Random horizontal position
    confetti.style.animationDelay = Math.random() * 2 + 's'; // Random delay for each confetti
    return confetti;
}

// Function to show confetti
function showConfetti() {
    confettiContainer.innerHTML = ''; // Clear existing confetti

    // List of emote images
    const emoteImages = [
        'botan.png', 'fubuki.png', 'kiara.png', 'suisei.png', 'watame.png',
        'botan.png', 'fubuki.png', 'kiara.png', 'suisei.png', 'watame.png',
        'botan.png', 'fubuki.png', 'kiara.png', 'suisei.png', 'watame.png',
        'botan.png', 'fubuki.png', 'kiara.png', 'suisei.png', 'watame.png',
        'botan.png', 'fubuki.png', 'kiara.png', 'suisei.png', 'watame.png',
        'botan.png', 'fubuki.png', 'kiara.png', 'suisei.png', 'watame.png',
        'botan.png', 'fubuki.png', 'kiara.png', 'suisei.png', 'watame.png',
        'botan.png', 'fubuki.png', 'kiara.png', 'suisei.png', 'watame.png',
        'botan.png', 'fubuki.png', 'kiara.png', 'suisei.png', 'watame.png',
        'botan.png', 'fubuki.png', 'kiara.png', 'suisei.png', 'watame.png',
    ];

    for (let i = 0; i < emoteImages.length; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.backgroundImage = `url('${emoteImages[i]}')`; // Set the emote image
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = `${Math.random() * 100}vh`;
        confettiContainer.appendChild(confetti);
    }
}

function toggleHint(hintNumber) {
    const hintElement = document.getElementById(`hint${hintNumber}`);
    const isCurrentlyVisible = hintElement.style.display === 'block';
    const newDisplayValue = isCurrentlyVisible ? 'none' : 'block';
    hintElement.style.display = newDisplayValue;

    // Save the new state to localStorage
    localStorage.setItem(`hint${hintNumber}Visibility`, newDisplayValue);

//            console.log(`Hint ${hintNumber} toggled:`, newDisplayValue); // Debug line
}


function updateHints() {
    if (randomMember) { // Ensure randomMember is defined
        document.getElementById('hint1-content').textContent = `Debut Year: ${randomMember.debut}`;
        document.getElementById('hint2-content').textContent = `Branch: ${randomMember.branch}`;
        document.getElementById('hint3-content').textContent = `Generation: ${randomMember.generation}`;
//                console.log('Hints updated:', {
//                   debut: randomMember.debut,
//                    branch: randomMember.branch,
//                    generation: randomMember.generation
//                }); // Debug line
    }
}
const modal = document.getElementById("aboutMeModal");
const btn = document.getElementById("aboutMeBtn");
const news = document.getElementById("news");
const news_btn = document.getElementById("news-button");
const span = document.getElementsByClassName("close")[0];
const closeNews = document.getElementsByClassName("news-close")[0];
                
// Modal event listeners
btn.onclick = function() {
    modal.classList.add('show');
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.classList.remove('show');
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target === modal) {
        modal.classList.remove('show');
    } else if (event.target === news) {
        news.classList.remove('show');
    }
}  

// Modal event listeners
news_btn.onclick = function() {
    news.classList.add('show');
}
// When the user clicks on <span> (x), close the modal
closeNews.onclick = function() {
    news.classList.remove('show');
} 


function resetForTesting() {
    // Function to remove all keys with the specific PAGE_KEY_PREFIX
    function clearPageLocalStorage() {
        // Get all keys from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(PAGE_KEY_PREFIX)) {
                removeLocalStorage(key.replace(PAGE_KEY_PREFIX, ''));
            }
        }
    }

    clearPageLocalStorage();
    setLocalStorage('wrongGuessCount', 0); // Reset correct guess state
    location.reload(); // Reload the page to apply changes
}

document.querySelector('.refresh-image').addEventListener('click', () => {
    resetForTesting();
});