const bgm = new Audio('./music/bg-music/platformer_level03_loop.mp3')
bgm.preload = "auto"
const sound = new window.Sound();
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const GAME_WIDTH = 1024
const GAME_HEIGHT = 576
const TILE_SIZE = 16

let dpr = window.devicePixelRatio || 1
const setCanvasSize = () => {
  dpr = window.devicePixelRatio || 1
  canvas.width = GAME_WIDTH * dpr
  canvas.height = GAME_HEIGHT * dpr
}
setCanvasSize()
const layersData = {
  l_Sky_Ocean: l_Sky_Ocean,
  l_Bramble: l_Bramble,
  l_Back_Tiles: l_Back_Tiles,
  l_Front_Tiles: l_Front_Tiles,
  l_Decorations: l_Decorations,
  l_Front_Tiles_2: l_Front_Tiles_2,
  l_Gems: l_Gems,
  l_Collisions: l_Collisions,
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
  l_Back_Tiles: {imageUrl: './images/tileset.png', tileSize: 16},
  l_Front_Tiles: {imageUrl: './images/tileset.png', tileSize: 16},
  l_Decorations: {imageUrl: './images/decorations.png', tileSize: 16},
  l_Front_Tiles_2: {imageUrl: './images/tileset.png', tileSize: 16},
  l_Gems: {imageUrl: './images/decorations.png', tileSize: 16},
  l_Collisions: {imageUrl: './images/decorations.png', tileSize: 16},
}

const blockSize = TILE_SIZE
const WORLD_WIDTH = collisions[0].length * blockSize
const WORLD_HEIGHT = collisions.length * blockSize

let score = 0
let levelDone = false
let gemsImage = null
let lastTime = 0

const player = new Player({x: 100, y: 100, size: 32, velocity: {x: 0, y: 0}})

const enemies = []
enemies.push(new Enemy({x: 300, y: 200}))
enemies.push(new Enemy({x: 500, y: 150}))
enemies.push(new Enemy({x: 700, y: 100}))

const door = new Door({ x: 900, y: 400 })

const checkpoints = []
checkpoints.push(new CheckPoint({x: 200, y: 350}))
checkpoints.push(new CheckPoint({x: 600, y: 250}))
checkpoints.push(new CheckPoint({x: 850, y: 400}))

let currentCheckpoint = { x: 100, y: 100 }

const keys = {w: {pressed: false}, a: {pressed: false}, d: {pressed: false}, s: {pressed: false}}

bgm.loop=true
bgm.volume=0.35
const unlockOnce = async() => {
  await sound.unlock();
  try{
    bgm.play().then(()=>{
      console.log("BGM PLAYING")
    }).catch(err => {
      console.log("BGM ERROR:", err);
    })
  }
  catch(error){
    console.log(error);
  }

  window.removeEventListener('keydown', unlockOnce);
  window.removeEventListener('mousedown', unlockOnce);
  window.removeEventListener('touchstart', unlockOnce);
  document.body.removeEventListener("click",unlockOnce);
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

        context.drawImage(
          tilesetImage,
          srcX,
          srcY,
          tileSize,
          tileSize,
          x * 16,
          y * 16,
          16,
          16,
        )
      }
    })
  })
}

const renderStaticLayers = async () => {
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = WORLD_WIDTH
  offscreenCanvas.height = WORLD_HEIGHT
  const offscreenContext = offscreenCanvas.getContext('2d')

  for (const [layerName, tilesData] of Object.entries(layersData)) {
    if (layerName === 'l_Gems') continue

    const tilesetInfo = tilesets[layerName]
    if (!tilesetInfo) continue

    try {
      const tilesetImage = await loadImage(tilesetInfo.imageUrl)
      renderLayer(tilesData, tilesetImage, tilesetInfo.tileSize, offscreenContext)
    } catch (error) {
      console.error(`Failed to load image for layer ${layerName}:`, error)
    }
  }

  return offscreenCanvas
}

if (typeof cameraSetWorldSizeFromLayer === 'function') {
  cameraSetWorldSizeFromLayer(l_Back_Tiles)
}

function drawHud(ctx) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(8, 8, 170, 28)

  ctx.fillStyle = 'white'
  ctx.font = '16px monospace'
  ctx.fillText('SCORE: ' + score, 16, 28)
  ctx.restore()
}

