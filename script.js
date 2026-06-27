// Global State Variables
let progress = 0;
let completedWells = 0;
let timeLeft = 60;
let isRepairing = false;
let isSkillChecking = false;

// Skill Check Timing Variables (Percentage based timeline)
let skillCheckProgress = 0; 
const targetMin = 40; 
const targetMax = 65;  

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
    wellStatusEl.style.color = "#2E9DF7";

    repairInterval = setInterval(() => {
        if (isRepairing) {
            progress += 0.4;
            progressBar.style.width = `${progress}%`;

            // 1.5% chance per frame step to fire a Skill Check
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
    
    wellStatusEl.textContent = "⚠️ SKILL CHECK INCOMING!";
    wellStatusEl.style.color = "#FFC907";
    
    // VISUAL ASSIST FEATURE: Trigger the visual terror radius pulse
    const wellGraphic = document.querySelector('.well-graphic');
    if (accessibilityMode && accessibilityMode.checked && wellGraphic) {
        wellGraphic.classList.add('visual-heartbeat');
    }
    
    setTimeout(() => {
        if (!isSkillChecking) return;
        skillCheckZone.classList.remove('hidden');

        let speedStep = 2.5; 
        if (accessibilityMode && accessibilityMode.checked) {
            speedStep = 1.3; // Much slower needle speed for latency protection
        }

        skillCheckInterval = setInterval(() => {
            skillCheckProgress += speedStep;
            let currentRotation = (skillCheckProgress / 100) * 360;
            needle.style.transform = `rotate(${currentRotation}deg)`;

            if (skillCheckProgress >= 100) {
                resolveSkillCheck(false);
            }
        }, 16); 
    }, 250);
}

// Listen for Spacebar Input Interception
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isSkillChecking) {
        e.preventDefault(); 

        let currentMin = targetMin;
        let currentMax = targetMax;

        // Visual assist mode expands hit window massively
        if (accessibilityMode && accessibilityMode.checked) {
            currentMin = 25; 
            currentMax = 85; 
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

    // Clean up visual heartbeat classes
    const wellGraphic = document.querySelector('.well-graphic');
    const gameContainer = document.querySelector('.game-container');
    if (wellGraphic) wellGraphic.classList.remove('visual-heartbeat');

    if (isSuccess) {
        progress = Math.min(100, progress + 20); 
        progressBar.style.width = `${progress}%`;
        wellStatusEl.textContent = "✨ GREAT CHECK!";
        wellStatusEl.style.color = "#4FCB53";
    } else {
        progress = Math.max(0, progress - 15); 
        progressBar.style.width = `${progress}%`;
        wellStatusEl.textContent = "💥 EXPLODED!";
        wellStatusEl.style.color = "#F5402C";
        
        // Visual Assist Screen Shake on explosion
        if (gameContainer) {
            gameContainer.classList.add('screen-shake');
            setTimeout(() => gameContainer.classList.remove('screen-shake'), 400);
        }
    }
    
    setTimeout(() => {
        if (!isSkillChecking && isRepairing) {
            wellStatusEl.textContent = "Repairing...";
            wellStatusEl.style.color = "#2E9DF7";
        } else if (!isSkillChecking) {
            wellStatusEl.textContent = "Broken";
            wellStatusEl.style.color = "#F5402C";
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
        wellStatusEl.textContent = "Well Repaired! Moving to next...";
        wellStatusEl.style.color = "#4FCB53";
        setTimeout(() => {
            wellStatusEl.textContent = "Broken";
            wellStatusEl.style.color = "#F5402C";
        }, 1500);
    }
}

function endGame(isWin) {
    stopRepairing();
    clearInterval(countdownInterval);
    clearInterval(skillCheckInterval);
    
    gameOverScreen.classList.remove('hidden');
    if (isWin) {
        gameOverTitle.textContent = "Village Hydrated! 🎉";
        gameOverText.textContent = `Excellent job! You successfully repaired all 3 wells with ${timeLeft} seconds left on the clock!`;
    } else {
        gameOverTitle.textContent = "Time Ran Out! 💧";
        gameOverText.textContent = `The water crisis caught up. You repaired ${completedWells}/3 wells before running out of time.`;
    }
}

// --- LEVEL UP EXTRA CREDIT: RESET FUNCTION ---
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
    wellStatusEl.style.color = "#F5402C";
    
    gameOverScreen.classList.add('hidden');
    skillCheckZone.classList.add('hidden');
    
    clearInterval(countdownInterval);
    clearInterval(skillCheckInterval);
    startClock();
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', startClock);