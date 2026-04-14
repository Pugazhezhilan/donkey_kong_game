console.log("index.js loaded");
const bgm = new Audio('./music/bg-music/platformer_level03_loop.mp3')
bgm.preload = "auto"
const sound = new window.Sound();
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const GAME_WIDTH = 1024
const GAME_HEIGHT = 576
const TILE_SIZE = 16
const TS = 16
const px = (t) => {
  return t*TS;
}

let tx = 20
let ty = 30

if(window.__GAME_ALREADY_STARTED__){
  console.warn('index.js loaded more than once (ignoring)')
}
else{
  window.__GAME_ALREADY_STARTED__ = true;
}

function resizeCanvas(){
  const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  canvas.style.width = GAME_WIDTH*scale + "px";
  canvas.style.height = GAME_HEIGHT*scale + "px";
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

canvas.addEventListener('click', (e) => {
  if(typeof camera === 'undefined'){
    return
  }
  const rect = canvas.getBoundingClientRect()
  const sx = (e.clientX - rect.left)*(GAME_WIDTH / rect.width);
  const sy = (e.clientY - rect.top)*(GAME_HEIGHT / rect.height);
  const worldX = Math.floor(sx + camera.x);
  const worldY = Math.floor(sy + camera.y);
  tx = Math.floor(worldX/16)
  ty = Math.floor(worldY/16);
  console.log('tile:', Math.floor(worldX/16), Math.floor(worldY/16), 'world:', worldX, worldY);
})

const setCanvasSize = () => {
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  c.imageSmoothingEnabled = false;
}

setCanvasSize()
canvas.setAttribute('tabindex', '0');
canvas.focus();
canvas.addEventListener('click',() => canvas.focus());
window.addEventListener('click',() => canvas.focus());

const layersData = {
  l_Sky_Ocean:l_Sky_Ocean,
  l_Bramble:l_Bramble,
  l_Back_Tiles:l_Back_Tiles,
  l_Front_Tiles:l_Front_Tiles,
  l_Decorations:l_Decorations,
  l_Front_Tiles_2:l_Front_Tiles_2,
  l_Gems: l_Gems,
  l_Collisions:l_Collisions,
}

async function initAudio(){
  await sound.load('jump','./music/sfx/jump.mp3');
  await sound.load('land','./music/sfx/land.mp3');
  await sound.load('gem','./music/sfx/gem.mp3');
  await sound.load('hurt','./music/sfx/hurt.mp3');
  await sound.load('stomp','./music/sfx/stomp.mp3');
  await sound.load('checkpoint','./music/sfx/checkpoint.mp3');
  await sound.load('door','./music/sfx/door.mp3');
}
initAudio();

const tilesets = {
  l_Sky_Ocean: {imageUrl: './images/decorations.png', tileSize: 16},
  l_Bramble: {imageUrl: './images/decorations.png', tileSize: 16},
  l_Back_Tiles:{imageUrl: './images/tileset.png', tileSize: 16},
  l_Front_Tiles:{imageUrl: './images/tileset.png', tileSize: 16},
  l_Decorations: {imageUrl: './images/decorations.png', tileSize: 16},
  l_Front_Tiles_2:{imageUrl: './images/tileset.png', tileSize: 16},
  l_Gems: {imageUrl: './images/decorations.png', tileSize: 16},
  l_Collisions: {imageUrl: './images/decorations.png', tileSize: 16},
}

const blockSize = TILE_SIZE
const WORLD_WIDTH = collisions[0].length *blockSize
const WORLD_HEIGHT = collisions.length * blockSize
const LOOP_RENDER_MARGIN = 80

let hudToastText = '';
let hudToastTimeLeft = 0;
let hudToastCooldown = 0;

function showHudToast(text, seconds=1.2){
  hudToastText = text;
  hudToastTimeLeft = seconds;
}

function applyDifficultyIncrease(){
  const maxEnemies = Math.min(3+level,10);

  spawnEnemies(maxEnemies);
  snapEnemiesToGround(enemies);

  const enemySpeed = 40+level*25;
  for(let i=0;i<enemies.length;i++){
    enemies[i].velocity.x = enemySpeed;
  }

  if(frog){
    frog.moveSpeed = 40+level*12;
    frog.jumpInterval = Math.max(1.6-level*0.12,0.45);
    frog.jumpPower = 220+level*10;
  }

  if(eagle){
    eagle.speed = 40+level*14;
  }

  showHudToast("LEVEL "+ level + " ↑ DIFFICULTY", 1.5)
}

let score = 0
let level = 1;
let nextLevelScore = 100;
let levelDone = false
let laps = 0
let gemsImage = null
let lastTime = 0

let wasOnGroundLastFrame = false;
let fallStartY = null;
let peakFallDistance = 0;
let framesInAir = 0;

const player = new Player({x: 100, y: 100, size:32, velocity:{x: 0, y: 0}})
const enemies = []
const ENEMY_SPAWNS = [
  {x: 300, y: 200},
  {x: 500, y: 150},
  {x: 700, y: 100},
]
const previewEnemies = ENEMY_SPAWNS.map((spawn) => new Enemy(spawn))
const spawnEnemies = (targetCount = ENEMY_SPAWNS.length) => {
  while (enemies.length < targetCount) {
    const spawn = ENEMY_SPAWNS[Math.floor(Math.random() * ENEMY_SPAWNS.length)];
    enemies.push(new Enemy({
      x: spawn.x + Math.random() * 220,
      y: spawn.y
    }));
  }
  if(enemies.length > targetCount){
    enemies.length = targetCount;
  }

  for(let i = 0; i < enemies.length; i++){
    const spawn = ENEMY_SPAWNS[i % ENEMY_SPAWNS.length];
    const enemy = enemies[i];

    enemy.x = spawn.x + (i >= ENEMY_SPAWNS.length ? Math.random() * 220 : 0);
    enemy.y = spawn.y;
    enemy.velocity.x = 40;
    enemy.velocity.y = 0;
    enemy.isOnGround = false;
    enemy.dead = false;
    enemy.currentFrame = 0;
    enemy.elapsedTime = 0;
  }
};
spawnEnemies()
let frog;
let eagle;
const magnets = [];
const MAGNET_SPAWNS = [
  {x: 450, y:200, duration: 8, radius: 160},
  {x: 780, y:120, duration: 6, radius: 130},
]
const spawnMagnets = () => {
  for (let i = 0; i < MAGNET_SPAWNS.length; i++) {
    const spawn = MAGNET_SPAWNS[i]
    const magnet = magnets[i]
    if (!magnet){
      magnets.push(new Magnet(spawn))
      continue
    }
    magnet.x = spawn.x
    magnet.y = spawn.y
    magnet.size = spawn.size ?? magnet.size
    magnet.duration = spawn.duration
    magnet.radius = spawn.radius
    magnet.collected = false
  }
  if (magnets.length > MAGNET_SPAWNS.length){
    magnets.length = MAGNET_SPAWNS.length
  }
}
spawnMagnets()

const HEAL_DISTANCE_PER_HEART = px(120);
let lastDamageWorldX = null;
let distanceSinceDamage = 0;
let lastHealTrackWorldX = null;

const sneakers = [];
const SNEAKERS_SPAWNS = [
  {x: 185, y: 145, size: 32, duration: 10, jumpMultiplier: 1.6},
  {x: 1065, y: 175, size: 32, duration: 8, jumpMultiplier: 1.15},
];

const spawnSneakers = () => {
  for(let i=0;i<SNEAKERS_SPAWNS.length;i++){
    const spawn = SNEAKERS_SPAWNS[i];
    const s = sneakers[i];

    if(!s){
      sneakers.push(new SuperSneakers(spawn));
      continue;
    }

    s.x = spawn.x;
    s.y = spawn.y;
    s._baseY = spawn.y;
    s.size = spawn.size ?? s.size;
    s.duration = spawn.duration ?? s.duration;
    s.jumpMultiplier = spawn.jumpMultiplier ?? s.jumpMultiplier;
    s.collected = false;
    s._t = 0;
  }

  if(sneakers.length > SNEAKERS_SPAWNS.length){
    sneakers.length = SNEAKERS_SPAWNS.length;
  }
}
spawnSneakers();

function applyLandingShakeFromFallDistance(fallDistancePx){
  const minFall = 34;
  const maxFall = 220;

  if(fallDistancePx < minFall){
    return;
  }

  const clamped = Math.min(maxFall, Math.max(minFall, fallDistancePx));
  const t = (clamped-minFall) / (maxFall-minFall);

  const strength = 2+t*10;
  const duration = 0.10 + t*0.14;

  if(typeof window.cameraShakeImpulse == 'function'){
    window.cameraShakeImpulse(strength, duration);
  }
}

function applyDamageShake(){
  const healthRatio = player.maxHealth > 0 ? (player.health/player.maxHealth) : 1;
  const danger = 1-Math.max(0,Math.min(1,healthRatio));

  const strength = 10+danger*8;
  const duration = 0.16+danger*0.10;

  if(typeof window.cameraShakeImpulse === 'function'){
    window.cameraShakeImpulse(strength, duration);
  }
}


const door = new Door({x: 900, y: 400})
let doorUsedThisLap = false
const checkpoints = []
const CHECKPOINT_SPAWNS = [{x: 200, y: 350},{x: 600, y: 250},{x: 850, y: 400}]
const spawnCheckpoints = () => {
  for (let i = 0; i < CHECKPOINT_SPAWNS.length; i++) {
    const spawn = CHECKPOINT_SPAWNS[i]
    const checkpoint = checkpoints[i]
    if (!checkpoint){
      checkpoints.push(new CheckPoint(spawn))
      continue
    }
    checkpoint.x = spawn.x
    checkpoint.y = spawn.y
    checkpoint.activated = false
  }
  if (checkpoints.length > CHECKPOINT_SPAWNS.length){
    checkpoints.length = CHECKPOINT_SPAWNS.length
  }
}
spawnCheckpoints()

let currentCheckpoint = { x: 100, y: 100 }

const keys = {
  w:{pressed:false}, 
  a:{pressed:false}, 
  d: {pressed:false},
  s:{pressed: false}
}

const audioSettings = {
  musicEnabled: localStorage.getItem('music_enabled') != '0',
  musicVolume: Number(localStorage.getItem('music_volume') ?? '0.35'),
  sfxEnabled: localStorage.getItem('sfx_enabled') != '0',
  sfxVolume: Number(localStorage.getItem('sfx_volume') ?? '0.8'),
};

let gameOver = false;
const gameOverOverlay = document.getElementById('gameover-overlay');
const goScoreEl = document.getElementById('go-score');
const goMaxScoreEl = document.getElementById('go-maxscore');
const btnPlayAgain = document.getElementById('btnPlayAgain');
const btnQuit = document.getElementById('btnQuit');

const getMaxScore = () => Number(localStorage.getItem('max_score') ?? 0);
const setMaxScore = (v) => localStorage.setItem('max_score', String(v));

const showGameOver = () => {
  gameOver = true;
  paused = true;
  bgm.pause();

  const max = Math.max(getMaxScore(), score);
  setMaxScore(max);
  
  if(goScoreEl){
    goScoreEl.textContent = String(score);
  }
  if(goMaxScoreEl){
    goMaxScoreEl.textContent = String(max);
  }
  
  if(gameOverOverlay){
    gameOverOverlay.style.display = 'flex';
  }
}

const hideGameOver = () => {
  gameOver = false;
  if(gameOverOverlay){
    gameOverOverlay.style.display = 'none';
  }
}

btnPlayAgain?.addEventListener('click',()=>{
  sessionStorage.setItem('autostart_game', '1')
  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.set('autostart', '1')
  window.location.href = nextUrl.toString()
})

btnQuit?.addEventListener('click', () => {
  window.location.href = 'index.html';
})

bgm.loop=true
bgm.volume=audioSettings.musicVolume;
sound.masterVolume = audioSettings.sfxEnabled ? audioSettings.sfxVolume : 0
const musicBtn = document.getElementById('musicToggle');
const musicSlider = document.getElementById('musicVol');
const sfxBtn = document.getElementById('sfxToggle')
const sfxSlider = document.getElementById('sfxVol')

if(musicSlider){
  musicSlider.value = String(audioSettings.musicVolume)
}
if(sfxSlider){
  sfxSlider.value = String(audioSettings.sfxVolume);
}

const updateAudioUI = () => {
  if(musicBtn){
    musicBtn.textContent = audioSettings.musicEnabled ? 'Music: ON' : 'Music: OFF'
  }
  if(musicSlider){
    musicSlider.disabled = !audioSettings.musicEnabled
  }
  if(sfxBtn){
    sfxBtn.textContent = audioSettings.sfxEnabled ? 'SFX: ON':'SFX: OFF'
  }
  if(sfxSlider){
    sfxSlider.disabled = !audioSettings.sfxEnabled
  }
}

const applyAudio = async () => {
  bgm.volume = audioSettings.musicVolume;
  if(!audioSettings.musicEnabled){
    bgm.pause();
    bgm.currentTime = 0;
  }
  else if(sound?.unlocked){
    try{
      await bgm.play();
    }
    catch(error){
      console.log("BGM ERROR:", error);
    }
  }
  sound.masterVolume = audioSettings.sfxEnabled ? audioSettings.sfxVolume : 0
}

if(musicBtn){
  musicBtn.addEventListener('click', async () => {
    audioSettings.musicEnabled = !audioSettings.musicEnabled
    localStorage.setItem('music_enabled', audioSettings.musicEnabled ? '1' : '0')
    updateAudioUI()
    await applyAudio()
  })
}

if(musicSlider){
  musicSlider.addEventListener('input', async (e) => {
    audioSettings.musicVolume = Number(e.target.value);
    localStorage.setItem('music_volume', String(audioSettings.musicVolume));
    await applyAudio();
  })
}

if(sfxBtn){
  sfxBtn.addEventListener('click', () => {
    audioSettings.sfxEnabled = !audioSettings.sfxEnabled
    localStorage.setItem('sfx_enabled', audioSettings.sfxEnabled ? '1' : '0');
    updateAudioUI();
    applyAudio();
  })
}

if(sfxSlider){
  sfxSlider.addEventListener('input', (e) => {
    audioSettings.sfxVolume = Number(e.target.value);
    localStorage.setItem('sfx_volume',String(audioSettings.sfxVolume))
    applyAudio()
  })
}

updateAudioUI();
applyAudio();

let paused = false;
const pauseBtn = document.getElementById('pauseToggle');
const pauseOverlay = document.getElementById('pause-overlay');
const setPaused = (value) => {
  paused = value;
  if(pauseBtn){
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  }
  if(pauseOverlay){
    pauseOverlay.style.display = paused ? 'flex' : 'none';
  }
  if(paused){
    bgm.pause();
  }
  else{
    applyAudio();
  }
};

const togglePaused = () => {
  setPaused(!paused);
}

if(pauseBtn){
  pauseBtn.addEventListener('click',togglePaused);
}

window.addEventListener('keydown',(e)=>{
  if(e.key === 'p' || e.key === 'P'){
    togglePaused();
  }
})

function startDistanceHealTracking(){
  lastDamageWorldX = player.x + (laps * WORLD_WIDTH);
  lastHealTrackWorldX = lastDamageWorldX;
  distanceSinceDamage = 0;
}

function updateDistanceHeal(){
  if(paused || gameOver){
    return;
  }
  if(player.health >= player.maxHealth){
    return;
  }
  if(lastDamageWorldX == null){
    return;
  }
  if(player.invincible){
    return;
  }

  const worldX = player.x + (laps*WORLD_WIDTH);
  const dx = Math.abs(worldX-lastHealTrackWorldX);
  distanceSinceDamage += dx;
  lastHealTrackWorldX = worldX;

  if(distanceSinceDamage >= HEAL_DISTANCE_PER_HEART){
    player.health = Math.min(player.maxHealth, player.health+1);
    if(hudToastCooldown <= 0){
      showHudToast('HEART RESTORED!', 1.2);
      hudToastCooldown = 1.2;
    }
    window.__sound?.play('checkpoint',{volume: 0.55, rate: 1.6});
    distanceSinceDamage -= HEAL_DISTANCE_PER_HEART;

    if(player.health >= player.maxHealth){
      lastDamageWorldX = null;
      lastHealTrackWorldX = null;
      distanceSinceDamage = 0;
    }
  }
}

const unlockOnce = async() => {
  await sound.unlock();
  await applyAudio();

  window.removeEventListener('keydown',unlockOnce);
  window.removeEventListener('mousedown',unlockOnce);
  window.removeEventListener('touchstart',unlockOnce);
  document.body.removeEventListener('click', unlockOnce)
}
window.addEventListener('keydown',unlockOnce);
window.addEventListener('mousedown',unlockOnce);
window.addEventListener('touchstart',unlockOnce);
document.body.addEventListener("click",unlockOnce);
window.__sound = sound;

const collisionBlocks = []
const platforms = []

collisions.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 1) {
      collisionBlocks.push(
        new CollisionBlock({
          x: x * blockSize,
          y: y * blockSize,
          size: blockSize,
        }),
      )
    } else if (symbol === 2) {
      platforms.push(
        new Platform({
          x: x * blockSize,
          y: y * blockSize,
          width: 16,
          height: 4,
        }),
      )
    }
  })
})

