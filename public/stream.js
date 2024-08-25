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
let guessedMembers = JSON.parse(getLocalStorage('guessedMembers')) || [];
let isFirstGuess = false;
let correctGuess = getLocalStorage('correctGuess') === 'true';
const countdownElement = document.getElementById('countdown');
let currentBlurLevel = 22; // Initial blur level
const baseUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/randomMember';
// Fetch members data from the JSON file
fetch('hololive_members.json')
    .then(response => response.json())
    .then(data => {
        members = Object.keys(data).map(name => ({
            name: name,
            img: data[name].ImageURL,
            streamLink: data[name].Stream_link
        }));
    })
    .catch(error => console.error('Error fetching member data:', error));


fetch(baseUrl)
    .then(res => {
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }
        return res.json();
    })
    .then(random_number => {
//                console.log(random_number); // This will log the object { randomNumber: <number> }
        randomMember =  members[random_number[3]];; // Access the random number from the data
//                console.log('Random Member:', randomMember);
        setLocalStorage('randomMember', JSON.stringify(randomMember));
        resetDailyMember();
        startCountdown();
        updateGuessList();
        // Play the stream
        playStreamForMember(randomMember);
    })
    .catch(error => console.error('Error fetching random number:', error));


const searchInput = document.getElementById('search-input');
const menuItems = document.getElementById('menu-items');
const submitButton = document.getElementById('submit-button');
const selectedMemberDiv = document.getElementById('selected-member');
const guessTableBody = document.querySelector('#guess-table tbody');
const tableContainer = document.getElementById('table-container');
const confettiContainer = document.getElementById('confetti-container');
const videoElement = document.querySelector('video');

function resetDailyMember() {
    const now = new Date();
    const resetHour = 23; // 11 PM in local time
    let resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetHour);

    // If the current time is past the reset time, set resetTime to 11 PM the next day
    if (now > resetTime) {
        resetTime.setDate(resetTime.getDate() + 1);
    }

    const savedResetTime = getLocalStorage('resetTime');
    if (!savedResetTime || new Date(savedResetTime) < now) {
        // Select a random member and save to localStorage
        setLocalStorage('resetTime', resetTime.toISOString());
        setLocalStorage('randomMember', JSON.stringify(randomMember));
        setLocalStorage('guessedMembers', JSON.stringify([])); // Reset guessed members
        setLocalStorage('correctGuess', 'false'); // Reset correct guess state
        setLocalStorage('currentBlurLevel', 22); // Reset correct guess state
        guessedMembers = []; // Clear local guessedMembers array
        correctGuess = false; // Reset correctGuess variable
        submitButton.style.pointerEvents = 'auto'; // Enable the submit button
        submitButton.style.opacity = '1.0'; // Reset button opacity
        startCountdown(); // Restart countdown

        if (randomMember) {
            // Get the stream URL for the random member and save it to localStorage
            const streamURL = getRandomStream(randomMember);
            setLocalStorage('selectedStreamURL', streamURL);

        }
        videoElement.muted = true; // Mute the video
        videoElement.volume = 0; // Set volume to 0
        setLocalStorage('videoMuted', videoElement.muted); // Save mute state
        setLocalStorage('videoVolume', videoElement.volume); // Save volume level
    } else {
        // Load data from localStorage
        randomMember = JSON.parse(getLocalStorage('randomMember'));
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
    const resetHour = 23; // 11 PM in local time
    let nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetHour);
    
    // If the current time is past the reset time, set nextReset to 11 PM the next day
    if (now > nextReset) {
        nextReset.setDate(nextReset.getDate() + 1);
    }
    
    const timeRemaining = nextReset - now;
    updateCountdownDisplay(timeRemaining);
    
    const countdownInterval = setInterval(() => {
        const now = new Date();
        const timeRemaining = nextReset - now;
        
        if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            resetDailyMember();
            startCountdown();
            resetForTesting();
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
                showConfetti();
                resetBlurLevel();
            } else {
                currentBlurLevel = Math.max(0, currentBlurLevel - 2); // Ensure blur level doesn't go below 0
                updateBlurLevel();
                setLocalStorage('currentBlurLevel', currentBlurLevel); // Save to localStorage

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
//            console.log(`Playing stream for ${member.name}: ${streamUrl}`);
    videoSourceElement.parentElement.load();
}


function addMemberToTable(member) {
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td class="guessed-pic"><img src="${member.img}" width="100px" height="100px"></td>
    `;

    guessTableBody.insertBefore(newRow, guessTableBody.firstChild);

    const imgCell = newRow.querySelector('.guessed-pic');
    const isCorrectGuess = member.name === randomMember.name;
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

function updateBlurLevel() {
    videoElement.style.filter = `blur(${currentBlurLevel}px)`;
//            console.log(`Updated blur level to: ${currentBlurLevel}px`);
}

function resetBlurLevel() {
    currentBlurLevel = 0; // Reset blur level to 0
    videoElement.style.filter = `blur(${currentBlurLevel}px)`;
    videoElement.muted = false; // Unmute the video
    videoElement.volume = 0.5; // Set volume to 30%
//            console.log(`Reset blur level to: ${currentBlurLevel}px, unmuted the video, and set volume to 30%`);
    setLocalStorage('currentBlurLevel', currentBlurLevel); // Reset correct guess state
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

                // Get the modal
                var modal = document.getElementById("aboutMeModal");

                // Get the button that opens the modal
                var btn = document.getElementById("aboutMeBtn");
                
                // Get the <span> element that closes the modal
                var span = document.getElementsByClassName("close")[0];
                
                // When the user clicks the button, open the modal
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
                    }
                }
                function resetForTesting() {
                    setLocalStorage('randomMember', JSON.stringify(randomMember));
                    setLocalStorage('guessedMembers', JSON.stringify([])); // Reset guessed members
                    setLocalStorage('correctGuess', 'false'); // Reset correct guess state
                    setLocalStorage('currentBlurLevel', 22); // Reset correct guess state
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
                
                document.getElementById('reset-button').addEventListener('click', () => {
                    resetForTesting();
                });