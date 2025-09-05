const PAGE_KEY_PREFIX = 'classic_mode_'; // Unique prefix for this page or functionality

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
let randomNumber = null
let guessedMembers = JSON.parse(getLocalStorage('guessedMembers')) || [];
let guessedMembersUnlimited = JSON.parse(getLocalStorage('guessedMembersUnlimited')) || [];
let isFirstGuess = false;
let correctGuess = getLocalStorage('correctGuess') === 'true';
let correctGuessUnlimited = getLocalStorage('correctGuessUnlimited') === 'true';
const baseUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/randomMember';
const membersUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/members';
const unlimitedModeUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/unlimitedMember'

// Fetch random number, then fetch members data
fetch(baseUrl)
    .then(res => {
        if (!res.ok || res.status === 304) {
            throw new Error('Network response was not ok or resource not modified');
        }
        return res.json();
    })
    .then(random_number => {
        randomNumber = random_number[0];
        // Fetch members data only after getting the random number
        return fetch(membersUrl);
    })
    .then(response => response.json())
    .then(data => {
        members = Object.keys(data).map(name => ({
            name: name,
            img: data[name].ImageURL,
            debut: data[name].Debut_Date,
            group: data[name].Group,
            generation: data[name].Generation,
            branch: data[name].Branch,
            birthday: data[name].Birthday,
            status: data[name].Status,
            height: parseHeight(data[name].Height),
            fullHeight: data[name].Height
        }));
        randomMember = members[randomNumber]; // Access the random number from the data
        currentAnswer = randomMember;
        setLocalStorage('randomMember', JSON.stringify(randomMember));
        resetDailyMember();
        startCountdown();
        updateGuessList();
    })
    .catch(error => console.error('Error:', error));

const searchInput = document.getElementById('search-input');
const menuItems = document.getElementById('menu-items');
const submitButton = document.getElementById('submit-button');
const selectedMemberDiv = document.getElementById('selected-member');
const guessTableBody = document.querySelector('#guess-table tbody');
const tableContainer = document.getElementById('table-container');
const confettiContainer = document.getElementById('confetti-container');
const modal = document.getElementById("aboutMeModal");
const btn = document.getElementById("aboutMeBtn");
const news = document.getElementById("news");
const news_btn = document.getElementById("news-button");
const span = document.getElementsByClassName("close")[0];
const closeNews = document.getElementsByClassName("news-close")[0];
const countdownElement = document.getElementById('countdown'); // Element to display the countdown timer
const loserConfettiContainer = document.getElementById('loserConfetti-container'); 

// Initially hide the guess table
tableContainer.style.display = 'none';

// Disable the submit button if the correct member has already been guessed
if (correctGuess) {
    submitButton.style.pointerEvents = 'none';
    submitButton.style.opacity = '0.5';
}