const collisionBlocksLoop = collisionBlocks.map((block) => {
  return new CollisionBlock({
    x: block.x + WORLD_WIDTH,
    y: block.y,
    size: block.width,
  })
})
const platformsLoop = platforms.map((platform) => {
  return new Platform({
    x: platform.x + WORLD_WIDTH,
    y: platform.y,
    width: platform.width,
    height: platform.height,
  })
})
const collisionBlocksWrapped = collisionBlocks.concat(collisionBlocksLoop)
const platformsWrapped = platforms.concat(platformsLoop)

const frogX = WORLD_WIDTH - 340;
eagle = new Eagle({x: px(40), y:px(11), minY: px(9), maxY: px(13)});
frog = new Frog({x: frogX, y: 120, width: 32, height: 32, minX: frogX-80, maxX: frogX+30, moveSpeed: 40, jumpInterval: 1.6, jumpPower: 220, idleFrames: 4, jumpFrames: 3, frameInterval: 0.1})
placeOnGroundTopLeft(frog, collisionBlocks)

function placeOnGroundTopLeft(entity,blocks){
  const bottom = entity.y+entity.height;
  const candidates = blocks.filter(b => entity.x+entity.width>b.x && entity.x < b.x + b.width && b.y >= bottom).sort((a,b)=>a.y-b.y)
  if(candidates.length > 0){
    entity.y = candidates[0].y - entity.height;
    if(entity.velocity)entity.velocity.y = 0;
    entity.isOnGround = true;
    return true
  }
  return false
}

