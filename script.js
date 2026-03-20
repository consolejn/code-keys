let gameStartTime = 0;
let levelStartTime = 0;
let gameState = "playing"; 
// "playing" | "failed" | "complete"

let levelStats = [];

const MAX_ATTEMPTS_DEFAULT = 20;

const LEVELS = [
  {
    name: "Level 1",
    word: "START",
    maxAttempts: 20,
    useScene: false,
    sounds: [
      "assets/audio/levels/level1/1S_START.wav",
      "assets/audio/levels/level1/2T_START.wav",
      "assets/audio/levels/level1/3A_START.wav",
      "assets/audio/levels/level1/4R_START.wav",
      "assets/audio/levels/level1/5T_START.wav"
    ]
  },
  {
    name: "Level 2",
    word: "JUMP",
    maxAttempts: 20,
    useScene: true,
    sounds: [
      "assets/audio/levels/level2/1J_JUMP.wav",
      "assets/audio/levels/level2/2U_JUMP.wav",
      "assets/audio/levels/level2/3M_JUMP.wav",
      "assets/audio/levels/level2/4P_JUMP.wav"
    ]
  },
  {
    name: "Level 3",
    word: "TEST",
    maxAttempts: 20,
    useScene: false,
    sounds: [
      "assets/audio/levels/level3/1T_TEST.wav",
      "assets/audio/levels/level3/2E_TEST.wav",
      "assets/audio/levels/level3/3S_TEST.wav",
      "assets/audio/levels/level3/4T_TEST.wav"
    ]
  },
  {
    name: "Level 4",
    word: "DEMO",
    maxAttempts: 20,
    useScene: false,
    sounds: [
      "assets/audio/levels/level4/1D_DEMO.wav",
      "assets/audio/levels/level4/2E_DEMO.wav",
      "assets/audio/levels/level4/3M_DEMO.wav",
      "assets/audio/levels/level4/4O_DEMO.wav"
    ]
  },
  {
    name: "Level 5",
    word: "FINISH",
    maxAttempts: 20,
    useScene: false,
    sounds: [
      "assets/audio/levels/level5/1F_FINISH.wav",
      "assets/audio/levels/level5/2I_FINISH.wav",
      "assets/audio/levels/level5/3N_FINISH.wav",
      "assets/audio/levels/level5/4I_FINISH.wav",
      "assets/audio/levels/level5/5S_FINISH.wav",
      "assets/audio/levels/level5/6H_FINISH.wav"
    ]
  }
];

let levelIndex = 0;
let stepIndex = 0;
let attemptsLeft = MAX_ATTEMPTS_DEFAULT;
let locked = false;

const wordEl = document.getElementById("word");
const statusEl = document.getElementById("status");
const attemptsEl = document.getElementById("attemptsLeft");
const levelLabelEl = document.querySelector(".level");
const hintEl = document.querySelector(".hint");
const hudEl = document.querySelector(".hud");

const sceneEl = document.getElementById("scene");
const playerEl = sceneEl ? sceneEl.querySelector(".player") : null;

const keyboardEl = document.getElementById("keyboard");

const keyEls = new Map(
  [...document.querySelectorAll(".key")].map(el => [el.dataset.key, el])
);

let stepAudio = [];

/* ---------- UI helpers ---------- */
function setStatus(text, kind) {
  statusEl.textContent = text || "";
  statusEl.classList.remove("good", "bad");
  if (kind) statusEl.classList.add(kind);
}

function updateAttemptsUI() {
  attemptsEl.textContent = String(attemptsLeft);
}

function renderWord() {
  const target = LEVELS[levelIndex].word;
  wordEl.innerHTML = "";

  for (let i = 0; i < target.length; i++) {
    const span = document.createElement("span");
    span.className = "letter";
    span.textContent = target[i];

    if (i < stepIndex) span.classList.add("correct");

    wordEl.appendChild(span);
  }
}

/* ---------- Keyboard visuals ---------- */
function clearKeyClasses() {
  for (const el of keyEls.values()) {
    el.classList.remove("target");
  }
}

function markTargets() {
  const target = LEVELS[levelIndex].word;
  const unique = new Set(target.split(""));

  clearKeyClasses();

  for (const letter of unique) {
    const el = keyEls.get(letter);
    if (el) el.classList.add("target");
  }
}

