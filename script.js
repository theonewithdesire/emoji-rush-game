// script.js - Emoji Memory Rush - Professional Edition
// Enhanced for CrazyGames with full feature set

// Game Configuration
const CONFIG = {
  START_DISPLAY_MS: 2500,
  DISPLAY_DECREASE_MS: 100,
  MIN_DISPLAY_MS: 600,
  MAX_HINTS: 3,
  GRID_SIZE: 30,
  ANIMATION_SPEED: 300,
  SOUND_ENABLED: true,
  VIBRATION_ENABLED: true
};

// Emoji pools organized by category for better variety
const EMOJI_POOLS = {
  faces: ["😀", "😁", "😂", "🤣", "😅", "😊", "😍", "🤩", "😎", "🤓"],
  animals: ["🐶", "🐱", "🦊", "🐼", "🦄", "🐸", "🐙", "🦋", "🐝", "🦜"],
  food: ["🍏", "🍕", "🍩", "🍔", "🍰", "🍓", "🥑", "🌮", "🍜", "🍦"],
  objects: ["⚽", "🎮", "🎵", "🚀", "⭐", "🌙", "🔥", "🌈", "💎", "🎯"],
  nature: ["🌸", "🌺", "🌻", "🌷", "🌹", "🍀", "🌿", "🌳", "🌊", "⛈️"]
};

// Flatten all emojis into one pool
const emojiPool = Object.values(EMOJI_POOLS).flat();

// Game State Management
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.sequence = [];
    this.playerIndex = 0;
    this.roundNumber = 0;
    this.displayMs = CONFIG.START_DISPLAY_MS;
    this.acceptingInput = false;
    this.hintsRemaining = CONFIG.MAX_HINTS;
    this.isPaused = false;
    this.isGameActive = false;
    this.soundEnabled = this.getSoundSetting();
    this.startTime = null;
    this.totalPlayTime = 0;
  }

  getSoundSetting() {
    return localStorage.getItem('emr_sound') !== 'false';
  }

  setSoundSetting(enabled) {
    localStorage.setItem('emr_sound', enabled.toString());
    this.soundEnabled = enabled;
  }
}

const gameState = new GameState();

// DOM Elements - Comprehensive reference
const DOM = {
  // Screens
  startScreen: document.getElementById('start-screen'),
  gameScreen: document.getElementById('game-screen'),
  gameoverScreen: document.getElementById('gameover-screen'),
  pauseScreen: document.getElementById('pause-screen'),
  instructionsScreen: document.getElementById('instructions-screen'),
  loadingScreen: document.getElementById('loading-screen'),

  // Start screen elements
  startBtn: document.getElementById('start-btn'),
  instructionsBtn: document.getElementById('instructions-btn'),
  backToStartBtn: document.getElementById('back-to-start-btn'),
  highscoreStart: document.getElementById('highscore-start'),
  gamesPlayed: document.getElementById('games-played'),

  // Game screen elements
  sequenceDisplay: document.getElementById('sequence-display'),
  grid: document.getElementById('grid'),
  roundNumberEl: document.getElementById('round-number'),
  highscoreGame: document.getElementById('highscore-game'),
  sequenceLength: document.getElementById('sequence-length'),
  gameStatus: document.getElementById('game-status'),
  progressFill: document.getElementById('progress-fill'),

  // Controls
  quitBtn: document.getElementById('quit-btn'),
  pauseBtn: document.getElementById('pause-btn'),
  resumeBtn: document.getElementById('resume-btn'),
  restartBtn: document.getElementById('restart-btn'),
  quitToMenuBtn: document.getElementById('quit-to-menu-btn'),
  hintBtn: document.getElementById('hint-btn'),
  hintCountEl: document.getElementById('hint-count'),
  soundToggle: document.getElementById('sound-toggle'),
  soundIcon: document.getElementById('sound-icon'),

  // Game over elements
  gameOverIcon: document.getElementById('game-over-icon'),
  gameOverTitle: document.getElementById('game-over-title'),
  finalScoreEl: document.getElementById('final-score'),
  finalHighEl: document.getElementById('final-highscore'),
  finalRound: document.getElementById('final-round'),
  achievement: document.getElementById('achievement'),
  replayBtn: document.getElementById('replay-btn'),
  homeBtn: document.getElementById('home-btn'),

  // Pause screen elements
  currentRound: document.getElementById('current-round'),
  hintsLeft: document.getElementById('hints-left'),

  // Loading elements
  loadingTip: document.getElementById('loading-tip')
};

