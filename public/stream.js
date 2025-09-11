const PAGE_KEY_PREFIX = 'stream_mode_'; // Unique prefix for this page or functionality

function setLocalStorage(key, value) {
    localStorage.setItem(PAGE_KEY_PREFIX + key, value);
}

function getLocalStorage(key) {
    return localStorage.getItem(PAGE_KEY_PREFIX + key);
}

function removeLocalStorage(key) {
    localStorage.removeItem(PAGE_KEY_PREFIX + key);
}

let members = [];
let selectedMember = null;
let randomMember = null;
let randomNumber = null;
let guessedMembers = JSON.parse(getLocalStorage('guessedMembers')) || [];
let guessedMembersUnlimited = JSON.parse(getLocalStorage('guessedMembersUnlimited')) || [];
let isFirstGuess = false;
let correctGuess = getLocalStorage('correctGuess') === 'true';
let correctGuessUnlimited = getLocalStorage('correctGuessUnlimited') === 'true'; 
const countdownElement = document.getElementById('countdown');
let currentBlurLevel = 30; // Initial blur level
let currentBlurLevelUnlimited = 30; 
const baseUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/randomMember';
const unlimitedModeUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/unlimitedMember'


fetch(baseUrl)
    .then(res => {
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        return res.json();
    })
    .then(random_number => {
        randomNumber = random_number[3];
        
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
            streamLink: data[name].Stream_link
        }));
        randomMember = members[randomNumber]; // Access the random number from the data
        currentAnswer = randomMember; 
        selectMode(modeSelect.value); 
        resetDailyMember();
        startCountdown();
        // Play the stream
        playStreamForMember(currentAnswer);
    })
    .catch(error => console.error('Error:', error));




const searchInput = document.getElementById('search-input');
const menuItems = document.getElementById('menu-items');
const submitButton = document.getElementById('submit-button');
const selectedMemberDiv = document.getElementById('selected-member');
const guessTableBody = document.querySelector('#guess-table tbody');
const tableContainer = document.getElementById('table-container');
const confettiContainer = document.getElementById('confetti-container');
const videoElement = document.querySelector('video');
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
        // Select a random member and save to localStorage
        currentAnswer = randomMember;
        setLocalStorage('resetTime', resetTimePST.toISOString());
        setLocalStorage('randomMember', JSON.stringify(randomMember));
        setLocalStorage('guessedMembers', JSON.stringify([])); // Reset guessed members
        setLocalStorage('correctGuess', 'false'); // Reset correct guess state
        setLocalStorage('currentBlurLevel', 30); // Reset blur level
        guessedMembers = []; // Clear local guessedMembers array
        correctGuess = false; // Reset correctGuess variable
        document.getElementById('submit-button').style.pointerEvents = 'auto'; // Enable the submit button
        document.getElementById('submit-button').style.opacity = '1.0'; // Reset button opacity

        if (randomMember) {
            // Get the stream URL for the random member and save it to localStorage
            const streamURL = getRandomStream(currentAnswer);
            setLocalStorage('selectedStreamURL', streamURL);
        }
        
        // Mute the video and set volume to 0
        videoElement.muted = true;
        videoElement.volume = 0;
        setLocalStorage('videoMuted', videoElement.muted); // Save mute state
        setLocalStorage('videoVolume', videoElement.volume); // Save volume level
        // clear table
        const guessTableBody = document.querySelector('.table-body');
        if (guessTableBody) {
            guessTableBody.innerHTML = '';
        }
        const tableContainer = document.getElementById('table-container');
        if (tableContainer) {
            tableContainer.style.display = 'none';
        }
        startCountdown(); // Restart countdown
    } else {
        // Load data from localStorage
        randomMember = JSON.parse(getLocalStorage('randomMember'));
        currentAnswer = randomMember;
        guessedMembers = JSON.parse(getLocalStorage('guessedMembers')) || [];
        correctGuess = JSON.parse(getLocalStorage('correctGuess') === 'true');
        currentBlurLevel = parseInt(getLocalStorage('currentBlurLevel'), 10) || 0;

        // Load video settings from localStorage
        const isMuted = JSON.parse(getLocalStorage('videoMuted')) || false;
        const videoVolume = parseFloat(getLocalStorage('videoVolume')) || 0;
        videoElement.style.filter = `blur(${currentBlurLevel}px)`;
        videoElement.muted = isMuted;
        videoElement.volume = videoVolume;
    }
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
            setTimeout(() => resetForTesting(), 3000); // wait 3s before reload
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
                    showConfetti();
                    resetBlurLevelUnlimited(); 
                } else {
                    currentBlurLevelUnlimited = Math.max(0, currentBlurLevelUnlimited - 2); 
                    updateBlurLevel();
                    setLocalStorage('currentBlurLevelUnlimited', currentBlurLevelUnlimited); 
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
                    showConfetti();
                    resetBlurLevel();
                } else {
                    currentBlurLevel = Math.max(0, currentBlurLevel - 2); // Ensure blur level doesn't go below 0
                    updateBlurLevel();
                    setLocalStorage('currentBlurLevel', currentBlurLevel); // Save to localStorage

                }
            }        
    }
    }
});

// Submit member by pressing enter key ( instead of clicking on the submit button )
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