function snapEnemiesToGround(enemyList){
  for (let i = 0; i < enemyList.length; i++){
    const enemy = enemyList[i]
    placeOnGroundTopLeft(enemy, collisionBlocks)
    enemy.velocity.y = 0
    enemy.isOnGround = true
  }
}

snapEnemiesToGround(enemies)
snapEnemiesToGround(previewEnemies)

const gems = []
const gemSpawns = []
const cacheGemSpawnsFromLayer = (gemsLayer) => {
  gemSpawns.length = 0
  for (let y = 0; y < gemsLayer.length; y++) {
    for (let x = 0; x < gemsLayer[y].length; x++) {
      const symbol = gemsLayer[y][x]
      if (symbol !== 0) {
        let pts = 10
        if (symbol == 5) pts = 20
        if (symbol == 9) pts = 50
        gemSpawns.push({
          x: x * 16,
          y: y * 16,
          size: 16,
          symbol: symbol,
          points: pts,
        })
      }
    }
  }
}

const resetGems = () => {
  for (let i = 0; i < gemSpawns.length; i++) {
    const spawn = gemSpawns[i]
    const gem = gems[i]
    if (!gem){
      gems.push(new Gem(spawn))
      continue
    }
    gem.x = spawn.x
    gem.y = spawn.y
    gem.width = spawn.size
    gem.height = spawn.size
    gem.symbol = spawn.symbol
    gem.points = spawn.points
    gem.collected = false
    gem.floatTime = Math.random() * Math.PI * 2
  }
  if (gems.length > gemSpawns.length){
    gems.length = gemSpawns.length
  }
}