// Enhanced Storage Management
class StorageManager {
  constructor() {
    this.keys = {
      highScore: 'emr_highscore',
      gamesPlayed: 'emr_games_played',
      totalPlayTime: 'emr_total_play_time',
      sound: 'emr_sound',
      lastPlayed: 'emr_last_played',
      achievements: 'emr_achievements'
    };
  }

  getHighScore() {
    return parseInt(localStorage.getItem(this.keys.highScore) || '0', 10);
  }

  setHighScore(score) {
    const current = this.getHighScore();
    if (score > current) {
      localStorage.setItem(this.keys.highScore, String(score));
      return true; // New high score
    }
    return false;
  }

  getGamesPlayed() {
    return parseInt(localStorage.getItem(this.keys.gamesPlayed) || '0', 10);
  }

  incrementGamesPlayed() {
    const current = this.getGamesPlayed();
    localStorage.setItem(this.keys.gamesPlayed, String(current + 1));
  }

  getTotalPlayTime() {
    return parseInt(localStorage.getItem(this.keys.totalPlayTime) || '0', 10);
  }

  addPlayTime(seconds) {
    const current = this.getTotalPlayTime();
    localStorage.setItem(this.keys.totalPlayTime, String(current + seconds));
  }

  updateLastPlayed() {
    localStorage.setItem(this.keys.lastPlayed, Date.now().toString());
  }
}

const storage = new StorageManager();

// Sound System
class SoundManager {
  constructor() {
    this.sounds = {};
    this.audioContext = null;
    this.enabled = gameState.soundEnabled;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  // Generate procedural sounds using Web Audio API
  playTone(frequency, duration = 0.1, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  playSuccess() {
    this.playTone(800, 0.15);
    setTimeout(() => this.playTone(1000, 0.15), 100);
  }

  playError() {
    this.playTone(200, 0.3, 'sawtooth');
  }

  playClick() {
    this.playTone(600, 0.05);
  }

  playSequence() {
    this.playTone(400, 0.1);
  }

  playHint() {
    this.playTone(1200, 0.2);
  }

  toggle() {
    this.enabled = !this.enabled;
    gameState.setSoundSetting(this.enabled);
    return this.enabled;
  }
}

const soundManager = new SoundManager();

// Enhanced Grid Management
class GridManager {
  constructor() {
    this.currentEmojis = [];
    this.animationDelay = 50; // ms between emoji animations
  }

  buildGrid() {
    if (!DOM.grid) return;

    DOM.grid.innerHTML = '';
    DOM.grid.setAttribute('aria-busy', 'true');

    // Create a balanced mix from different categories
    const shuffled = this.createBalancedEmojiSet();
    this.currentEmojis = shuffled;

    shuffled.forEach((emoji, idx) => {
      const btn = this.createEmojiButton(emoji, idx);
      DOM.grid.appendChild(btn);
    });

    // Remove busy state after animations complete
    setTimeout(() => {
      DOM.grid.setAttribute('aria-busy', 'false');
    }, shuffled.length * this.animationDelay + 200);
  }

  createBalancedEmojiSet() {
    const categories = Object.keys(EMOJI_POOLS);
    const emojisPerCategory = Math.ceil(CONFIG.GRID_SIZE / categories.length);
    let balanced = [];

    categories.forEach(category => {
      const pool = EMOJI_POOLS[category];
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      balanced.push(...shuffled.slice(0, emojisPerCategory));
    });

    return balanced.slice(0, CONFIG.GRID_SIZE).sort(() => Math.random() - 0.5);
  }

  createEmojiButton(emoji, index) {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.type = 'button';
    btn.dataset.emoji = emoji;
    btn.dataset.index = index;
    btn.innerHTML = emoji;
    btn.setAttribute('aria-label', `Emoji ${emoji}`);
    btn.setAttribute('role', 'gridcell');
    btn.style.animationDelay = `${index * this.animationDelay}ms`;

    btn.addEventListener('click', (e) => this.handleEmojiClick(e));
    btn.addEventListener('keydown', (e) => this.handleEmojiKeydown(e));

    return btn;
  }

  handleEmojiClick(e) {
    if (!gameState.acceptingInput || gameState.isPaused) return;

    const btn = e.currentTarget;
    const emoji = btn.dataset.emoji;

    // Visual feedback
    this.addClickFeedback(btn);
    soundManager.playClick();

    // Haptic feedback
    if (CONFIG.VIBRATION_ENABLED && navigator.vibrate) {
      navigator.vibrate(30);
    }

    gameLogic.processEmojiInput(emoji, btn);
  }

  handleEmojiKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleEmojiClick(e);
    }
  }