function flashKey(keyValue, cls) {
  const el = keyEls.get(keyValue);
  if (!el) return;

  el.classList.remove("wrong", "pulse", "correct");
  void el.offsetWidth;
  el.classList.add(cls, "pulse");

  setTimeout(() => el.classList.remove("pulse"), 140);
  if (cls === "wrong") setTimeout(() => el.classList.remove("wrong"), 180);
  if (cls === "correct") setTimeout(() => el.classList.remove("correct"), 180);
}

function shakeKeyboard() {
  if (!keyboardEl) return;
  keyboardEl.classList.remove("shake");
  void keyboardEl.offsetWidth;
  keyboardEl.classList.add("shake");
}

/* ---------- Scene ---------- */
function setupSceneForLevel() {
  const level = LEVELS[levelIndex];
  if (!sceneEl) return;

  if (level.useScene) {
    sceneEl.classList.remove("isHidden");
    sceneEl.dataset.level = String(levelIndex);
    sceneEl.dataset.step = String(stepIndex);

    if (playerEl) playerEl.classList.remove("pulse");

  } else {
    sceneEl.classList.add("isHidden");
  }
}

function animateStep() {
  if (!sceneEl) return;

  sceneEl.dataset.level = String(levelIndex);
  sceneEl.dataset.step = String(stepIndex);

  if (playerEl && LEVELS[levelIndex].useScene) {
    playerEl.classList.remove("pulse");
    void playerEl.offsetWidth;
    playerEl.classList.add("pulse");
  }
}

/* ---------- Audio ---------- */
function preloadLevelAudio() {
  const level = LEVELS[levelIndex];
  stepAudio = [];

  if (!Array.isArray(level.sounds)) return;

  stepAudio = level.sounds.map(src => {
    const a = new Audio(src);
    a.preload = "auto";
    return a;
  });
}

function playStepSound(step) {
  const a = stepAudio[step];
  if (!a) return;

  a.currentTime = 0;
  a.play().catch(() => {});
}

/* ---------- Level flow ---------- */
function loadLevel(newIndex) {
  levelIndex = newIndex;
  stepIndex = 0;
  attemptsLeft = LEVELS[levelIndex].maxAttempts ?? MAX_ATTEMPTS_DEFAULT;
  locked = false;

  levelStartTime = Date.now();

  if (levelLabelEl) levelLabelEl.textContent = LEVELS[levelIndex].name;

  updateAttemptsUI();
  setStatus(`Press "${LEVELS[levelIndex].word[0]}" to begin.`, null);

  preloadLevelAudio();
  renderWord();
  markTargets();
  setupSceneForLevel();
  animateStep();
}

function finishLevel() {
  locked = true;

  setStatus("Level complete!", "good");

  const levelTime = Date.now() - levelStartTime;

  const totalGuesses =
    LEVELS[levelIndex].word.length +
    (LEVELS[levelIndex].maxAttempts - attemptsLeft);

  const accuracy = Math.round(
    (LEVELS[levelIndex].word.length / totalGuesses) * 100
  );

  levelStats.push({
    level: LEVELS[levelIndex].name,
    time: levelTime,
    accuracy: accuracy
  });

  setTimeout(() => {
    const next = levelIndex + 1;

    if (next < LEVELS.length) {
      loadLevel(next);
    } else {
      showResultsScreen();
    }
  }, 850);
}

/* FAIL SCREEN */
function failLevel() {
  locked = true;
  gameState = "failed";

  statusEl.innerHTML = `
    <div class="resultsCard">
      <div class="resultsTitle resultsTitle--fail">OUT OF ATTEMPTS</div>

      <button id="retryBtn" class="playAgain retryBtn">
        Retry Level
      </button>
    </div>
  `;

  statusEl.classList.add("results");

  const retryBtn = document.getElementById("retryBtn");
  retryBtn.addEventListener("click", () => {
    statusEl.classList.remove("results");
    statusEl.textContent = "";
    gameState = "playing";

    // restart level WITHOUT resetting timer
      stepIndex = 0;
      locked = false;
      attemptsLeft = LEVELS[levelIndex].maxAttempts ?? MAX_ATTEMPTS_DEFAULT;

      updateAttemptsUI();
      setStatus(`Press "${LEVELS[levelIndex].word[0]}" to begin.`, null);

      renderWord();
      markTargets();
      setupSceneForLevel();
      animateStep();
  });
}