function drawLevelComplete(ctx) {
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

function tryCollectGems(deltaTime) {
  if (levelDone) return

  const pb = player.getHitBounds()

  for (let i = 0; i < gems.length; i++) {
    const g = gems[i]
    g.update(deltaTime)

    if (g.collected) continue

    const gb = g.getBounds()
    if (rectsTouching(pb, gb)) {
      const got = g.collect()
      if(got > 0){
        score += got
        window.__sound?.play('gem',{volume:0.7,rate:1});
        console.log('Collected gem +' + got)
      }
    }
  }

  let left = 0
  for (let i = 0; i < gems.length; i++) {
    if (!gems[i].collected) left++
  }

  if (gems.length > 0 && left === 0) {
    levelDone = true
  }
}

function checkEnemyHit() {
  const pb = player.getHitBounds()

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]
    if (e.dead) continue

    const eb = e.getBounds()
    if (rectsTouching(pb, eb)) {
      // stomp
      if (player.velocity.y > 0 && player.y + player.height - 5 < e.y) {
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

        if (player.health <= 0) {
          player.health = player.maxHealth
          player.x = currentCheckpoint.x
          player.y = currentCheckpoint.y
          player.velocity.x = 0
          player.velocity.y = 0
          console.log('respawned at checkpoint')
        }
      }
    }
  }
}

function checkDoor() {
  const pb = player.getHitBounds()
  const db = door.getBounds()

  if (rectsTouching(pb, db)) {
    const anyLeft = gems.some((g) => !g.collected)
    if (anyLeft) return
    window.__sound?.play('door',{volume:0.8});
    levelDone = true
  }
}

function checkCheckpointTouch() {
  const pb = player.getHitBounds()

  for (let i = 0; i < checkpoints.length; i++) {
    const cp = checkpoints[i]
    const cb = cp.getBounds()

    if (rectsTouching(pb, cb)) {
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

function animate() {
  const currentTime = performance.now()
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 1 / 30)
  lastTime = currentTime

  if (!levelDone) {
    player.handleInput(keys)
    player.update(deltaTime, collisionBlocks, platforms)

    for (let i = 0; i < enemies.length; i++) {
      enemies[i].update(deltaTime, collisionBlocks)
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].dead) enemies.splice(i, 1)
    }
  } else {
    player.velocity.x = 0
    player.velocity.y = 0
  }

  if (typeof cameraUpdate === 'function') {
    cameraUpdate(deltaTime, player)
  } else {
    if (player.x > SCROLL_POST_RIGHT) {
      const scrollPostDistance = player.x - SCROLL_POST_RIGHT
      camera.x = Math.max(0, Math.min(scrollPostDistance, WORLD_WIDTH - GAME_WIDTH))
    }

    if (player.y < SCROLL_POST_TOP && camera.y < 0) {
      const scrollPostDistance = SCROLL_POST_TOP - player.y
      camera.y = Math.min(camera.y + scrollPostDistance, 0)
    }

    if (player.y > SCROLL_POST_BOTTOM) {
      const scrollPostDistance = player.y - SCROLL_POST_BOTTOM
      camera.y = Math.max(
        -WORLD_HEIGHT + GAME_HEIGHT,
        Math.min(-scrollPostDistance, 0),
      )
    }
  }

  tryCollectGems(deltaTime)
  checkEnemyHit()
  checkCheckpointTouch()
  checkDoor()
  c.save()
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  c.save()
  c.translate(-camera.x, -camera.y)

  if (backgroundCanvas) c.drawImage(backgroundCanvas, 0, 0)

  door.draw(c)

  for (let i = 0; i < gems.length; i++) {
    gems[i].draw(c, gemsImage, 16)
  }

  for (let i = 0; i < enemies.length; i++) {
    enemies[i].draw(c, deltaTime)
  }

  player.draw(c, deltaTime)
  c.restore()

  drawHud(c)
  if (levelDone) drawLevelComplete(c)

  c.restore()

  requestAnimationFrame(animate)
}

const startRendering = async () => {
  try {
    backgroundCanvas = await renderStaticLayers()
    if (!backgroundCanvas) {
      console.error('Failed to create the background canvas')
      return
    }

    gemsImage = await loadImage('./images/decorations.png')

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

startRendering()