  addClickFeedback(btn) {
    btn.style.transform = 'scale(0.9)';
    btn.style.transition = 'transform 0.1s ease';

    setTimeout(() => {
      btn.style.transform = '';
      btn.style.transition = '';
    }, 100);
  }

  highlightCorrect(btn) {
    btn.classList.add('correct');
    btn.setAttribute('aria-label', `${btn.dataset.emoji} - Correct!`);
  }

  highlightWrong(btn) {
    btn.classList.add('wrong');
    btn.setAttribute('aria-label', `${btn.dataset.emoji} - Wrong!`);
  }

  resetHighlights() {
    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.classList.remove('correct', 'wrong', 'disabled');
      btn.setAttribute('aria-label', `Emoji ${btn.dataset.emoji}`);
    });
  }

  disableAll() {
    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.classList.add('disabled');
      btn.disabled = true;
    });
  }

  enableAll() {
    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.classList.remove('disabled');
      btn.disabled = false;
    });
  }
}

const gridManager = new GridManager();

// Enhanced Game Logic
class GameLogic {
  constructor() {
    this.loadingTips = [
      "💡 Focus on the center of the sequence display",
      "🧠 Try to create a story with the emojis",
      "⚡ The sequence gets faster each round",
      "🎯 Use hints strategically for high scores",
      "🔄 Patterns often repeat - look for them!",
      "👀 Don't just memorize - visualize the sequence",
      "🎮 Take breaks to keep your mind sharp"
    ];
  }

  async startGame() {
    try {
      // Show loading screen briefly
      this.showLoadingScreen();

      // Reset game state
      gameState.reset();
      gameState.isGameActive = true;
      gameState.startTime = Date.now();

      // Update storage
      storage.incrementGamesPlayed();
      storage.updateLastPlayed();

      // Initialize UI
      await this.initializeGameUI();

      // Start first round
      setTimeout(() => {
        this.nextRound();
      }, 800);

    } catch (error) {
      console.error('Failed to start game:', error);
      this.showError('Failed to start game. Please try again.');
    }
  }

  showLoadingScreen() {
    const randomTip = this.loadingTips[Math.floor(Math.random() * this.loadingTips.length)];
    if (DOM.loadingTip) DOM.loadingTip.textContent = randomTip;

    screenManager.showScreen('loading');

    setTimeout(() => {
      screenManager.showScreen('game');
    }, 1200);
  }

  async initializeGameUI() {
    gridManager.buildGrid();
    this.updateUI();
    this.updateHintUI();

    // Reset progress bar
    if (DOM.progressFill) DOM.progressFill.style.width = '0%';

    // Set initial game status
    if (DOM.gameStatus) DOM.gameStatus.textContent = 'Get ready for round 1...';
  }

