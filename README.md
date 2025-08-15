# Emoji Memory Rush

A minimal, futuristic memory game — no backend, pure HTML/CSS/JS.

Play the sequence, repeat it by tapping emojis in the same order. The sequence grows each round and the display time shortens. Hints available.

- Tech: `index.html`, `styles.css`, `script.js` (vanilla web)
- High score stored in `localStorage`

Quick start

1. Open `index.html` in your browser (double-click or serve with a static server).
2. Click **Start Game**.
3. Watch the emoji sequence and repeat it by clicking/tapping the emojis.

Controls & UI

- `Use Hint` — replay the sequence a little longer and highlight the next emoji (limited uses).
- `Quit` — end the game and view your final score.

Gameplay rules

- Each round: a new random sequence appears (length = round number).
- All sequence emojis show simultaneously for a short duration (decreases each round).
- A wrong tap ends the game; your best score is saved.

Quick tweaks

Open `script.js` and modify the top constants to change difficulty and hints:

- `START_DISPLAY_MS` — initial display time in ms
- `DISPLAY_DECREASE_MS` — how much the display time shrinks each round
- `MIN_DISPLAY_MS` — minimum display time allowed
- `MAX_HINTS` — number of hints granted per game

License & credits

Made with ❤️ and emojis. Feel free to reuse or tweak. MIT License.