cacheGemSpawnsFromLayer(l_Gems)
resetGems()

const renderLayer = (tilesData, tilesetImage, tileSize, context) => {
  const tilesPerRow = Math.ceil(tilesetImage.width / tileSize)

  tilesData.forEach((row, y) => {
    row.forEach((symbol, x) => {
      if (symbol !== 0) {
        const tileIndex = symbol - 1
        const srcX = (tileIndex % tilesPerRow) * tileSize
        const srcY = Math.floor(tileIndex / tilesPerRow) * tileSize
        context.drawImage(tilesetImage,srcX,srcY,tileSize,tileSize,x*16,y*16,16,16)
      }
    })
  })
}

const renderStaticLayers = async () => {
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = WORLD_WIDTH
  offscreenCanvas.height = WORLD_HEIGHT
  const offscreenContext = offscreenCanvas.getContext('2d')
  offscreenContext.imageSmoothingEnabled = false;

  for (const [layerName, tilesData] of Object.entries(layersData)){
    if (layerName === 'l_Gems'){
      continue
    }

    const tilesetInfo = tilesets[layerName]
    if (!tilesetInfo){ 
      continue
    }

    try{
      const tilesetImage = await loadImage(tilesetInfo.imageUrl)
      renderLayer(tilesData, tilesetImage, tilesetInfo.tileSize, offscreenContext)
    } catch (error){
      console.error(`Failed to load image for layer ${layerName}:`, error)
    }
  }

  offscreenContext.imageSmoothingEnabled = false;

  return offscreenCanvas
}