  nextRound() {
    if (!gameState.isGameActive) return;

    gameState.roundNumber++;
    gameState.playerIndex = 0;

    // CRITICAL: Build grid FIRST, then generate sequence from available emojis
    gridManager.buildGrid();

    // Wait a moment for grid to be built, then generate sequence
    setTimeout(() => {
      // Generate new sequence using only emojis available in the grid
      gameState.sequence = this.generateSequence(gameState.roundNumber);

      // Update UI
      this.updateUI();
      this.updateProgress();

      // Show sequence
      this.showSequence().then(() => {
        if (gameState.isGameActive && !gameState.isPaused) {
          this.startPlayerInput();
        }
      });
    }, 100);

    // Decrease display time for next round
    gameState.displayMs = Math.max(
      CONFIG.MIN_DISPLAY_MS,
      gameState.displayMs - CONFIG.DISPLAY_DECREASE_MS
    );
  }

  generateSequence(length) {
    // CRITICAL: Only use emojis that are actually available in the current grid
    const availableEmojis = gridManager.currentEmojis;

    if (!availableEmojis || availableEmojis.length === 0) {
      console.error('No emojis available in grid!');
      return [];
    }

    const sequence = [];
    let lastEmoji = null;

    for (let i = 0; i < length; i++) {
      let emoji;
      let attempts = 0;

      do {
        emoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
        attempts++;
      } while (emoji === lastEmoji && attempts < 5);

      sequence.push(emoji);
      lastEmoji = emoji;
    }

    return sequence;
  }

  async showSequence() {
    if (!DOM.sequenceDisplay) return;

    gameState.acceptingInput = false;
    gridManager.disableAll();

    DOM.sequenceDisplay.innerHTML = '';
    DOM.sequenceDisplay.classList.add('active');
    DOM.sequenceDisplay.setAttribute('aria-live', 'polite');

    if (DOM.gameStatus) {
      DOM.gameStatus.textContent = `Watch the sequence of ${gameState.sequence.length} emojis...`;
    }

    // Create sequence display
    const sequenceContainer = document.createElement('div');
    sequenceContainer.className = 'sequence-container';

    gameState.sequence.forEach((emoji, index) => {
      const emojiEl = document.createElement('div');
      emojiEl.className = 'sequence-emoji';
      emojiEl.textContent = emoji;
      emojiEl.style.animation = `fadeHold ${gameState.displayMs}ms ease-in-out forwards`;
      emojiEl.style.animationDelay = `${index * 100}ms`;
      emojiEl.setAttribute('aria-label', `Sequence emoji ${index + 1}: ${emoji}`);
      sequenceContainer.appendChild(emojiEl);
    });

    DOM.sequenceDisplay.appendChild(sequenceContainer);
    soundManager.playSequence();

    // Wait for display duration
    return new Promise(resolve => {
      setTimeout(() => {
        DOM.sequenceDisplay.innerHTML = '<div class="sequence-placeholder">Now repeat the sequence!</div>';
        DOM.sequenceDisplay.classList.remove('active');
        resolve();
      }, gameState.displayMs + 200);
    });
  }

  startPlayerInput() {
    gameState.acceptingInput = true;
    gridManager.enableAll();
    gridManager.resetHighlights();

    if (DOM.gameStatus) {
      DOM.gameStatus.textContent = `Tap ${gameState.sequence.length} emojis in the correct order`;
    }
  }

  processEmojiInput(emoji, buttonElement) {
    if (!gameState.acceptingInput) return;

    const expected = gameState.sequence[gameState.playerIndex];

    if (emoji === expected) {
      this.handleCorrectInput(buttonElement);
    } else {
      this.handleWrongInput(buttonElement);
    }
  }

  handleCorrectInput(buttonElement) {
    gridManager.highlightCorrect(buttonElement);
    soundManager.playSuccess();

    gameState.playerIndex++;

    if (DOM.gameStatus) {
      const remaining = gameState.sequence.length - gameState.playerIndex;
      DOM.gameStatus.textContent = remaining > 0
        ? `Great! ${remaining} more to go...`
        : 'Perfect! Get ready for the next round...';
    }

    if (gameState.playerIndex >= gameState.sequence.length) {
      // Round completed
      this.completeRound();
    }
  }