if (correctGuessUnlimited) {
    submitButton.style.pointerEvents = 'none';
    submitButton.style.opacity = '0.5';
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

                // Start timer only on the first guess
                if (guessedMembersUnlimited.length === 1 && modeSelect.value === 'unlimited') {
                    runLevelTimer();
                }

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

                    // STOP the level timer
                    clearInterval(timerInterval);
                    timerInterval = null;
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


function addMemberToTable(member, skipAnimation = false) {
    const newRow = document.createElement('tr');

    const heightComparison = compareHeight(member.height, currentAnswer.height);
    const heightDisplay = `${member.fullHeight} ${heightComparison.arrow}`;
    const birthdayClose = isBirthdayClose(member.birthday, currentAnswer.birthday);
    const debutComparison = compareDebut(member.debut, currentAnswer.debut);

    newRow.innerHTML = `
        <td class="guessed-pic"><img src="${member.img}" width="60px" height="60px"></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    `;

    guessTableBody.insertBefore(newRow, guessTableBody.firstChild);

    const cells = newRow.querySelectorAll('td');

    if (skipAnimation) {
        // Skip animations if specified
        cells[1].innerHTML = `${member.debut} ${debutComparison.arrow}`;
        cells[1].classList.add(debutComparison.class);

        cells[2].textContent = member.group;
        const guessedGroups = member.group.split(',').map(group => group.trim());
        const randomGroups = currentAnswer.group.split(',').map(group => group.trim());
    
        const hasExactMatch = guessedGroups.length === randomGroups.length &&
                              guessedGroups.every(group => randomGroups.includes(group));
    
        const hasPartialMatch = guessedGroups.some(group => randomGroups.includes(group));
    
        cells[2].textContent = member.group;
    
        // Apply class based on comparison
        if (hasExactMatch) {
            cells[2].classList.add('correct');
        } else if (hasPartialMatch) {
            cells[2].classList.add('close-answer');
        } else {
            cells[2].classList.add('incorrect');
        };

        cells[3].textContent = member.generation;
        cells[3].classList.add(member.generation === currentAnswer.generation ? 'correct' : 'incorrect');

        cells[4].textContent = member.branch;
        cells[4].classList.add(member.branch === currentAnswer.branch ? 'correct' : 'incorrect');

        cells[5].textContent = member.birthday;
        if (member.birthday === currentAnswer.birthday) {
            cells[5].classList.add('correct');
        } else if (birthdayClose) {
            cells[5].classList.add('close-answer');
        } else {
            cells[5].classList.add('incorrect');
        }

        cells[6].textContent = member.status;
        cells[6].classList.add(member.status === currentAnswer.status ? 'correct' : 'incorrect');

        cells[7].innerHTML = heightDisplay;
        cells[7].classList.add(heightComparison.class);
    } else {
        // Trigger animations for new guesses
        setTimeout(() => {
            cells[1].innerHTML = `${member.debut} ${debutComparison.arrow}`;
            cells[1].classList.add('fade-in', debutComparison.class);
        }, 200);

        setTimeout(() => {
            const guessedGroups = member.group.split(',').map(group => group.trim());
            const randomGroups = currentAnswer.group.split(',').map(group => group.trim());
        
            const hasExactMatch = guessedGroups.length === randomGroups.length &&
                                  guessedGroups.every(group => randomGroups.includes(group));
        
            const hasPartialMatch = guessedGroups.some(group => randomGroups.includes(group));
        
            cells[2].textContent = member.group;
        
            // Apply class based on comparison
            if (hasExactMatch) {
                cells[2].classList.add('fade-in', 'correct');
            } else if (hasPartialMatch) {
                cells[2].classList.add('fade-in', 'close-answer');
            } else {
                cells[2].classList.add('fade-in', 'incorrect');
            }
        }, 800);

        setTimeout(() => {
            cells[3].textContent = member.generation;
            cells[3].classList.add('fade-in', member.generation === currentAnswer.generation ? 'correct' : 'incorrect');
        }, 1400);

        setTimeout(() => {
            cells[4].textContent = member.branch;
            cells[4].classList.add('fade-in', member.branch === currentAnswer.branch ? 'correct' : 'incorrect');
        }, 2000);

        setTimeout(() => {
            cells[5].textContent = member.birthday;
            if (member.birthday === currentAnswer.birthday) {
                cells[5].classList.add('fade-in', 'correct');
            } else if (birthdayClose) {
                cells[5].classList.add('fade-in', 'close-answer');
            } else {
                cells[5].classList.add('fade-in', 'incorrect');
            }
        }, 2600);

        setTimeout(() => {
            cells[6].textContent = member.status;
            cells[6].classList.add('fade-in', member.status === currentAnswer.status ? 'correct' : 'incorrect');
        }, 3200);

        setTimeout(() => {
            cells[7].innerHTML = heightDisplay;
            cells[7].classList.add('fade-in', heightComparison.class);
        }, 3600);
    }

    if (!isFirstGuess) {
        // Show table after the first guess
        tableContainer.style.display = 'block';
        guessTableBody.style.display = 'table-row-group'; // Ensure tbody is displayed as table-row-group
        isFirstGuess = true;
    }
}

function revealCurrentAnswerInUnlimited(member, skipAnimation = false) {
    const newRow = document.createElement('tr');

    const heightComparison = compareHeight(member.height, currentAnswer.height);
    const heightDisplay = `${member.fullHeight} ${heightComparison.arrow}`;
    const birthdayClose = isBirthdayClose(member.birthday, currentAnswer.birthday);
    const debutComparison = compareDebut(member.debut, currentAnswer.debut);

    newRow.innerHTML = `
        <td class="guessed-pic"><img src="${member.img}" width="60px" height="60px"></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    `;

    guessTableBody.insertBefore(newRow, guessTableBody.firstChild);

    const cells = newRow.querySelectorAll('td');

    if (skipAnimation) {
        // Skip animations if specified
        cells[1].innerHTML = `${member.debut} ${debutComparison.arrow}`;
        cells[1].classList.add('revealed-answer');

        // Apply class based on comparison    
        cells[2].textContent = member.group;
        cells[2].classList.add('revealed-answer');

        cells[3].textContent = member.generation;
        cells[3].classList.add('revealed-answer');

        cells[4].textContent = member.branch;
        cells[4].classList.add('revealed-answer');

        cells[5].textContent = member.birthday;
        cells[5].classList.add('revealed-answer');

        cells[6].textContent = member.status;
        cells[6].classList.add('revealed-answer');

        cells[7].innerHTML = heightDisplay;
        cells[7].classList.add('revealed-answer');
    }
}


function parseHeight(heightString) {
    const cmPart = heightString.split(' ')[0];
    return parseInt(cmPart.replace('cm', ''), 10);
}

function compareHeight(guessedHeight, randomHeight) {
    const difference = Math.abs(guessedHeight - randomHeight);

    if (guessedHeight === randomHeight) {
        return { arrow: '', class: 'correct' };
    } else if (difference <= 3) {
        // If the guess is within 15 cm, add the 'close-answer' class
        if (guessedHeight < randomHeight) {
            return { arrow: '⬆', class: 'close-answer' };
        } else {
            return { arrow: '⬇', class: 'close-answer' };
        }
    } else {
        // If the guess is outside the 15 cm range, add the 'incorrect' class
        if (guessedHeight < randomHeight) {
            return { arrow: '⬆', class: 'incorrect' };
        } else {
            return { arrow: '⬇', class: 'incorrect' };
        }
    }
}

function compareDebut(guessedDebut, randomDebut) {
    const guessedDate = new Date(guessedDebut);
    const randomDate = new Date(randomDebut);
    const correct = guessedDate.getTime() === randomDate.getTime();

    if (correct) {
        return { arrow: '', class: 'correct' };
    } else if (guessedDate < randomDate) {
        return { arrow: '⬆', class: 'incorrect' };
    } else {
        return { arrow: '⬇', class: 'incorrect' };
    }
}

function isBirthdayClose(guessedBirthday, randomBirthday) {
    // Append a default year (e.g., 2000) to the MM/DD dates
    const guessedDate = new Date(`2004/${guessedBirthday}`);
    const randomDate = new Date(`2004/${randomBirthday}`);

    // Calculate the time difference in milliseconds
    const timeDifference = Math.abs(randomDate - guessedDate);
    // Convert the time difference to days
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

    // Check if the difference is within 30 days
    return daysDifference <= 30;
}

function createConfettiElement() {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDelay = Math.random() * 2 + 's';
    return confetti;
}

function showConfetti() {
    confettiContainer.innerHTML = '';

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
        confetti.style.backgroundImage = `url('${emoteImages[i]}')`;
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = `${Math.random() * 100}vh`;
        confettiContainer.appendChild(confetti);
    }
}

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
        setLocalStorage('resetTime', resetTimePST.toISOString());
        setLocalStorage('randomMember', JSON.stringify(randomMember));
        setLocalStorage('guessedMembers', JSON.stringify([])); // Reset guessed members
        setLocalStorage('correctGuess', 'false'); // Reset correct guess state
        guessedMembers = []; // Clear local guessedMembers array
        correctGuess = false; // Reset correctGuess variable
        document.getElementById('submit-button').style.pointerEvents = 'auto'; // Enable the submit button
        document.getElementById('submit-button').style.opacity = '1.0'; // Reset button opacity
        startCountdown(); // Restart countdown
    } else {
        randomMember = JSON.parse(getLocalStorage('randomMember'));
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
    
    // If the current time is past the reset time in PST, set nextReset to 11 PM PST the next day
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

// Function to clear local storage and reload for testing
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

document.querySelector('.refresh-image').addEventListener('click', () => {
    resetForTesting();
});
///////////////////////////////////////////////// Unlimited Mode Feature ///////////////////////////////////////////////////////////////////////
let currentLevel = "easy"; // default
let timerInterval;
let timerSeconds = 0;     // store remaining seconds
let dailyCountdownInterval;
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

    // If in Unlimited mode, restart timer for the selected level
    const modeSelect = document.querySelector(".mode-select");
    if (modeSelect.value === "unlimited") {
        startLevelTimer(level);
    }
}

function stopLevelTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function startLevelTimer(level) {
    const levelTimerDiv = document.getElementById("levelTimer");

    if (level === "easy") timerSeconds = 60;
    else if (level === "medium") timerSeconds = 30;
    else if (level === "hard") timerSeconds = 10;

    levelTimerDiv.textContent = `Timer: ${timerSeconds} seconds`;
    clearInterval(timerInterval); // ensure no old interval runs
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

function runLevelTimer() {
    const levelTimerDiv = document.getElementById("levelTimer");

    if (timerInterval) return; // already running

    timerInterval = setInterval(() => {
        timerSeconds--;
        levelTimerDiv.textContent = `Timer: ${timerSeconds} seconds`;

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            levelTimerDiv.textContent = "You Failed";
            revealCurrentAnswerInUnlimited(currentAnswer, skipAnimation = true);
            submitButton.style.pointerEvents = 'none';
            submitButton.style.opacity = '0.5';
            timerInterval = null;
            loserConfetti();
            // Play fail sound
            const failAudio = new Audio("https://hololive-assets.sfo3.digitaloceanspaces.com/hololive-songs/raora_laugh.mp3"); 
            failAudio.play();
        }
    }, 1000);
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
}

function selectMode(mode) {
    const newMemberBtn = document.getElementById("newMemberBtn");
    const levelButtons = document.querySelector(".level-buttons");
    const levelTimer = document.getElementById("levelTimer");
    const colorBoxUnlimited = document.querySelector(".color-boxUnlimited");

    if (mode === "unlimited") {
        newMemberBtn.style.display = "block";
        levelButtons.style.display = "flex";
        countdownElement.style.display = "none"; // hide daily countdown
        levelTimer.style.display = "block";    // show level timer
        colorBoxUnlimited.style.display = "block";
        resetGuessedMembers();
        getNewUnlimitedMember();
        startLevelTimer(currentLevel);
    } else {
        newMemberBtn.style.display = "none";
        levelButtons.style.display = "none";
        levelTimer.style.display = "none";     // hide level timer
        countdownElement.style.display = "block"; // show daily countdown
        colorBoxUnlimited.style.display = "none";
        resetGuessedMembers();
        currentAnswer = randomMember;
        clearInterval(timerInterval);           // stop level timer
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
    // 🔹 Stop any running timer before starting fresh
    stopLevelTimer();

    // 🔹 Reset timer back to the full value for current level
    startLevelTimer(currentLevel);
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
            // Save and update UI
            setLocalStorage('unlimitedRandomMember', JSON.stringify(unlimitedRandomMember));
            updateGuessListUnlimited();
        })
        .catch(error => console.error('Error fetching unlimited member:', error));
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    selectMode(modeSelect.value);
});