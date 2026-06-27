// Global State Variables
let progress = 0;
let completedWells = 0;
let timeLeft = 60;
let isRepairing = false;
let isSkillChecking = false;
let needleRotation = 0;
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
const resetBtn = document.getElementById('reset-btn');
const accessibilityMode = document.getElementById('accessibility-mode');

// --- START GAME ENGINE CLOCK ---
function startClock() {
    countdownInterval = setInterval(() => {
        timeLeft--;
        timeLeftEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame(false);
        }
    }, 1000);
}

// --- MOUSE HOLD REPAIR CONTROLS ---
repairBtn.addEventListener('mousedown', () => {
    if (isSkillChecking) return;
    isRepairing = true;
    repairInterval = setInterval(() => {
        if (isRepairing) {
            progress += 0.5;
            progressBar.style.width = `${progress}%`;

            // Random 1.5% chance every tick to trigger a Skill Check
            if (Math.random() < 0.015 && progress > 10 && progress < 85) {
                stopRepairing();
                triggerSkillCheck();
            }

            if (progress >= 100) {
                wellCompleted();
            }
        }
    }, 50);
});

window.addEventListener('mouseup', stopRepairing);

function stopRepairing() {
    isRepairing = false;
    clearInterval(repairInterval);
}

// --- DBD SKILL CHECK LOGIC ---
function triggerSkillCheck() {
    isSkillChecking = true;
    needleRotation = 0;
    
    // DBD Terror Radius / Skill Check Alert style visual flash right before it opens
    wellStatusEl.textContent = "⚠️ SKILL CHECK INCOMING!";
    wellStatusEl.style.color = "#FFC907";
    
    setTimeout(() => {
        if (!isSkillChecking) return; // safety cancel
        skillCheckZone.classList.remove('hidden');

        // Smoother frame rate (10ms interval instead of 20ms) eliminates browser lag!
        skillCheckInterval = setInterval(() => {
            needleRotation += 4; // Tighter rotation step for absolute precision
            needle.style.transform = `rotate(${needleRotation}deg)`;

            if (needleRotation >= 360) {
                resolveSkillCheck(false);
            }
        }, 10);
    }, 250); // Small visual reaction window
}

// Listen for Spacebar Interception
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isSkillChecking) {
        e.preventDefault(); 

        // Set hit zones based on whether Accessibility Mode is toggled on or off
        let minHit = 45;
        let maxHit = 135;
        
        if (accessibilityMode && accessibilityMode.checked) {
            minHit = 30;  // Extra wide safety boundaries for latency protection
            maxHit = 160; 
        }

        if (needleRotation >= minHit && needleRotation <= maxHit) {
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

    if (isSuccess) {
        progress = Math.min(100, progress + 15); 
        progressBar.style.width = `${progress}%`;
        wellStatusEl.textContent = "✨ GREAT CHECK!";
        wellStatusEl.style.color = "#4FCB53";
        setTimeout(() => { wellStatusEl.textContent = "Repairing..."; wellStatusEl.style.color = "#94A3B8"; }, 1000);
    } else {
        progress = Math.max(0, progress - 10); 
        progressBar.style.width = `${progress}%`;
        
        wellStatusEl.textContent = "💥 EXPLODED!";
        wellStatusEl.style.color = "#F5402C";
        setTimeout(() => { wellStatusEl.textContent = "Broken"; }, 1200);
    }
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
        wellStatusEl.textContent = "Broken";
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
if (resetBtn) resetBtn.addEventListener('click', restartGame);
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
    
    gameOverScreen.classList.add('hidden');
    skillCheckZone.classList.add('hidden');
    
    clearInterval(countdownInterval);
    clearInterval(skillCheckInterval);
    startClock();
}

// Initialize on page bootup
startClock();