  handleWrongInput(buttonElement) {
    gridManager.highlightWrong(buttonElement);
    soundManager.playError();

    if (CONFIG.VIBRATION_ENABLED && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    gameState.acceptingInput = false;

    if (DOM.gameStatus) {
      DOM.gameStatus.textContent = 'Wrong sequence! Game over.';
    }

    setTimeout(() => {
      this.endGame(false);
    }, 1500);
  }

  completeRound() {
    gameState.acceptingInput = false;

    // Celebrate correct sequence
    this.celebrateRound();

    // Update high score if needed
    const isNewHigh = storage.setHighScore(gameState.roundNumber);
    if (isNewHigh) {
      this.updateUI();
    }

    // Continue to next round
    setTimeout(() => {
      if (gameState.isGameActive && !gameState.isPaused) {
        this.nextRound();
      }
    }, 1500);
  }

  celebrateRound() {
    // Animate correct buttons
    const correctButtons = document.querySelectorAll('.emoji-btn.correct');
    correctButtons.forEach((btn, index) => {
      setTimeout(() => {
        btn.style.animation = 'correctPulse 0.6s ease-out';
      }, index * 100);
    });
  }

  pauseGame() {
    if (!gameState.isGameActive || gameState.isPaused) return;

    gameState.isPaused = true;
    gameState.acceptingInput = false;

    // Update pause screen stats
    if (DOM.currentRound) DOM.currentRound.textContent = gameState.roundNumber;
    if (DOM.hintsLeft) DOM.hintsLeft.textContent = gameState.hintsRemaining;

    screenManager.showScreen('pause');
  }

  resumeGame() {
    if (!gameState.isPaused) return;

    gameState.isPaused = false;
    screenManager.showScreen('game');

    // Resume input if we were in input phase
    if (gameState.playerIndex < gameState.sequence.length) {
      setTimeout(() => {
        gameState.acceptingInput = true;
      }, 300);
    }
  }

  useHint() {
    if (gameState.hintsRemaining <= 0 || !gameState.isGameActive) return;
    if (gameState.sequence.length === 0 || gameState.isPaused) return;

    gameState.hintsRemaining--;
    this.updateHintUI();

    soundManager.playHint();

    // Show sequence again with longer duration
    const hintDuration = Math.min(gameState.displayMs + 1200, 4000);
    const wasAcceptingInput = gameState.acceptingInput;

    gameState.acceptingInput = false;
    gridManager.disableAll();

    if (DOM.gameStatus) {
      DOM.gameStatus.textContent = 'Hint: Watch the sequence again...';
    }

    this.showSequenceForHint(hintDuration).then(() => {
      // Highlight next expected emoji
      this.highlightNextEmoji();

      if (wasAcceptingInput && gameState.isGameActive && !gameState.isPaused) {
        setTimeout(() => {
          gameState.acceptingInput = true;
          gridManager.enableAll();

          if (DOM.gameStatus) {
            DOM.gameStatus.textContent = `Continue the sequence (${gameState.playerIndex + 1}/${gameState.sequence.length})`;
          }
        }, 800);
      }
    });
  }

  async showSequenceForHint(duration) {
    if (!DOM.sequenceDisplay) return;

    DOM.sequenceDisplay.innerHTML = '';
    DOM.sequenceDisplay.classList.add('active');

    const sequenceContainer = document.createElement('div');
    sequenceContainer.className = 'sequence-container hint-sequence';

    gameState.sequence.forEach((emoji, index) => {
      const emojiEl = document.createElement('div');
      emojiEl.className = 'sequence-emoji';
      emojiEl.textContent = emoji;
      emojiEl.style.animation = `fadeHold ${duration}ms ease-in-out forwards`;
      emojiEl.style.animationDelay = `${index * 80}ms`;
      sequenceContainer.appendChild(emojiEl);
    });

    DOM.sequenceDisplay.appendChild(sequenceContainer);

    return new Promise(resolve => {
      setTimeout(() => {
        DOM.sequenceDisplay.innerHTML = '<div class="sequence-placeholder">Next emoji highlighted below</div>';
        DOM.sequenceDisplay.classList.remove('active');
        resolve();
      }, duration);
    });
  }

  highlightNextEmoji() {
    if (gameState.playerIndex >= gameState.sequence.length) return;

    const nextEmoji = gameState.sequence[gameState.playerIndex];
    const button = document.querySelector(`[data-emoji="${nextEmoji}"]`);

    if (button) {
      button.classList.add('hint-highlight');
      setTimeout(() => {
        button.classList.remove('hint-highlight');
      }, 2000);
    }
  }

  endGame(wasQuit = false) {
    gameState.isGameActive = false;
    gameState.acceptingInput = false;

    // Calculate final stats
    const finalScore = wasQuit ? Math.max(0, gameState.roundNumber - 1) : Math.max(0, gameState.roundNumber - 1);
    const playTime = gameState.startTime ? Math.floor((Date.now() - gameState.startTime) / 1000) : 0;

    // Update storage
    storage.addPlayTime(playTime);
    const isNewHigh = storage.setHighScore(finalScore);

    // Update game over screen
    this.updateGameOverScreen(finalScore, isNewHigh, wasQuit);

    screenManager.showScreen('gameover');
  }

  updateGameOverScreen(score, isNewHigh, wasQuit) {
    if (DOM.finalScoreEl) DOM.finalScoreEl.textContent = score;
    if (DOM.finalHighEl) DOM.finalHighEl.textContent = storage.getHighScore();
    if (DOM.finalRound) DOM.finalRound.textContent = gameState.roundNumber - 1;

    // Update game over message
    if (DOM.gameOverIcon && DOM.gameOverTitle) {
      if (isNewHigh && score > 0) {
        DOM.gameOverIcon.textContent = '🏆';
        DOM.gameOverTitle.textContent = 'New High Score!';
        if (DOM.achievement) DOM.achievement.style.display = 'block';
      } else if (wasQuit) {
        DOM.gameOverIcon.textContent = '👋';
        DOM.gameOverTitle.textContent = 'Game Quit';
      } else if (score === 0) {
        DOM.gameOverIcon.textContent = '😅';
        DOM.gameOverTitle.textContent = 'Try Again!';
      } else {
        DOM.gameOverIcon.textContent = '😵';
        DOM.gameOverTitle.textContent = 'Game Over';
      }
    }
  }

  updateUI() {
    if (DOM.roundNumberEl) DOM.roundNumberEl.textContent = gameState.roundNumber;
    if (DOM.highscoreStart) DOM.highscoreStart.textContent = storage.getHighScore();
    if (DOM.highscoreGame) DOM.highscoreGame.textContent = storage.getHighScore();
    if (DOM.gamesPlayed) DOM.gamesPlayed.textContent = storage.getGamesPlayed();
    if (DOM.sequenceLength) DOM.sequenceLength.textContent = gameState.sequence.length;
  }

  updateProgress() {
    if (!DOM.progressFill) return;

    const maxRounds = 15; // Show progress up to round 15
    const progress = Math.min((gameState.roundNumber / maxRounds) * 100, 100);
    DOM.progressFill.style.width = `${progress}%`;
  }

  updateHintUI() {
    if (DOM.hintCountEl) DOM.hintCountEl.textContent = gameState.hintsRemaining;

    if (DOM.hintBtn) {
      if (gameState.hintsRemaining <= 0) {
        DOM.hintBtn.classList.add('disabled');
        DOM.hintBtn.disabled = true;
        DOM.hintBtn.setAttribute('aria-label', 'No hints remaining');
      } else {
        DOM.hintBtn.classList.remove('disabled');
        DOM.hintBtn.disabled = false;
        DOM.hintBtn.setAttribute('aria-label', `Use hint (${gameState.hintsRemaining} remaining)`);
      }
    }
  }

  showError(message) {
    console.error(message);
    // Could implement a toast notification system here
  }
}

const gameLogic = new GameLogic();

// Screen Management
class ScreenManager {
  constructor() {
    this.currentScreen = 'start';
    this.transitionDuration = 300;
  }

