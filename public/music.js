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
let guessedMembersUnlimited = JSON.parse(getLocalStorage('guessedMembersUnlimited')) || [];
let isFirstGuess = false;
let correctGuess = getLocalStorage('correctGuess') === 'true';
let correctGuessUnlimited = getLocalStorage('correctGuessUnlimited') === 'true';
let wrongGuessCount = 0; // Counter for wrong guesses
let wrongGuessCountUnlimited = 0; 
const countdownElement = document.getElementById('countdown');
const baseUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/randomMember';
const unlimitedModeUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/unlimitedMember' 

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
        currentAnswer = randomMember;
        setLocalStorage('randomMember', JSON.stringify(randomMember));
        resetDailyMember();
        startCountdown();
        playRandomSongForMember(currentAnswer);

            // Wait for the audio metadata to be loaded before selecting mode
        audioElement.addEventListener('loadedmetadata', function initAfterFetch() {
            selectMode(modeSelect.value);
            audioElement.removeEventListener('loadedmetadata', initAfterFetch);
        });
        setupLimitedAudio();
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
const loserConfettiContainer = document.getElementById('loserConfetti-container'); 

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
        const { songName, songURL } = getRandomSong(currentAnswer);
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

if (correctGuessUnlimited) {
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

function updateGuessListUnlimited() {
    guessedMembersUnlimited.forEach(memberName => {
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

function updateHintAvailabilityUnlimited() {
    const hint1Button = document.getElementById('hint1-button');
    const hint2Button = document.getElementById('hint2-button');
    const hint3Button = document.getElementById('hint3-button');

    hint1Button.disabled = wrongGuessCountUnlimited < 3;
    hint2Button.disabled = wrongGuessCountUnlimited < 5;
    hint3Button.disabled = wrongGuessCountUnlimited < 7;

    hint1Button.textContent = wrongGuessCountUnlimited >= 3 ? 'Show Debut Year' : `${3 - wrongGuessCountUnlimited} more guesses until Hint 1`;
    hint2Button.textContent = wrongGuessCountUnlimited >= 5 ? 'Show Branch' : `${5 - wrongGuessCountUnlimited} more guesses until Hint 2`;
    hint3Button.textContent = wrongGuessCountUnlimited >= 7 ? 'Show Generation' : `${7 - wrongGuessCountUnlimited} more guesses until Hint 3`;
    
}


searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    menuItems.innerHTML = '';
    let filteredMembers = [];
    if (query) {
        if (modeSelect.value === "unlimited") {  
            filteredMembers = members 
            .filter(member => !guessedMembersUnlimited.includes(member.name)) 
            .filter(member => member.name.toLowerCase().includes(query)); 
        } else { 
            filteredMembers = members 
                .filter(member => !guessedMembers.includes(member.name)) 
                .filter(member => member.name.toLowerCase().includes(query));
        }
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
    if (modeSelect.value === "unlimited") { 
        if (selectedMember && !correctGuessUnlimited) {
            if (!guessedMembersUnlimited.includes(selectedMember.name)) {
                addMemberToTable(selectedMember);
                guessedMembersUnlimited.push(selectedMember.name);
                setLocalStorage('guessedMembersUnlimited', JSON.stringify(guessedMembersUnlimited));

                searchInput.value = '';
                menuItems.style.display = 'none';

                if (!isFirstGuess) {
                    tableContainer.style.display = 'none'; // Show table after first guess
                    isFirstGuess = true;
                }

                if (selectedMember.name === currentAnswer.name) {
                    correctGuessUnlimited = true; 
                    setLocalStorage('correctGuessUnlimited', 'true'); 
                    submitButton.style.pointerEvents = 'none';
                    submitButton.style.opacity = '0.5';
                    playFullAudio();
                    showConfetti(); 
                } else {
                    wrongGuessCountUnlimited++; 
                    setLocalStorage('wrongGuessCountUnlimited', wrongGuessCountUnlimited); 
                    updateHintAvailabilityUnlimited(); 
                    updateGrayBarUnlimited(); 
                    decrementAttempts();

                }
                            // Disable level button when the first guesses come in
                if (guessedMembersUnlimited.length > 0) {
                    disableLevelButton();
                }
            }
        }
    } else {
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

                if (selectedMember.name === currentAnswer.name) {
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
                            // Disable level button when the first guesses come in
                if (guessedMembers.length > 0) {
                    disableLevelButton();
                }
            }
        }        
    }
});

// Submit member by pressing enter key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        if (modeSelect.value === "unlimited") {
            if (selectedMember && !correctGuessUnlimited) {
                submitButton.click(); // Trigger the submit button click programmatically
            }        
    } else {
            // Ensure an option is selected and there isn't already a correct guess
            if (selectedMember && !correctGuess) {
                submitButton.click(); // Trigger the submit button click programmatically
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
}

let maxPlayTime = 0;
const playButton = document.getElementById('play-btn');
const loadingBar = document.getElementById('loading-bar');
const grayBar = document.getElementById('gray-bar');
const volumeSlider = document.getElementById('volume-slider');
const markerContainer = document.getElementById('marker-container');
const MAX_PLAY_DURATION = 30; // Limit the play time to a maximum of 60 seconds

function playFullAudio() {
    // Remove old listeners
    audioElement.removeEventListener('timeupdate', limitedListener);
    audioElement.removeEventListener('timeupdate', fullListener);

    markerContainer.innerHTML = '';
    maxPlayTime = audioElement.duration;
    grayBar.style.width = '100%';
    loadingBar.style.width = '0%';
    audioElement.currentTime = 0;

    audioElement.addEventListener('timeupdate', fullListener);

    playButton.innerHTML = "&#9658;";

    audioElement.addEventListener('ended', function reset() {
        playButton.innerHTML = "&#9658;";
        loadingBar.style.width = "0%";
        audioElement.removeEventListener('ended', reset);
    });
}

function setupLimitedAudio() {
    audioElement.removeEventListener('timeupdate', fullListener);
    audioElement.removeEventListener('timeupdate', limitedListener);
    audioElement.addEventListener('timeupdate', limitedListener);
}

function limitedListener() {
    if (!correctGuess) {
        const percentage = (audioElement.currentTime / MAX_PLAY_DURATION) * 100;
        loadingBar.style.width = percentage + "%";

        if (audioElement.currentTime >= maxPlayTime) {
            audioElement.pause();
            audioElement.currentTime = 0;
            playButton.innerHTML = "&#9658;";
        }
    }
}

function fullListener() {
    const percentage = (audioElement.currentTime / audioElement.duration) * 100;
    loadingBar.style.width = percentage + "%";
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


function updateGrayBarUnlimited() {
    const totalDuration = Math.min(audioElement.duration, MAX_PLAY_DURATION); // Cap the gray bar to 60 seconds
    const fibonacciValue = getFibonacciNumber(wrongGuessCountUnlimited);

    // Calculate the width of the gray bar based on the Fibonacci number
    const grayBarWidth = (Math.min(fibonacciValue, MAX_PLAY_DURATION) / totalDuration) * 100;
    grayBar.style.width = grayBarWidth + '%';
}

// Play/Pause functionality with time limit control
playButton.addEventListener('click', function() {
    if (modeSelect.value === "unlimited") {
        if (correctGuessUnlimited) {
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
            maxPlayTime = Math.min(getFibonacciNumber(wrongGuessCountUnlimited), audioElement.duration, MAX_PLAY_DURATION);
            if (audioElement.paused) {
                audioElement.play();
                playButton.innerHTML = "&#10074;&#10074;"; // Pause icon (⏸)
            } else {
                audioElement.pause();
                playButton.innerHTML = "&#9658;"; // Play icon (▶)
            }
        }
    } else {
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
    }
});

// Update the loading bar as the audio plays
audioElement.addEventListener('timeupdate', function() {
    if ( modeSelect.value === "unlimited") {
        if (!correctGuessUnlimited) {  // Only update the loading bar if the guess is incorrect
            const percentage = (audioElement.currentTime / MAX_PLAY_DURATION) * 100;
            loadingBar.style.width = percentage + "%";

            // If the current time exceeds the allowed maxPlayTime, pause the audio
            if (audioElement.currentTime >= maxPlayTime) {
                audioElement.pause();
                audioElement.currentTime = 0; // Start from the beginning
                playButton.innerHTML = "&#9658;"; // Reset to play icon (▶)
            }
        }
    } else {
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
    if (modeSelect.value === "unlimited"){
        if (correctGuessUnlimited) { 
            playFullAudio();  // Play the full audio right away if correct
        } else {
            createMarkers();   // Otherwise, create markers
            updateGrayBarUnlimited();   // Set initial gray bar
        }        
    } else {
        if (correctGuess) {
            playFullAudio();  // Play the full audio right away if correct
        } else {
            createMarkers();   // Otherwise, create markers
            updateGrayBar();   // Set initial gray bar
        }   
    }

});


function addMemberToTable(member) {
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td class="guessed-pic"><img src="${member.img}" width="100px" height="100px"></td>
    `;

    guessTableBody.insertBefore(newRow, guessTableBody.firstChild);

    const imgCell = newRow.querySelector('.guessed-pic');
    const isCorrectGuess = member.name === currentAnswer.name;

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

function revealCurrentAnswerInUnlimited(member) {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td class="guessed-pic"><img src="${member.img}" width="100px" height="100px"></td>
    `;

    guessTableBody.insertBefore(newRow, guessTableBody.firstChild);

    const imgCell = newRow.querySelector('.guessed-pic');

    // Apply class based on whether the guess was correct or not
    imgCell.classList.add('revealed-answer');
    imgCell.classList.add('fade-in');
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
        'Emotes/botan.png', 'Emotes/fubuki.png', 'Emotes/kiara.png', 'Emotes/suisei.png', 'Emotes/watame.png',
        'Emotes/botan.png', 'Emotes/fubuki.png', 'Emotes/kiara.png', 'Emotes/suisei.png', 'Emotes/watame.png',
        'Emotes/botan.png', 'Emotes/fubuki.png', 'Emotes/kiara.png', 'Emotes/suisei.png', 'Emotes/watame.png',
        'Emotes/botan.png', 'Emotes/fubuki.png', 'Emotes/kiara.png', 'Emotes/suisei.png', 'Emotes/watame.png',
        'Emotes/botan.png', 'Emotes/fubuki.png', 'Emotes/kiara.png', 'Emotes/suisei.png', 'Emotes/watame.png',
        'Emotes/botan.png', 'Emotes/fubuki.png', 'Emotes/kiara.png', 'Emotes/suisei.png', 'Emotes/watame.png',
        'Emotes/botan.png', 'Emotes/fubuki.png', 'Emotes/kiara.png', 'Emotes/suisei.png', 'Emotes/watame.png',
        'Emotes/botan.png', 'Emotes/fubuki.png', 'Emotes/kiara.png', 'Emotes/suisei.png', 'Emotes/watame.png',
        'Emotes/botan.png', 'Emotes/fubuki.png', 'Emotes/kiara.png', 'Emotes/suisei.png', 'Emotes/watame.png',
        'Emotes/botan.png', 'Emotes/fubuki.png', 'Emotes/kiara.png', 'Emotes/suisei.png', 'Emotes/watame.png',
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
}


function updateHints() {
    if (randomMember) { // Ensure randomMember is defined
        document.getElementById('hint1-content').textContent = `Debut Year: ${currentAnswer.debut}`;
        document.getElementById('hint2-content').textContent = `Branch: ${currentAnswer.branch}`;
        document.getElementById('hint3-content').textContent = `Generation: ${currentAnswer.generation}`;
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
    guessedMembers = [];
    setLocalStorage('guessedMembers', JSON.stringify(guessedMembers));
    setLocalStorage('wrongGuessCount', 0); // Reset correct guess state
    location.reload(); // Reload the page to apply changes
}

document.querySelector('.refresh-image').addEventListener('click', () => {
    resetForTesting();
});

// Disable right-click globally
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});


let currentLevel = "easy"; // default
const modeSelect = document.querySelector(".mode-select");


document.querySelectorAll(".level-btn").forEach(btn => {
    if (btn.classList.contains("easy")) {
        btn.style.opacity = "1"; // highlight Easy
    } else {
        btn.style.opacity = "0.4"; // dim Medium & Hard
    }
});

document.querySelectorAll(".level-btn").forEach(btn => {
    if (btn.classList.contains("easy")) {
        btn.style.opacity = "1"; // highlight Easy
    } else {
        btn.style.opacity = "0.4"; // dim Medium & Hard
    }
});

function setLevel(level) {
    currentLevel = level;

    // Highlight active level button
    document.querySelectorAll(".level-btn").forEach(btn => btn.style.opacity = "0.4");
    document.querySelector(`.level-btn.${level}`).style.opacity = "1";

    // If in Unlimited mode, restart attempt for the selected level
    const modeSelect = document.querySelector(".mode-select");
    if (modeSelect.value === "unlimited") {
        startLevelAttempts(level);
    }
}

function startLevelAttempts(level) { 
    const levelAttemptsDiv = document.getElementById("levelTimer"); // reuse same div

    if (level === "easy") attemptsLeft = 8;
    else if (level === "medium") attemptsLeft = 6;
    else if (level === "hard") attemptsLeft = 4;

    levelAttemptsDiv.textContent = `Attempts left: ${attemptsLeft}`;
}

function loserConfetti() {
    loserConfettiContainer.innerHTML = '';

    const emoteImages = [
        'Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg','Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg',
        'Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg','Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg',
        'Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg','Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg',
        'Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg','Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg',
        'Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg','Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg',
        'Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg','Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg',
        'Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg','Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg',
        'Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg','Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg',
        'Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg','Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg',
        'Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg','Emotes/chattini_laugh.jpg', 'Emotes/raora_laugh.jpg',
    ];

    for (let i = 0; i < emoteImages.length; i++) {
        const loser_confetti = document.createElement('div');
        loser_confetti.classList.add('loser_confetti');
        loser_confetti.style.backgroundImage = `url('${emoteImages[i]}')`;
        loser_confetti.style.left = `${Math.random() * 100}vw`;
        loser_confetti.style.top = `${Math.random() * 100}vh`;
        loserConfettiContainer.appendChild(loser_confetti);
    }
}


function decrementAttempts() {
    const levelAttemptsDiv = document.getElementById("levelTimer");
    attemptsLeft--;

    if (attemptsLeft > 0) {
        levelAttemptsDiv.textContent = `Attempts left: ${attemptsLeft}`;
    } else {
        // Fail condition (when no attempts remain)
        levelAttemptsDiv.textContent = "You Failed";
        revealCurrentAnswerInUnlimited(currentAnswer, skipAnimation = true);
        submitButton.style.pointerEvents = 'none';
        submitButton.style.opacity = '0.5';

        loserConfetti();
        audioElement.pause();

        // Play fail sound
        const failAudio = new Audio("https://hololive-assets.sfo3.digitaloceanspaces.com/hololive-songs/raora_laugh.mp3"); 
        failAudio.play();
    }
}

// re-enable buttons
function reEnableLevelButton() {
    document.querySelectorAll(".level-btn").forEach(btn => {
        btn.disabled = false;
    });
}

function disableLevelButton() {
    document.querySelectorAll(".level-btn").forEach(btn => {
        btn.disabled = true;
    });
}

function resetGuessedMembers() {
    // 1. Clear the guessed members array
    guessedMembersUnlimited = [];
    setLocalStorage('guessedMembersUnlimited', JSON.stringify(guessedMembersUnlimited));

    // 2. Reset the correct guess flag
    correctGuessUnlimited = false;
    setLocalStorage('correctGuessUnlimited', 'false');

    // 3. Reset wrong guess count (important for song reveal)
    wrongGuessCountUnlimited = 0; 
    setLocalStorage('wrongGuessCountUnlimited', wrongGuessCountUnlimited);

    // 4. Clear the table body
    const guessTableBody = document.querySelector('.table-body');
    if (guessTableBody) {
        guessTableBody.innerHTML = ''; // removes all guessed member rows
    }

    // 5. Hide the table container again
    const tableContainer = document.getElementById('table-container');
    if (tableContainer) {
        tableContainer.style.display = 'none';
    }

    // 6. Reset first guess flag
    isFirstGuess = false;

    // 7. Re-enable submit button
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.style.pointerEvents = 'auto';
        submitButton.style.opacity = '1';
    }

    reEnableLevelButton();

    // 8. Reset song selection
    localStorage.removeItem('selectedSong');
    audioElement.pause();
    audioElement.currentTime = 0;
    loadingBar.style.width = "0%";
    updateGrayBarUnlimited();
    grayBar.style.width = "0%";
    playButton.innerHTML = "&#9658;"; // Reset to play icon

    // 9. Reset hints
    ['1', '2', '3'].forEach(hintNumber => {
        localStorage.removeItem(`hint${hintNumber}Visibility`);
        const hintElement = document.getElementById(`hint${hintNumber}`);
        if (hintElement) hintElement.style.display = 'none';
    });
}

function selectMode(mode) {
    const newMemberBtn = document.getElementById("newMemberBtn");
    const levelButtons = document.querySelector(".level-buttons");
    const levelTimer = document.getElementById("levelTimer");

    if (mode === "unlimited") {
        newMemberBtn.style.display = "block";
        levelButtons.style.display = "flex";
        countdownElement.style.display = "none"; // hide daily countdown
        levelTimer.style.display = "block";    // show level timer
        resetGuessedMembers();
        getNewUnlimitedMember();
        startLevelAttempts(currentLevel);
    } else {
        newMemberBtn.style.display = "none";
        levelButtons.style.display = "none";
        levelTimer.style.display = "none";     // hide level timer
        countdownElement.style.display = "block"; // show daily countdown
        resetGuessedMembers();
        currentAnswer = randomMember;
        playRandomSongForMember(currentAnswer);
        updateHints();
        updateHintAvailability();
        setupLimitedAudio();
        updateGuessList();
        if ( correctGuess === true) {
            submitButton.style.pointerEvents = 'none';
            submitButton.style.opacity = '0.5';
        }
    }
}

// Unlimited Mode get new member
function getNewUnlimitedMember() {
    resetGuessedMembers();
    // 🔹 Reset attempt back to the full value for current level
    startLevelAttempts(currentLevel);
    fetch(unlimitedModeUrl)
        .then(res => {
            if (!res.ok || res.status === 304) {
                throw new Error('Network response was not ok or resource not modified');
            }
            return res.json();
        })
        .then(random_number => {
            unlimitedRandomNumber = random_number[0];
            // Use already-fetched "members" array (from Daily fetch)
            unlimitedRandomMember = members[unlimitedRandomNumber];
            currentAnswer = members[unlimitedRandomNumber];
            playRandomSongForMember(currentAnswer);
            setupLimitedAudio();
            updateHints();
            updateHintAvailabilityUnlimited();
            // Save and update UI
            setLocalStorage('unlimitedRandomMember', JSON.stringify(unlimitedRandomMember));
            updateGuessListUnlimited();
        })
        .catch(error => console.error('Error fetching unlimited member:', error));
}