if (typeof cameraSetWorldSizeFromLayer === 'function'){
  cameraSetWorldSizeFromLayer(l_Back_Tiles)
}

function drawOutlinedText(ctx, text, x, y, fillColor, strokeColor, lineWidth){
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeColor
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text,x,y);
  ctx.restore();
}

function drawHud(ctx){
  const x = 12
  const y = 12
  const padX =8
  const padY = 8
  const rowH = 14
  const gap = 2
  const panelW = 200
  const labelX = x + padX
  const valueRightX = x + panelW - padX
  const full = player.health;
  const max = player.maxHealth

  let hearts = ''
  for (let i = 0; i < max; i++){
    hearts += i < full ? '♥' : '♡';
  }

  const magText = player.magnetActive ? player.magnetTimeLeft.toFixed(1) + 's' : 'OFF'
  const snkText = player.superSneakersActive ? player.superSneakersTimeLeft.toFixed(1) + 's' : 'OFF'
  const panelH = padY * 2 + rowH * 5 + gap * 4

  ctx.save()
  ctx.globalAlpha = 1
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(0,0,0,0.70)'
  ctx.fillRect(x, y, panelW, panelH)
  ctx.strokeStyle = 'rgba(255,220,100,0.40)'
  ctx.lineWidth = 2
  ctx.strokeRect(x + 1, y + 1, panelW - 2, panelH - 2)

  let cy = y + padY + rowH / 2
  ctx.font = '9px "Press Start 2P", monospace'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'
  ctx.fillText('SCORE', labelX, cy)
  ctx.fillStyle = '#ffe066'
  ctx.textAlign = 'right'
  ctx.fillText(String(score), valueRightX, cy)

  cy += rowH + gap
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'
  ctx.fillText('LEVEL', labelX, cy)

  ctx.fillStyle = '#7CFF7C'
  ctx.textAlign = 'right'
  ctx.fillText(String(level), valueRightX, cy)
  cy += rowH + gap
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'
  ctx.fillText('LIFE', labelX, cy)

  ctx.font = '16px monospace'
  ctx.textAlign = 'right'
  drawOutlinedText(ctx, hearts, valueRightX, cy, '#ff4444', 'rgba(0,0,0,0.85)', 4)

  cy += rowH + gap
  ctx.font = '8px "Press Start 2P", monospace'
  ctx.fillStyle = '#ff66ff'
  ctx.textAlign = 'left'
  ctx.fillText('MAGNET', labelX, cy)

  ctx.fillStyle = '#ffe066'
  ctx.textAlign = 'right'
  ctx.fillText(magText, valueRightX, cy)

  cy += rowH + gap

  ctx.fillStyle = '#00e5ff'
  ctx.textAlign = 'left'
  ctx.fillText('SNEAKERS', labelX, cy)
  ctx.fillStyle = '#ffe066'
  ctx.textAlign = 'right'
  ctx.fillText(snkText, valueRightX, cy)

  if(hudToastTimeLeft > 0 && hudToastText){
    const alpha = Math.min(1, hudToastTimeLeft / 0.25)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = '12px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const msgX = GAME_WIDTH / 2
    const msgY = 40

    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(msgX - 170, msgY - 14, 340, 28)
    drawOutlinedText(ctx, hudToastText, msgX, msgY, '#7CFF7C', 'rgba(0,0,0,0.9)', 4)
    ctx.restore()
  }
  ctx.restore()
}

