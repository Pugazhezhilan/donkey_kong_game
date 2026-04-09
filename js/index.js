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

let score = 0
let levelDone = false
let gemsImage = null
let magnetImage = null;
let lastTime = 0
const player = new Player({x: 100, y: 100, size:32, velocity:{x: 0, y: 0}})
const enemies = []
enemies.push(new Enemy({x: 300, y: 200}))
enemies.push(new Enemy({x: 500, y: 150}))
enemies.push(new Enemy({x: 700, y: 100}))
let frog;
let eagle;

const magnets = [];
magnets.push(new Magnet({x: 450, y:200, duration: 8, radius: 160}));
magnets.push(new Magnet({x: 780, y:120, duration: 6, radius: 130}));

const door = new Door({x: 900, y: 400})
const checkpoints = []
checkpoints.push(new CheckPoint({x: 200, y: 350}))
checkpoints.push(new CheckPoint({x: 600, y: 250}))
checkpoints.push(new CheckPoint({x: 850, y: 400}))

let currentCheckpoint = { x: 100, y: 100 }

const keys = {w:{pressed:false}, a:{pressed:false}, d: {pressed:false}, s:{pressed: false}}

const audioSettings = {
  musicEnabled: localStorage.getItem('music_enabled') != '0',
  musicVolume: Number(localStorage.getItem('music_volume') ?? '0.35'),
  sfxEnabled: localStorage.getItem('sfx_enabled') != '0',
  sfxVolume: Number(localStorage.getItem('sfx_volume') ?? '0.8'),
}

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

const gems = []
const makeGemsFromLayer = (gemsLayer) => {
  gems.length = 0

  for (let y = 0; y < gemsLayer.length; y++) {
    for (let x = 0; x < gemsLayer[y].length; x++) {
      const symbol = gemsLayer[y][x]
      if (symbol !== 0) {
        let pts = 10
        if (symbol == 5) pts = 20
        if (symbol == 9) pts = 50
        gems.push(
          new Gem({
            x: x * 16,
            y: y * 16,
            size: 16,
            symbol: symbol,
            points: pts,
          }),
        )
      }
    }
  }
}
makeGemsFromLayer(l_Gems)

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

function drawHud(ctx){
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(8,8,220,54)
  ctx.fillStyle = 'white'
  ctx.font = '16px monospace';
  ctx.fillText('SCORE: '+score, 16, 30)
  const full = player.health;
  const max = player.maxHealth
  let hearts = ''
  for(let i=0;i<max;i++){
    hearts += i < full ? '♥' : '♡'
  }
  ctx.fillStyle = 'red';
  ctx.font = '18px monospace'
  ctx.fillText(hearts, 130, 30);
  if(player.magnetActive){
    ctx.fillStyle = "#ff66ff";
    ctx.font = '12px monospace';
    ctx.fillText('MAGNET: '+ player.magnetTimeLeft.toFixed(1) + 's', 16, 50);
  }
  ctx.restore();
}

function drawLevelComplete(ctx){
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.65)'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  ctx.fillStyle = 'yellow'
  ctx.font = '48px monospace'
  ctx.fillText('LEVEL COMPLETED!!!', 240, 250)
  ctx.font = '20px monospace'
  ctx.fillStyle = 'white'
  ctx.fillText('(Press R to restart) || (just refresh page lol!)', 285, 310)
  ctx.restore()
}

function tryCollectGems(deltaTime){
  if (levelDone){
    return;
  }

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
        window.__sound?.play('gem',{volume:0.7,rate:1});
        console.log('Collected gem +' + got)
      }
    }
  }

  let left = 0
  for (let i = 0; i < gems.length; i++){
    if (!gems[i].collected) left++
  }
  if (gems.length > 0 && left === 0) {
    levelDone = true
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
        player.health -= 1
        window.__sound?.play('hurt',{volume:0.9});
        player.velocity.y = -120
        player.invincible = true
        player.invincibleTime = 1

        if(player.health <= 0){
          score = 0;
          player.health = player.maxHealth;
          player.x = currentCheckpoint.x;
          player.y = currentCheckpoint.y;
          player.velocity.x = 0;
          player.velocity.y = 0;
          console.log('respawned at checkpoint');
        }
      }
    }
  }
}

function hurtPlayer(){
  if(player.invincible)return;
  player.health -= 1;
  window.__sound?.play('hurt',{volume: 0.9})
  player.velocity.y = -120
  player.invincible = true
  player.invincibleTime = 1

  if(player.health <= 0){
    score = 0;
    player.health = player.maxHealth;
    player.x = currentCheckpoint.x;
    player.y = currentCheckpoint.y;
    player.velocity.x = 0;
    player.velocity.y = 0;
    console.log('respawned at checkpoint');
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
    window.__sound?.play('door',{volume:0.8});
    levelDone = true
  }
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
      window.__sound?.play('powerup',{volume:0.8});
    }
  }
}

function animate(){
  const currentTime = performance.now()
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 1 / 30)
  lastTime = currentTime

  if(!levelDone && !paused){
    player.handleInput(keys);
    checkMagnetPickup();
    player.update(deltaTime, collisionBlocks, platforms);
    if(player.magnetActive){
      player.magnetTimeLeft = (player.magnetTimeLeft ?? 0) - deltaTime;
      if(player.magnetTimeLeft <= 0){
        player.magnetActive = false;
        player.magnetTimeLeft = 0;
      }
    }
    frog.update(deltaTime, collisionBlocks);
    eagle.update(deltaTime);

    for(let i=0;i<enemies.length;i++){
      enemies[i].update(deltaTime, collisionBlocks);
    }

    for(let i=enemies.length-1;i>=0;i--){
      if(enemies[i].dead)enemies.splice(i,1);
    }

    tryCollectGems(deltaTime);
    checkEnemyHit();
    checkAnimalHazards();
    checkCheckpointTouch();
    checkDoor();
  }
  else{
    player.velocity.x = 0;
    player.velocity.y = 0;
  }

  if (typeof cameraUpdate === 'function'){
    cameraUpdate(deltaTime, player)
  } else {
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

  c.save()
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  c.save()
  c.translate(-camera.x, -camera.y)

  if (backgroundCanvas){
    c.drawImage(backgroundCanvas, 0, 0);
  }

  door.draw(c)
  for(let m of magnets){
    m.draw(c);
  }
  for (let i = 0; i < gems.length; i++){
    gems[i].draw(c, gemsImage, 16)
  }
  for (let i = 0; i < enemies.length; i++){
    enemies[i].draw(c, deltaTime)
  }
  
  eagle.draw(c, deltaTime)
  frog.draw(c, deltaTime);
  player.draw(c, deltaTime)
  c.restore()

  drawHud(c)
  if (levelDone) drawLevelComplete(c)
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
    magnetImage = await loadImage('./images/magnet.png');

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