  showScreen(screenName) {
    const screens = {
      start: DOM.startScreen,
      game: DOM.gameScreen,
      gameover: DOM.gameoverScreen,
      pause: DOM.pauseScreen,
      instructions: DOM.instructionsScreen,
      loading: DOM.loadingScreen
    };

    // Hide all screens
    Object.values(screens).forEach(screen => {
      if (screen) {
        screen.classList.add('hidden');
        screen.setAttribute('aria-hidden', 'true');
      }
    });

    // Show target screen
    const targetScreen = screens[screenName];
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      targetScreen.setAttribute('aria-hidden', 'false');

      // Focus management for accessibility
      this.manageFocus(screenName);
    }

    this.currentScreen = screenName;
  }

  manageFocus(screenName) {
    // Focus appropriate element for keyboard navigation
    setTimeout(() => {
      switch (screenName) {
        case 'start':
          DOM.startBtn?.focus();
          break;
        case 'game':
          // Focus first emoji button when game starts
          document.querySelector('.emoji-btn')?.focus();
          break;
        case 'gameover':
          DOM.replayBtn?.focus();
          break;
        case 'pause':
          DOM.resumeBtn?.focus();
          break;
        case 'instructions':
          DOM.backToStartBtn?.focus();
          break;
      }
    }, 100);
  }
}