document.addEventListener('click', (event) => {
    if (!event.target.closest('.guessbox')) {
        menuItems.style.display = 'none';
    }
});


function getRandomStream(member) {
    return `https://hololive-assets.sfo3.digitaloceanspaces.com/hololive-intros/${member.streamLink}`;
}

function playStreamForMember(member) {
    const streamUrl = getRandomStream(member);
    const videoSourceElement = document.getElementById('video-source');
    videoSourceElement.src = streamUrl;
    videoSourceElement.parentElement.load();
}


function addMemberToTable(member) {
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td class="guessed-pic"><img src="${member.img}" width="100px" height="100px"></td>
    `;

    guessTableBody.insertBefore(newRow, guessTableBody.firstChild);

    const imgCell = newRow.querySelector('.guessed-pic');
    const isCorrectGuess = member.name === currentAnswer.name;
    const hasBeenGuessedBefore = guessedMembers.some(guess => guess.name === member.name);

    if (!isFirstGuess) {
        // Show table after the first guess
        tableContainer.style.display = 'block';
        guessTableBody.style.display = 'table-row-group'; // Ensure tbody is displayed as table-row-group
        isFirstGuess = true;
    }

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

function updateBlurLevel() {
    if ( modeSelect.value === "unlimited") {
        videoElement.style.filter = `blur(${currentBlurLevelUnlimited}px)`;
    } else {
        videoElement.style.filter = `blur(${currentBlurLevel}px)`;        
    }
}

function resetBlurLevel() {
    currentBlurLevel = 0; // Reset blur level to 0
    videoElement.style.filter = `blur(${currentBlurLevel}px)`;
    videoElement.muted = false; // Unmute the video
    videoElement.volume = 0.5; // Set volume to 30%
    setLocalStorage('currentBlurLevel', currentBlurLevel); // Reset correct guess state
    setLocalStorage('videoMuted', videoElement.muted); // Save mute state
    setLocalStorage('videoVolume', videoElement.volume); // Save volume level
}

function resetBlurLevelUnlimited() {
    currentBlurLevelUnlimited = 0; // Reset blur level to 0
    videoElement.style.filter = `blur(${currentBlurLevelUnlimited}px)`;
    videoElement.muted = false; // Unmute the video
    videoElement.volume = 0.5; // Set volume to 30%
    setLocalStorage('currentBlurLevelUnlimited', currentBlurLevelUnlimited); // Reset correct guess state
    setLocalStorage('videoMuted', videoElement.muted); // Save mute state
    setLocalStorage('videoVolume', videoElement.volume); // Save volume level
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
                    setLocalStorage('randomMember', JSON.stringify(randomMember));
                    setLocalStorage('guessedMembers', JSON.stringify([])); // Reset guessed members
                    setLocalStorage('correctGuess', 'false'); // Reset correct guess state
                    setLocalStorage('currentBlurLevel', 30); // Reset correct guess state
                    guessedMembers = []; // Clear local guessedMembers array
                    correctGuess = false; // Reset correctGuess variable
                    submitButton.style.pointerEvents = 'auto'; // Enable the submit button
                    submitButton.style.opacity = '1.0'; // Reset button opacity
                    videoElement.muted = true; // Mute the video
                    videoElement.volume = 0; // Set volume to 0
                    setLocalStorage('videoMuted', videoElement.muted); // Save mute state
                    setLocalStorage('videoVolume', videoElement.volume); // Save volume level
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

    if (level === "easy") attemptsLeft = 9;
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
        resetBlurLevelUnlimited();
        submitButton.style.pointerEvents = 'none';
        submitButton.style.opacity = '0.5';

        loserConfetti();

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

    // 3. Clear the table body
    const guessTableBody = document.querySelector('.table-body');
    if (guessTableBody) {
        guessTableBody.innerHTML = ''; // removes all guessed member rows
    }

    // 4. Hide the table container again
    const tableContainer = document.getElementById('table-container');
    if (tableContainer) {
        tableContainer.style.display = 'none';
    }

    // 5. Reset first guess flag
    isFirstGuess = false;

    // Optional: re-enable submit button if it was disabled
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.style.pointerEvents = 'auto';
        submitButton.style.opacity = '1';
    }

    reEnableLevelButton();
    if (modeSelect.value === "unlimited") {
        currentBlurLevelUnlimited = 30;
        videoElement.style.filter = `blur(${currentBlurLevelUnlimited}px)`;
        videoElement.muted = true; 
        videoElement.volume = 0;       
    } else {
        const savedMuted = getLocalStorage('videoMuted') === 'true';
        const savedVolume = parseFloat(getLocalStorage('videoVolume')) || 0.5;

        videoElement.style.filter = `blur(${currentBlurLevel}px)`;
        videoElement.muted = savedMuted;
        videoElement.volume = savedVolume;
    }

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
        playStreamForMember(currentAnswer);
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
            unlimitedRandomNumber = random_number[3];
            // Use already-fetched "members" array (from Daily fetch)
            unlimitedRandomMember = members[unlimitedRandomNumber];
            currentAnswer = members[unlimitedRandomNumber];
            playStreamForMember(currentAnswer);
            // Save and update UI
            setLocalStorage('unlimitedRandomMember', JSON.stringify(unlimitedRandomMember));
            updateGuessListUnlimited();
        })
        .catch(error => console.error('Error fetching unlimited member:', error));
}