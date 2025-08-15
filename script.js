// script.js - Emoji Memory Rush (updated with hints)
const emojiPool = [
  "😀", "😁", "😂", "🤣", "😅", "😊", "😍", "🤩", "😎", "🤓",
  "🫠", "🤖", "👻", "💩", "🎃", "🐶", "🐱", "🦊", "🐼", "🦄",
  "🍏", "🍕", "🍩", "⚽", "🌈", "🔥", "⭐", "🌙", "🚀", "🎵"
];

// Config (increased starting display time)
const START_DISPLAY_MS = 2000;
const DISPLAY_DECREASE_MS = 90; // decrease per round
const MIN_DISPLAY_MS = 500;
const MAX_HINTS = 3;

// State
let sequence = [];
let playerIndex = 0;
let roundNumber = 0;
let displayMs = START_DISPLAY_MS;
let acceptingInput = false;
let hintsRemaining = MAX_HINTS;

// DOM
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const highscoreStart = document.getElementById('highscore-start');

const gameScreen = document.getElementById('game-screen');
const sequenceDisplay = document.getElementById('sequence-display');
const grid = document.getElementById('grid');
const roundNumberEl = document.getElementById('round-number');
const highscoreGame = document.getElementById('highscore-game');
const quitBtn = document.getElementById('quit-btn');
const hintBtn = document.getElementById('hint-btn');
const hintCountEl = document.getElementById('hint-count');

const gameoverScreen = document.getElementById('gameover-screen');
const finalScoreEl = document.getElementById('final-score');
const finalHighEl = document.getElementById('final-highscore');
const replayBtn = document.getElementById('replay-btn');
const homeBtn = document.getElementById('home-btn');

// Highscore
const HS_KEY = 'emr_highscore';
function getHighScore() {
  return parseInt(localStorage.getItem(HS_KEY) || '0', 10);
}
function setHighScore(v) {
  localStorage.setItem(HS_KEY, String(v));
}

// Init
function init() {
  highscoreStart.textContent = getHighScore();
  highscoreGame.textContent = getHighScore();
  buildGrid();
  updateHintUI();
}

function buildGrid() {
  grid.innerHTML = '';
  // shuffle pool visually so players can't guess positions
  const shuffled = [...emojiPool].sort(() => Math.random() - 0.5);
  shuffled.forEach((emo, idx) => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.type = 'button';
    btn.dataset.emoji = emo;
    btn.dataset.index = idx;
    btn.innerHTML = emo;
    btn.addEventListener('click', onEmojiClick);
    grid.appendChild(btn);
  });
}

// Game flow
startBtn.addEventListener('click', () => {
  startGame();
});
quitBtn.addEventListener('click', () => {
  endGame(true);
});
replayBtn.addEventListener('click', () => {
  startGame();
});
homeBtn.addEventListener('click', () => {
  showScreen('start');
});
hintBtn && hintBtn.addEventListener('click', () => {
  useHint();
});

function startGame() {
  sequence = [];
  playerIndex = 0;
  roundNumber = 0;
  displayMs = START_DISPLAY_MS;
  acceptingInput = false;
  hintsRemaining = MAX_HINTS;
  buildGrid();
  roundNumberEl.textContent = '0';
  highscoreGame.textContent = getHighScore();
  updateHintUI();
  showScreen('game');
  setTimeout(() => nextRound(), 300);
}

function nextRound() {
  roundNumber++;
  roundNumberEl.textContent = String(roundNumber);
  // generate a brand-new random sequence for this round (length == roundNumber)
  sequence = Array.from({ length: roundNumber }, () => emojiPool[Math.floor(Math.random() * emojiPool.length)]);
  acceptingInput = false;
  // show all emojis simultaneously for displayMs
  showSequence(sequence, displayMs).then(() => {
    // reshuffle grid so positions change each round
    buildGrid();
    acceptingInput = true;
    playerIndex = 0;
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('disabled', 'correct', 'wrong'));
  });
  // decrease display time for next round
  displayMs = Math.max(MIN_DISPLAY_MS, displayMs - DISPLAY_DECREASE_MS);
}