function drawLevelComplete(ctx){
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.65)'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  ctx.fillStyle = 'yellow';
  ctx.font = '48px monospace'
  ctx.fillText('LEVEL COMPLETED!!!', 240, 250)
  ctx.font = '20px monospace'
  ctx.fillStyle = 'white'
  ctx.fillText('(Press R to restart) || (just refresh page lol!)', 285, 310)
  ctx.restore()
}

function tryCollectGems(deltaTime){
  const pb = player.getHitBounds()
  const playerCenterX = player.x + player.width/2;
  const playerCenterY = player.y + player.height/2;
  for (let i = 0; i < gems.length; i++){
    const g = gems[i]
    g.update(deltaTime)

    if (g.collected){
      continue
    }
    if(player.magnetActive){
      const gx = g.x + g.width/2;
      const gy = g.y + g.height/2;
      const dx = playerCenterX - gx;
      const dy = playerCenterY - gy;
      const dist = Math.hypot(dx,dy);

      const radius = player.magnetRadius ?? 0;
      if(dist < radius){
        const pullSpeed = 260;
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        g.x += nx*pullSpeed*deltaTime;
        g.y += ny*pullSpeed*deltaTime;
      }
    }

    const gb = g.getBounds()
    if (rectsTouching(pb, gb)){
      const got = g.collect()
      if(got > 0){
        score += got
        if(score >= nextLevelScore){
          level++;
          nextLevelScore += 120 + level*20;
          showHudToast('LEVEL '+ level, 1.2)

          applyDifficultyIncrease();
        }
        window.__sound?.play('gem',{volume:0.7,rate:1});
        console.log('Collected gem +' + got)
      }
    }
  }

}

function checkEnemyHit(){
  const pb = player.getHitBounds()
  for (let i = 0;i < enemies.length;i++){
    const e = enemies[i]
    if (e.dead) continue
    const eb = e.getBounds()
    if (rectsTouching(pb, eb)){
      if (player.velocity.y > 0 && player.y + player.height - 5 < e.y){
        e.dead = true
        window.__sound?.play('stomp',{volume:0.8})
        player.velocity.y = -150
        score = score + 30
      } else {
        if (player.invincible) return
        player.health -= 1;
        applyDamageShake();
        startDistanceHealTracking();
        window.__sound?.play('hurt',{volume:0.9});
        player.velocity.y = -120
        player.invincible = true
        player.invincibleTime = 1

        if(player.health <= 0){
          showGameOver();
          return;
        }
      }
    }
  }
}

function hurtPlayer(){
  if(player.invincible)return;
  player.health -= 1;
  applyDamageShake();
  startDistanceHealTracking();
  window.__sound?.play('hurt',{volume: 0.9})
  player.velocity.y = -120
  player.invincible = true
  player.invincibleTime = 1

  if(player.health <= 0){
    showGameOver();
    return;
  }
}

function checkAnimalHazards(){
  const pb = player.getHitBounds();
  if(eagle && !eagle.dead){
    if(rectsTouching(pb,eagle.getBounds())){
      hurtPlayer();
    }
  }
  if(frog && !frog.dead){
    if(rectsTouching(pb, frog.getBounds())){
      hurtPlayer();
    }
  }
}

function checkDoor(){
  const pb = player.getHitBounds()
  const db = door.getBounds()

  if (rectsTouching(pb, db)){
    const anyLeft = gems.some((g) => !g.collected)
    if (anyLeft) return
    if(!doorUsedThisLap){
      doorUsedThisLap = true
      score += 100
      window.__sound?.play('door',{volume:0.8});
    }
  }
}

function resetLapState(){
  resetGems()

  const targetEnemyCount = Math.min(3+level, 10);
  spawnEnemies(targetEnemyCount);
  snapEnemiesToGround(enemies)
  
  for (let i = 0; i < previewEnemies.length; i++) {
    const spawn = ENEMY_SPAWNS[i]
    const enemy = previewEnemies[i]
    enemy.x = spawn.x
    enemy.y = spawn.y
    enemy.velocity.x = 40
    enemy.velocity.y = 0
    enemy.isOnGround = false
    enemy.dead = false
    enemy.currentFrame = 0
    enemy.elapsedTime = 0
  }
  snapEnemiesToGround(previewEnemies)
  spawnMagnets()
  spawnCheckpoints()
  spawnSneakers();
  doorUsedThisLap = false

  const frogX = WORLD_WIDTH - 340
  if (!eagle){
    eagle = new Eagle({x: px(40), y:px(11), minY: px(9), maxY: px(13)})
  }
  else{
    eagle.x = px(40)
    eagle.y = px(11)
    eagle.minY = px(9)
    eagle.maxY = px(13)
    eagle.flyDir = 1
    eagle.dead = false
    eagle.currentFrame = 0
    eagle.elapsedTime = 0
  }

  if (!frog){
    frog = new Frog({
      x: frogX, 
      y: 120, 
      width: 32, 
      height: 32, 
      minX: frogX-80, 
      maxX: frogX+30, 
      moveSpeed: 40, 
      jumpInterval: 1.6, 
      jumpPower: 220, 
      idleFrames: 4, 
      jumpFrames: 3, 
      frameInterval: 0.1
    })
  }
  else{
    frog.x = frogX
    frog.y = 120
    frog.minX = frogX - 80
    frog.maxX = frogX + 30
    frog.dir = 1
    frog.dead = false
    frog.isOnGround = false
    frog.velocity.x = 0
    frog.velocity.y = 0
    frog.jumpTimer = 0
    frog.currentFrame = 0
    frog.elapsedTime = 0
    frog.lastInAir = null
  }
  placeOnGroundTopLeft(frog, collisionBlocks)

  currentCheckpoint.x = 100
  currentCheckpoint.y = 100
}