const screenManager = new ScreenManager();

// Keyboard Controls
class KeyboardManager {
  constructor() {
    this.setupKeyboardListeners();
  }

  setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      // Prevent default for game keys
      if (['Space', 'KeyM', 'KeyH', 'KeyP', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'Space':
          this.handleSpaceKey();
          break;
        case 'KeyM':
          this.toggleSound();
          break;
        case 'KeyH':
          this.useHint();
          break;
        case 'KeyP':
          this.togglePause();
          break;
        case 'Escape':
          this.handleEscape();
          break;
        case 'KeyR':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.restartGame();
          }
          break;
      }
    });
  }

  handleSpaceKey() {
    switch (screenManager.currentScreen) {
      case 'start':
        gameLogic.startGame();
        break;
      case 'game':
        if (!gameState.isPaused) {
          gameLogic.pauseGame();
        }
        break;
      case 'pause':
        gameLogic.resumeGame();
        break;
      case 'gameover':
        gameLogic.startGame();
        break;
    }
  }

  toggleSound() {
    const enabled = soundManager.toggle();
    this.updateSoundIcon(enabled);
  }

  updateSoundIcon(enabled) {
    if (DOM.soundIcon) {
      DOM.soundIcon.textContent = enabled ? '🔊' : '🔇';
    }
    if (DOM.soundToggle) {
      DOM.soundToggle.setAttribute('aria-label', enabled ? 'Mute sound (M)' : 'Unmute sound (M)');
    }
  }

  useHint() {
    if (screenManager.currentScreen === 'game' && !gameState.isPaused) {
      gameLogic.useHint();
    }
  }

  togglePause() {
    if (screenManager.currentScreen === 'game') {
      if (gameState.isPaused) {
        gameLogic.resumeGame();
      } else {
        gameLogic.pauseGame();
      }
    }
  }

  handleEscape() {
    switch (screenManager.currentScreen) {
      case 'game':
        gameLogic.pauseGame();
        break;
      case 'pause':
        gameLogic.resumeGame();
        break;
      case 'instructions':
        screenManager.showScreen('start');
        break;
    }
  }

  restartGame() {
    if (screenManager.currentScreen === 'game' || screenManager.currentScreen === 'pause') {
      gameLogic.startGame();
    }
  }
}

const keyboardManager = new KeyboardManager();