/* ---------- Results ---------- */
function showResultsScreen() {

  gameState = "complete";
  hudEl.style.display = "none";
  hintEl.style.visibility = "hidden";
  keyboardEl.style.display = "none";

  const totalTime = levelStats.reduce((sum, stat) => sum + stat.time, 0);

  let totalAccuracy = 0;
  levelStats.forEach(stat => totalAccuracy += stat.accuracy);
  totalAccuracy = Math.round(totalAccuracy / levelStats.length);

  wordEl.innerHTML = "";

  let html = `
    <div class="resultsCard">
      <div class="resultsTitle">GAME COMPLETE</div>
      <div class="resultsList">
  `;

  levelStats.forEach(stat => {
    html += `
      <div class="resultRow">
        <div class="resultLevel">${stat.level}</div>
        <div class="resultStat">Time: ${(stat.time / 1000).toFixed(2)}s</div>
        <div class="resultStat">Accuracy: ${stat.accuracy}%</div>
      </div>
    `;
  });

  html += `
        </div>

        <div class="resultsTotal">
          Total Time: ${(totalTime / 1000).toFixed(2)}s
        </div>

        <div class="resultsAccuracy">
          Total Accuracy: ${totalAccuracy}%
        </div>

        <button id="playAgainBtn" class="playAgain">
          Play Again<br><span style="font-size:10px; opacity:0.7;">or press Enter</span>
        </button>
      </div>
  `;

  statusEl.innerHTML = html;
  statusEl.classList.add("results");

  const playAgainBtn = document.getElementById("playAgainBtn");
  playAgainBtn.addEventListener("click", restartGame);

  locked = true;
}

/* ---------- Restart ---------- */
function restartGame() {
  hudEl.style.display = "";
  hintEl.style.visibility = "";
  keyboardEl.style.display = "";

  statusEl.classList.remove("results");
  statusEl.textContent = "";

  gameStartTime = Date.now();
  levelStats = [];

  loadLevel(0);
}

/* ---------- Input ---------- */
function shakeWord() {
  wordEl.classList.remove("shake");
  void wordEl.offsetWidth;
  wordEl.classList.add("shake");
}

function handleKey(e) {

  if (e.key === "Enter" && locked) {

    if (gameState === "failed") {
      statusEl.classList.remove("results");
      statusEl.textContent = "";
      gameState = "playing";

      // restart level WITHOUT resetting timer
      stepIndex = 0;
      locked = false;
      attemptsLeft = LEVELS[levelIndex].maxAttempts ?? MAX_ATTEMPTS_DEFAULT;

      updateAttemptsUI();
      setStatus(`Press "${LEVELS[levelIndex].word[0]}" to begin.`, null);

      renderWord();
      markTargets();
      setupSceneForLevel();
      animateStep();
    }

    if (gameState === "complete") {
      // full restart
      restartGame();
    }

    return;
  }

  if (locked) return;

  if (["Shift","Control","Alt","Meta"].includes(e.key)) return;

  const target = LEVELS[levelIndex].word;
  const pressed = (e.key.length === 1) ? e.key.toUpperCase() : e.key;
  const expected = target[stepIndex];

  if (pressed === expected) {
    playStepSound(stepIndex);
    flashKey(pressed, "correct");

    stepIndex++;
    renderWord();
    animateStep();
    setStatus("", null);

    if (stepIndex >= target.length) finishLevel();
  } else {
    attemptsLeft--;
    updateAttemptsUI();

    shakeKeyboard();
    shakeWord();

    flashKey(pressed, "wrong");

    setStatus(`Wrong key: "${pressed}". Try "${expected}".`, "bad");
    if (attemptsLeft <= 0) failLevel();
  }
}

/* ---------- Input listeners ---------- */
window.addEventListener("keydown", handleKey);

for (const [keyValue, el] of keyEls) {
  el.addEventListener("click", () => {
    handleKey({ key: keyValue });
  });
}

/* ---------- Start game ---------- */
gameStartTime = Date.now();
loadLevel(0);