function checkEndOfWorldLoop(){
  if(typeof camera === 'undefined'){
    return
  }
  if(camera.x < WORLD_WIDTH){
    return
  }

  const hitboxOffsetX = player.hitbox.x - player.x
  player.x -= WORLD_WIDTH
  player.hitbox.x = player.x + hitboxOffsetX

  if(typeof camera !== 'undefined'){
    camera.x = Math.max(0, camera.x - WORLD_WIDTH)
  }
  laps += 1
  resetLapState()
}

function checkCheckpointTouch(){
  const pb = player.getHitBounds()
  for (let i = 0; i < checkpoints.length; i++){
    const cp = checkpoints[i]
    const cb = cp.getBounds()
    if (rectsTouching(pb, cb)){
      if (!cp.activated) {
        console.log('checkpoint reached')
        cp.activated = true
        currentCheckpoint.x = cp.x
        currentCheckpoint.y = cp.y
        window.__sound?.play('checkpoint',{volume:0.8})
      }
    }
  }
}

let backgroundCanvas = null

function checkMagnetPickup(){
  const pb = player.getHitBounds();
  for(let i=0;i<magnets.length;i++){
    let m = magnets[i];
    if(m.collected)continue;
    if(rectsTouching(pb, m.getBounds())){
      m.collect(player);
      window.__sound?.play('checkpoint',{volume:0.6, rate:1.2});
    }
  }
}

function checkSneakersPickup(){
  const pb = player.getHitBounds();
  for(let i=0;i<sneakers.length;i++){
    const s = sneakers[i];
    if(s.collected) continue;
    if(rectsTouching(pb, s.getBounds())){
      s.collect(player);
      window.__sound?.play('checkpoint',{volume:0.6, rate: 1.35});
    }
  }
}

