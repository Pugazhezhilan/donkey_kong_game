# Donkey kong run - Endless Platformer

Donkey kong run is a pixel-art 2D platformer built with vanilla JavaScript and HTML5 canvas.
It supports a seamless world-loop system so the run can continue infinitely.

## Features

- Smooth camera follow and side-scrolling platformer movement
- Jump, enemy collisions, health, checkpoints, magnets, and collectibles
- Sound controls (music and SFX toggle + volume)
- Pause and game-over overlays
- Seamless end-to-start background looping for infinite running

## Tech Stack

- HTML5 canvas
- JavaScript (no framework)
- Sprite/tile based map layers

## Project Structure

- index.html: Main page and overlays
- js/index.js: Core game loop, rendering, and state
- js/camera.js: Camera behavior
- js/eventListeners.js: Input handling
- classes/: Entities like Player, Enemy, Eagle, Frog, Magnet, etc.
- data/: Tile/layer/collision map data
- images/: Sprites and tilesets
- music/: BGM and SFX files

## How To Run

1. Open this folder in VS Code.
2. Use a local static server (recommended: Live Server extension).
3. Start the server at the project root.
4. Open index.html in the browser.

You can also open index.html directly, but browser autoplay/security policies may affect audio.

## Controls

- Move Left: A or Left Arrow
- Move Right: D or Right Arrow
- Jump: W, Up Arrow, or Space
- Pause/Resume: P or Pause button
- Restart page: R

## Gameplay Notes

- Collect gems to increase score.
- Avoid enemies/hazards to preserve lives.
- Magnets pull nearby gems for a short time.
- When the player reaches the world end, the scene loops smoothly to support endless play.

## Customization Ideas

- Add lap-based difficulty scaling (faster enemies each loop)
- Add more enemy spawn patterns
- Add a high-score + laps leaderboard
- Add mobile touch controls