function showSequence(seq, msPer) {
  return new Promise(resolve => {
    sequenceDisplay.innerHTML = '';
    // create spans for all emojis
    seq.forEach(emo => {
      const span = document.createElement('div');
      span.className = 'sequence-emoji';
      span.textContent = emo;
      // set animation duration to match msPer
      span.style.animation = `fadeHold ${msPer}ms ease-in-out forwards`;
      sequenceDisplay.appendChild(span);
    });
    // resolve after msPer (plus small buffer)
    setTimeout(() => {
      sequenceDisplay.innerHTML = '';
      resolve();
    }, msPer + 80);
  });
}

function onEmojiClick(e) {
  if (!acceptingInput) return;
  const btn = e.currentTarget;
  const emo = btn.dataset.emoji;
  const expected = sequence[playerIndex];
  if (emo === expected) {
    // correct
    btn.classList.add('correct');
    playerIndex++;
    if (playerIndex >= sequence.length) {
      // round cleared
      acceptingInput = false;
      setTimeout(() => nextRound(), 700);
      // update highscore display if needed
      updateHighScore(sequence.length);
    }
  } else {
    // wrong -> game over
    btn.classList.add('wrong');
    acceptingInput = false;
    setTimeout(() => endGame(false), 450);
  }
}

function updateHighScore(score) {
  const prev = getHighScore();
  if (score > prev) {
    setHighScore(score);
    highscoreStart.textContent = String(score);
    highscoreGame.textContent = String(score);
  }
}

function useHint() {
  if (hintsRemaining <= 0) return;
  if (sequence.length === 0) return;
  // prevent spamming while sequence is being shown
  if (!gameScreen || gameScreen.classList.contains('hidden')) return;

  hintsRemaining--;
  updateHintUI();

  // pause input and replay sequence for a bit longer
  const hintDuration = Math.min(displayMs + 900, 3500);
  const prevAccepting = acceptingInput;
  acceptingInput = false;

  showSequence(sequence, hintDuration).then(() => {
    // briefly highlight the next expected emoji in the grid (if any)
    const next = sequence[playerIndex];
    if (next) {
      const btn = Array.from(document.querySelectorAll('.emoji-btn')).find(b => b.dataset.emoji === next);
      if (btn) {
        btn.classList.add('correct');
        setTimeout(() => btn.classList.remove('correct'), 900);
      }
    }
    // restore input state
    acceptingInput = prevAccepting || true;
  });
}

function updateHintUI() {
  if (hintCountEl) hintCountEl.textContent = String(hintsRemaining);
  if (hintBtn) {
    if (hintsRemaining <= 0 || gameScreen.classList.contains('hidden')) {
      hintBtn.classList.add('disabled');
      hintBtn.disabled = true;
    } else {
      hintBtn.classList.remove('disabled');
      hintBtn.disabled = false;
    }
  }
}

function endGame(quit = false) {
  // If player quits, completed rounds = roundNumber - 1
  // If player made a mistake, completed rounds = sequence.length - 1
  const finalScore = quit ? Math.max(0, roundNumber - 1) : Math.max(0, sequence.length - 1);
  finalScoreEl.textContent = String(finalScore);

  const prev = getHighScore();
  if (finalScore > prev) {
    setHighScore(finalScore);
  }
  finalHighEl.textContent = String(getHighScore());
  showScreen('gameover');
}

function showScreen(name) {
  startScreen.classList.toggle('hidden', name !== 'start');
  gameScreen.classList.toggle('hidden', name !== 'game');
  gameoverScreen.classList.toggle('hidden', name !== 'gameover');

  // refresh highs
  highscoreStart.textContent = getHighScore();
  highscoreGame.textContent = getHighScore();
  updateHintUI();
}

// initialize app
init();
// Set initial screen state
showScreen('start'); 