function animate(){
  const currentTime = performance.now()
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 1 / 30)
  lastTime = currentTime
  hudToastCooldown = Math.max(0, hudToastCooldown-deltaTime);
  if(hudToastTimeLeft > 0){
    hudToastTimeLeft = Math.max(0, hudToastTimeLeft - deltaTime);
    if(hudToastTimeLeft === 0){
      hudToastText = '';
    }
  }

    if(!paused && !gameOver){
    player.handleInput(keys);
    checkMagnetPickup();
    checkSneakersPickup();

    const nearLoopSeam = player.x >= WORLD_WIDTH - GAME_WIDTH;
    const activeCollisionBlocks = nearLoopSeam ? collisionBlocksWrapped : collisionBlocks;
    const activePlatforms = nearLoopSeam ? platformsWrapped : platforms;

    // Capture vertical speed BEFORE update() resolves collisions.
    const vyBeforeUpdate = player.velocity ? player.velocity.y : 0;

    player.update(deltaTime, activeCollisionBlocks, activePlatforms);

    // Landing detection AFTER update (isOnGround is now correct)
    const onGroundNow = !!player.isOnGround;

    if(!onGroundNow){
      framesInAir++;

      if(wasOnGroundLastFrame){
        fallStartY = player.y;
        peakFallDistance = 0;
      }
      if(fallStartY != null){
        peakFallDistance = Math.max(peakFallDistance, player.y - fallStartY);
      }
    }
    else{
      if(!wasOnGroundLastFrame){
        const wasReallyAirborne = framesInAir >= 2;

        if(wasReallyAirborne){
          applyLandingShakeFromFallDistance(peakFallDistance);

          const t = Math.min(1, peakFallDistance / 200);
          window.__sound?.play('land', {
            volume: 0.6 + t * 0.25,
            rate: 1.0 - t * 0.12
          });
        }

        fallStartY = null;
        peakFallDistance = 0;
        framesInAir = 0;
      }
      else{
        framesInAir = 0;
      }
    }

    wasOnGroundLastFrame = onGroundNow;

    frog.update(deltaTime, collisionBlocks);
    eagle.update(deltaTime);

    for(let i=0;i<enemies.length;i++){
      enemies[i].update(deltaTime, collisionBlocks);
    }
    for(let i=0;i<previewEnemies.length;i++){
      previewEnemies[i].update(deltaTime, collisionBlocks);
    }

    for(let i=enemies.length-1;i>=0;i--){
      if(enemies[i].dead) enemies.splice(i, 1);
    }

    tryCollectGems(deltaTime);
    checkEnemyHit();
    checkAnimalHazards();
    checkCheckpointTouch();
    checkDoor();
    updateDistanceHeal();
  }
  else{
    player.velocity.x = 0;
    player.velocity.y = 0;
  }

  if (typeof cameraUpdate === 'function'){
    cameraUpdate(deltaTime, player)
  } 
  else{
    if (player.x > SCROLL_POST_RIGHT){
      const scrollPostDistance = player.x - SCROLL_POST_RIGHT
      camera.x = Math.max(0, Math.min(scrollPostDistance, WORLD_WIDTH - GAME_WIDTH))
    }

    if (player.y < SCROLL_POST_TOP && camera.y < 0){
      const scrollPostDistance = SCROLL_POST_TOP - player.y
      camera.y = Math.min(camera.y + scrollPostDistance, 0)
    }

    if (player.y > SCROLL_POST_BOTTOM){
      const scrollPostDistance = player.y - SCROLL_POST_BOTTOM
      camera.y = Math.max(
        -WORLD_HEIGHT + GAME_HEIGHT,
        Math.min(-scrollPostDistance, 0),
      )
    }
  }

  if(!paused && !gameOver){
    checkEndOfWorldLoop()
  }

  c.save()
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  c.save()
  const shake = (typeof window.cameraGetShakeOffset == 'function') ? window.cameraGetShakeOffset(deltaTime) : {x:0, y: 0};
  c.translate(-camera.x + shake.x, -camera.y + shake.y);

  const drawWorldAtOffset = (offsetX, animated) => {
    c.save()
    c.translate(offsetX, 0)

    if (backgroundCanvas){
      c.drawImage(backgroundCanvas, 0, 0)
    }

    const useLoopPreview = offsetX === WORLD_WIDTH
    door.draw(c)
    if(useLoopPreview){
      const img = window.__magnetImage
      for(let i = 0; i < MAGNET_SPAWNS.length; i++){
        const spawn = MAGNET_SPAWNS[i]
        const size = spawn.size ?? 16
        if(img){
          c.drawImage(img, spawn.x, spawn.y, size, size)
        }
        else{
          c.fillStyle = '#ff4df8'
          c.fillRect(spawn.x, spawn.y, size, size)
        }
      }
    }
    else{
      for(let m of magnets){
        m.draw(c)
      }
    }
    if(useLoopPreview){
      const img = window.__sneakersImage;
      for(let i=0;i<SNEAKERS_SPAWNS.length;i++){
        const spawn = SNEAKERS_SPAWNS[i];
        const size = spawn.size ?? 16;
        if(img){
          c.drawImage(img, spawn.x, spawn.y, size, size);
        }
        else{
          c.fillStyle = '#00e5ff';
          c.fillRect(spawn.x, spawn.y, size, size);
        }
      }
    }
    else{
      for(const s of sneakers){
        s.update(animated ? deltaTime : 0);
        s.draw(c);
      }
    }
    for (let i = 0; i < gems.length; i++){
      gems[i].draw(c, gemsImage, 16)
    }
    if(useLoopPreview){
      for (let i = 0; i < previewEnemies.length; i++){
        previewEnemies[i].draw(c, deltaTime)
      }
    }
    else{
      for (let i = 0; i < enemies.length; i++){
        enemies[i].draw(c, animated ? deltaTime : 0)
      }
    }
    eagle.draw(c, animated ? deltaTime : 0)
    frog.draw(c, animated ? deltaTime : 0)

    c.restore()
  }

  drawWorldAtOffset(0, true)
  const shouldDrawRightCopy = camera.x + GAME_WIDTH >= WORLD_WIDTH - LOOP_RENDER_MARGIN
  if(shouldDrawRightCopy){
    drawWorldAtOffset(WORLD_WIDTH, false)
  }

  player.draw(c, deltaTime)
  c.restore()
  drawHud(c)
  c.restore()
  requestAnimationFrame(animate)
}

const startRendering = async () =>{
  try {
    backgroundCanvas = await renderStaticLayers()
    if(!backgroundCanvas) {
      console.error('Failed to create the background canvas')
      return
    }
    gemsImage = await loadImage('./images/decorations.png')
    window.__magnetImage = await loadImage('./images/magnet.png');
    window.__sneakersImage = await loadImage('./images/sneakers.png');
    lastTime = performance.now()
    requestAnimationFrame(animate)
  } catch (error) {
    console.error('Error during rendering:', error)
  }
}

window.addEventListener('resize', async () => {
  setCanvasSize()
  backgroundCanvas = await renderStaticLayers()
})

window.startGameRendering = () => {
  if(window.__RENDERING_STARTED__)return;
  window.__RENDERING_STARTED__ = true;
  startRendering();
};
document.addEventListener('keydown',(e) => {
  if(e.code == 'KeyR'){
    e.preventDefault();
    window.location.reload();
  }
}, true)