// Event Listeners Setup
function setupEventListeners() {
  // Start screen
  DOM.startBtn?.addEventListener('click', () => gameLogic.startGame());
  DOM.instructionsBtn?.addEventListener('click', () => screenManager.showScreen('instructions'));
  DOM.backToStartBtn?.addEventListener('click', () => screenManager.showScreen('start'));

  // Game controls
  DOM.pauseBtn?.addEventListener('click', () => gameLogic.pauseGame());
  DOM.hintBtn?.addEventListener('click', () => gameLogic.useHint());
  DOM.quitBtn?.addEventListener('click', () => gameLogic.endGame(true));

  // Pause screen
  DOM.resumeBtn?.addEventListener('click', () => gameLogic.resumeGame());
  DOM.restartBtn?.addEventListener('click', () => gameLogic.startGame());
  DOM.quitToMenuBtn?.addEventListener('click', () => screenManager.showScreen('start'));

  // Game over screen
  DOM.replayBtn?.addEventListener('click', () => gameLogic.startGame());
  DOM.homeBtn?.addEventListener('click', () => screenManager.showScreen('start'));

  // Sound toggle
  DOM.soundToggle?.addEventListener('click', () => {
    const enabled = soundManager.toggle();
    keyboardManager.updateSoundIcon(enabled);
  });

  // Prevent context menu on long press (mobile)
  document.addEventListener('contextmenu', (e) => {
    if (e.target.classList.contains('emoji-btn')) {
      e.preventDefault();
    }
  });

  // Handle visibility change (pause when tab is hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState.isGameActive && !gameState.isPaused) {
      gameLogic.pauseGame();
    }
  });

  // Handle window resize
  window.addEventListener('resize', debounce(() => {
    // Rebuild grid if needed for responsive changes
    if (screenManager.currentScreen === 'game') {
      gridManager.buildGrid();
    }
  }, 250));
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Performance monitoring (optional - for development)
class PerformanceMonitor {
  constructor() {
    this.enabled = false; // Set to true for development
    this.metrics = {
      gameStartTime: 0,
      roundStartTime: 0,
      inputLatency: []
    };
  }

  startGame() {
    if (!this.enabled) return;
    this.metrics.gameStartTime = performance.now();
  }

  startRound() {
    if (!this.enabled) return;
    this.metrics.roundStartTime = performance.now();
  }

  recordInputLatency(latency) {
    if (!this.enabled) return;
    this.metrics.inputLatency.push(latency);

    // Keep only last 10 measurements
    if (this.metrics.inputLatency.length > 10) {
      this.metrics.inputLatency.shift();
    }
  }

  getAverageLatency() {
    if (!this.enabled || this.metrics.inputLatency.length === 0) return 0;

    const sum = this.metrics.inputLatency.reduce((a, b) => a + b, 0);
    return sum / this.metrics.inputLatency.length;
  }

  logMetrics() {
    if (!this.enabled) return;

    console.log('Performance Metrics:', {
      averageInputLatency: this.getAverageLatency().toFixed(2) + 'ms',
      totalInputs: this.metrics.inputLatency.length
    });
  }
}

const performanceMonitor = new PerformanceMonitor();

// Initialize Application
function init() {
  try {
    // Setup all event listeners
    setupEventListeners();

    // Initialize UI
    gameLogic.updateUI();
    gameLogic.updateHintUI();

    // Initialize sound icon
    keyboardManager.updateSoundIcon(gameState.soundEnabled);

    // Build initial grid
    gridManager.buildGrid();

    // Show start screen
    screenManager.showScreen('start');

    // Preload any resources if needed
    preloadResources();

    console.log('Emoji Memory Rush initialized successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

function preloadResources() {
  // Preload sounds by creating audio context
  if (soundManager.audioContext && soundManager.audioContext.state === 'suspended') {
    // Audio context will be resumed on first user interaction
    document.addEventListener('click', () => {
      soundManager.audioContext.resume();
    }, { once: true });
  }
}

// Error handling and reporting
window.addEventListener('error', (event) => {
  console.error('Game Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });

  // Could send to analytics service here
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  event.preventDefault();
});

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for potential external integrations (CrazyGames SDK, etc.)
window.EmojiMemoryRush = {
  version: '2.0.0',
  gameState,
  gameLogic,
  soundManager,
  screenManager,
  storage
};