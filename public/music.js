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


// Fetch members data from the JSON file
fetch('hololive_members.json')
    .then(response => response.json())
    .then(data => {
        members = Object.keys(data).map(name => ({
            name: name,
            img: data[name].ImageURL,
            debut: data[name].Debut_Date,
            generation: data[name].Generation,
            branch: data[name].Branch,
            songLink: data[name].Song_link // Add Song_link to the member data
        }));
    })
    .catch(error => console.error('Error fetching member data:', error));

fetch(baseUrl)
    .then(res => {
        if (!res.ok || res.status === 304) {
            throw new Error('Network response was not ok or resource not modified');
        }
        return res.json();
    })
    .then(random_number => {
        randomMember = members[random_number[1]]; // Access the random number from the data
        randomIndex = random_number[4];
        setLocalStorage('randomMember', JSON.stringify(randomMember));
        resetDailyMember();
        startCountdown();
        updateGuessList();
        playRandomSongForMember(randomMember);
    })
    .catch(error => console.error('Error fetching random number:', error));

const searchInput = document.getElementById('search-input');
const menuItems = document.getElementById('menu-items');
const submitButton = document.getElementById('submit-button');
const selectedMemberDiv = document.getElementById('selected-member');
const guessTableBody = document.querySelector('#guess-table tbody');
const tableContainer = document.getElementById('table-container');
const confettiContainer = document.getElementById('confetti-container');

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
        selectRandomMember();
        setLocalStorage('resetTime', resetTime.toISOString());
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
        wrongGuessCount = parseInt(getLocalStorage('wrongGuessCount'), 10) || 0;                // Load wrong guess count from localStorage
//                console.log(`Loaded wrongGuessCount from localStorage: ${wrongGuessCount}`);
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
                showConfetti();
            } else {
                wrongGuessCount++; // Increase wrong guesses count
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

    // Select the audio element
    const audioElement = document.querySelector('audio');

    // Set the source of the audio element
    audioElement.src = songURL;

    // Set the volume to 50%
    audioElement.volume = 0.5;

//            console.log(`Playing song: ${selectedSong}`);
}


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
    location.reload(); // Reload the page to apply changes
}

document.getElementById('reset-button').addEventListener('click', () => {
    resetForTesting();
});