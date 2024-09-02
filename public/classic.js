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
let isFirstGuess = false;
let correctGuess = getLocalStorage('correctGuess') === 'true';
const baseUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/randomMember';
const membersUrl = 'https://holomemsguesser-kqvor.ondigitalocean.app/members';

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
const span = document.getElementsByClassName("close")[0];
const countdownElement = document.getElementById('countdown'); // Element to display the countdown timer

// Initially hide the guess table
tableContainer.style.display = 'none';

// Disable the submit button if the correct member has already been guessed
if (correctGuess) {
    submitButton.style.pointerEvents = 'none';
    submitButton.style.opacity = '0.5';
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

    const heightComparison = compareHeight(member.height, randomMember.height);
    const heightDisplay = `${member.fullHeight} ${heightComparison.arrow}`;
    const birthdayClose = isBirthdayClose(member.birthday, randomMember.birthday);
    const debutComparison = compareDebut(member.debut, randomMember.debut);

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
        cells[2].classList.add(member.group === randomMember.group ? 'correct' : 'incorrect');

        cells[3].textContent = member.generation;
        cells[3].classList.add(member.generation === randomMember.generation ? 'correct' : 'incorrect');

        cells[4].textContent = member.branch;
        cells[4].classList.add(member.branch === randomMember.branch ? 'correct' : 'incorrect');

        cells[5].textContent = member.birthday;
        if (member.birthday === randomMember.birthday) {
            cells[5].classList.add('correct');
        } else if (birthdayClose) {
            cells[5].classList.add('close-answer');
        } else {
            cells[5].classList.add('incorrect');
        }

        cells[6].textContent = member.status;
        cells[6].classList.add(member.status === randomMember.status ? 'correct' : 'incorrect');

        cells[7].innerHTML = heightDisplay;
        cells[7].classList.add(heightComparison.class);
    } else {
        // Trigger animations for new guesses
        setTimeout(() => {
            cells[1].innerHTML = `${member.debut} ${debutComparison.arrow}`;
            cells[1].classList.add('fade-in', debutComparison.class);
        }, 200);

        setTimeout(() => {
            cells[2].textContent = member.group;
            cells[2].classList.add('fade-in', member.group === randomMember.group ? 'correct' : 'incorrect');
        }, 800);

        setTimeout(() => {
            cells[3].textContent = member.generation;
            cells[3].classList.add('fade-in', member.generation === randomMember.generation ? 'correct' : 'incorrect');
        }, 1400);

        setTimeout(() => {
            cells[4].textContent = member.branch;
            cells[4].classList.add('fade-in', member.branch === randomMember.branch ? 'correct' : 'incorrect');
        }, 2000);

        setTimeout(() => {
            cells[5].textContent = member.birthday;
            if (member.birthday === randomMember.birthday) {
                cells[5].classList.add('fade-in', 'correct');
            } else if (birthdayClose) {
                cells[5].classList.add('fade-in', 'close-answer');
            } else {
                cells[5].classList.add('fade-in', 'incorrect');
            }
        }, 2600);

        setTimeout(() => {
            cells[6].textContent = member.status;
            cells[6].classList.add('fade-in', member.status === randomMember.status ? 'correct' : 'incorrect');
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

function parseHeight(heightString) {
    const cmPart = heightString.split(' ')[0];
    return parseInt(cmPart.replace('cm', ''), 10);
}

function compareHeight(guessedHeight, randomHeight) {
    if (guessedHeight === randomHeight) {
        return { arrow: '', class: 'correct' };
    } else if (guessedHeight < randomHeight) {
        return { arrow: '⬆', class: 'incorrect' };
    } else {
        return { arrow: '⬇', class: 'incorrect' };
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
    }
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