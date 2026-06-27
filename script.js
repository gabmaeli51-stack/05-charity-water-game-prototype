// Global State Variables
let progress = 0;
let completedWells = 0;
let timeLeft = 60;
let isRepairing = false;
let isSkillChecking = false;

// Skill Check Degree Tracking Loop
let skillCheckProgress = 0; 

let repairInterval, countdownInterval, skillCheckInterval;

// DOM Selectors
const progressBar = document.getElementById('progress-bar');
const repairBtn = document.getElementById('repair-btn');
const wellsCountEl = document.getElementById('wells-count');
const timeLeftEl = document.getElementById('time-left');
const wellStatusEl = document.getElementById('well-status');
const skillCheckZone = document.getElementById('skill-check-zone');
const needle = document.getElementById('needle');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverText = document.getElementById('game-over-text');
const accessibilityMode = document.getElementById('accessibility-mode');
const dbdHeart = document.getElementById('dbd-heart');

// --- START GAME ENGINE CLOCK ---
function startClock() {
    clearInterval(countdownInterval); 
    timeLeftEl.textContent = timeLeft;
    
    countdownInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            timeLeftEl.textContent = timeLeft;
        }
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            endGame(false);
        }
    }, 1000);
}

// --- MOUSE HOLD REPAIR CONTROLS ---
repairBtn.addEventListener('mousedown', startRepairing);
repairBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRepairing(); });

function startRepairing() {
    if (isSkillChecking) return;
    isRepairing = true;
    
    wellStatusEl.textContent = "Repairing...";
    wellStatusEl.className = "status-glow glow-blue";

    repairInterval = setInterval(() => {
        if (isRepairing) {
            progress += 0.4;
            progressBar.style.width = `${progress}%`;

            if (Math.random() < 0.015 && progress > 15 && progress < 85) {
                stopRepairing();
                triggerSkillCheck();
            }

            if (progress >= 100) {
                wellCompleted();
            }
        }
    }, 50);
}

window.addEventListener('mouseup', stopRepairing);
window.addEventListener('touchend', stopRepairing);

function stopRepairing() {
    isRepairing = false;
    clearInterval(repairInterval);
}

// --- DBD SKILL CHECK LOGIC ---
function triggerSkillCheck() {
    isSkillChecking = true;
    skillCheckProgress = 0; 
    
    wellStatusEl.textContent = "⚠️ SKILL CHECK!";
    wellStatusEl.className = "status-glow glow-yellow";
    
    if (accessibilityMode && accessibilityMode.checked && dbdHeart) {
        dbdHeart.classList.remove('hidden');
    }
    
    setTimeout(() => {
        if (!isSkillChecking) return;
        skillCheckZone.classList.remove('hidden');

        let degreeStep = 5; 
        if (accessibilityMode && accessibilityMode.checked) {
            degreeStep = 2.5; // Slower speed so you can nail it easily
        }

        skillCheckInterval = setInterval(() => {
            skillCheckProgress += degreeStep;
            needle.style.transform = `rotate(${skillCheckProgress}deg)`;

            if (skillCheckProgress >= 360) {
                resolveSkillCheck(false);
            }
        }, 16); 
    }, 250);
}

// THE BULLETPROOF WINDOW INTERCEPTOR
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isSkillChecking) {
        e.preventDefault(); 
        e.stopPropagation();

        // Coordinates matching the yellow arc on screen exactly
        let currentMin = 45;
        let currentMax = 135;

        if (accessibilityMode && accessibilityMode.checked) {
            currentMin = 20; 
            currentMax = 180; 
        }

        if (skillCheckProgress >= currentMin && skillCheckProgress <= currentMax) {
            resolveSkillCheck(true);
        } else {
            resolveSkillCheck(false);
        }
    }
});

function resolveSkillCheck(isSuccess) {
    clearInterval(skillCheckInterval);
    isSkillChecking = false;
    skillCheckZone.classList.add('hidden');

    if (dbdHeart) dbdHeart.classList.add('hidden');
    const gameContainer = document.querySelector('.game-container');

    if (isSuccess) {
        progress = Math.min(100, progress + 20); 
        progressBar.style.width = `${progress}%`;
        wellStatusEl.textContent = "✨ GREAT CHECK!";
        wellStatusEl.className = "status-glow glow-green";
    } else {
        progress = Math.max(0, progress - 15); 
        progressBar.style.width = `${progress}%`;
        wellStatusEl.textContent = "💥 EXPLODED!";
        wellStatusEl.className = "status-glow"; 
        
        if (gameContainer) {
            gameContainer.classList.add('screen-shake');
            setTimeout(() => gameContainer.classList.remove('screen-shake'), 400);
        }
    }
    
    setTimeout(() => {
        if (!isSkillChecking && isRepairing) {
            wellStatusEl.textContent = "Repairing...";
            wellStatusEl.className = "status-glow glow-blue";
        } else if (!isSkillChecking) {
            wellStatusEl.textContent = "Broken";
            wellStatusEl.className = "status-glow";
        }
    }, 1200);
}

// --- ACTION STATE CHANGES ---
function wellCompleted() {
    stopRepairing();
    completedWells++;
    wellsCountEl.textContent = `${completedWells}/3`;
    progress = 0;
    progressBar.style.width = '0%';

    if (completedWells >= 3) {
        endGame(true);
    } else {
        wellStatusEl.textContent = "Well Repaired!";
        wellStatusEl.className = "status-glow glow-green";
        setTimeout(() => {
            wellStatusEl.textContent = "Broken";
            wellStatusEl.className = "status-glow";
        }, 1500);
    }
}

function endGame(isWin) {
    stopRepairing();
    clearInterval(countdownInterval);
    clearInterval(skillCheckInterval);
    if (dbdHeart) dbdHeart.classList.add('hidden');
    
    gameOverScreen.classList.remove('hidden');
    if (isWin) {
        gameOverTitle.textContent = "Village Hydrated! 🎉";
        gameOverText.textContent = `Excellent job! You successfully repaired all 3 wells with ${timeLeft} seconds left on the clock!`;
    } else {
        gameOverTitle.textContent = "Time Ran Out! 💧";
        gameOverText.textContent = `The water crisis caught up. You repaired ${completedWells}/3 wells before running out of time.`;
    }
}

document.getElementById('retry-btn').addEventListener('click', restartGame);

function restartGame() {
    progress = 0;
    completedWells = 0;
    timeLeft = 60;
    isRepairing = false;
    isSkillChecking = false;
    
    progressBar.style.width = '0%';
    wellsCountEl.textContent = "0/3";
    timeLeftEl.textContent = timeLeft;
    wellStatusEl.textContent = "Broken";
    wellStatusEl.className = "status-glow";
    
    gameOverScreen.classList.add('hidden');
    skillCheckZone.classList.add('hidden');
    if (dbdHeart) dbdHeart.classList.add('hidden');
    
    clearInterval(countdownInterval);
    clearInterval(skillCheckInterval);
    startClock();
}

window.addEventListener('DOMContentLoaded', startClock);