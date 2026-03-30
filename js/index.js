const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const dpr = window.devicePixelRatio || 1

canvas.width = 1024 * dpr
canvas.height = 576 * dpr

let score = 0;
let levelDone = false;
let gemsImage = null;
let lastTime = performance.now()

const barrels = []
setInterval(() => {
  if(!levelDone){
    barrels.push(new Barrel({x: 32, y: 64, direction: 1}))
  }
},5000);

const fires = [];
setInterval(() => {
  if(!levelDone){
    fires.push(new Fire({x: 40, y: 68, direction: 1}))
  }
},7000)

const layersData = {
   l_Sky_Ocean: l_Sky_Ocean,
   l_Bramble: l_Bramble,
   l_Back_Tiles: l_Back_Tiles,
   l_Front_Tiles: l_Front_Tiles,
   l_Decorations: l_Decorations,
   l_Front_Tiles_2: l_Front_Tiles_2,
   l_Gems: l_Gems,
   l_Collisions: l_Collisions,
};

const tilesets = {
  l_Sky_Ocean: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Bramble: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Back_Tiles: { imageUrl: './images/tileset.png', tileSize: 16 },
  l_Front_Tiles: { imageUrl: './images/tileset.png', tileSize: 16 },
  l_Decorations: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Front_Tiles_2: { imageUrl: './images/tileset.png', tileSize: 16 },
  l_Gems: { imageUrl: './images/decorations.png', tileSize: 16 },
  l_Collisions: { imageUrl: './images/decorations.png', tileSize: 16 },
};

const collisionBlocks = []
const platforms = []
const blockSize = 16 
const ladders = []
window.ladders = ladders;

const enemies = []
enemies.push(new Enemy({x: 300, y: 200}))
enemies.push(new Enemy({x: 500, y: 150}))
enemies.push(new Enemy({x: 700, y: 100}))
const door = new Door({x:900,y:400});

const checkpoints = []
checkpoints.push(new CheckPoint({x: 200, y: 350}))
checkpoints.push(new CheckPoint({x: 600, y: 250}))
checkpoints.push(new CheckPoint({x: 850, y: 400}));

collisions.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 1){
      collisionBlocks.push(
        new CollisionBlock({
          x: x * blockSize,
          y: y * blockSize,
          size: blockSize,
        }),
      )
    }
    else if(symbol == 2){
      platforms.push(
        new Platform({
          x: x * blockSize,
          y: y * blockSize,
          width: 16,
          height: 4,
        }),
      )
    }
    else if(symbol == 3){
      ladders.push({
        x: x*blockSize,
        y: y*blockSize,
        width: 16,
        height: 16
      })
    }
  })
})

function checkBarrelHit(){
  const pb = player.getBounds();
  for(let i=0;i<barrels.length;i++){
    const b = barrels[i];
    if(b.dead)continue;

    if(rectsTouching(pb,b.getBounds())){
      if(player.invincible)continue;

      player.health -= 1;
      player.invincible = true;
      player.invincibleTime = 1;

      if(player.health <= 0){
        player.health = player.maxHealth;
        player.x = currentCheckpoint.x;
        player.y = currentCheckpoint.y;
        player.velocity.x = 0;
        player.velocity.y = 0;
      }
    }
  }
}

function checkFireHit(){
  const pb = player.getBounds();
  for(let i=0;i<fires.length;i++){
    const f = fires[i];
    if(f.dead)continue;
    if(rectsTouching(pb, f.getBounds())){
      if(player.invincible)continue;
      player.health -= 1;
      player.invincible = true;
      player.invincibleTime = 1;
      if(player.health <= 0){
        player.health = player.maxHealth;
        player.x = currentCheckpoint.x;
        player.y = currentCheckpoint.y;
        player.velocity.x = 0;
        player.velocity.y = 0;
      }
    }
  }
}

// gems setup from l_Gems layer
const gems = []
const makeGemsFromLayer = (gemsLayer) => {
  gems.length = 0;

  for(let y=0;y<gemsLayer.length;y++){
    for(let x=0;x<gemsLayer[y].length;x++){
      const symbol = gemsLayer[y][x];
      if(symbol !== 0){
        let pts = 10;
        if(symbol == 5){
          pts = 20
        }
        if(symbol == 9){
          pts = 50
        }

        gems.push(new Gem({x: x*16, y: y*16, size: 16, symbol: symbol, points: pts}))
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

        context.drawImage(tilesetImage, srcX, srcY, tileSize, tileSize, x * 16, y * 16, 16, 16)
      }
    })
  })
}
const renderStaticLayers = async () => {
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = canvas.width
  offscreenCanvas.height = canvas.height
  const offscreenContext = offscreenCanvas.getContext('2d')

  for (const [layerName, tilesData] of Object.entries(layersData)){
    if(layerName == 'l_Gems')continue;

    const tilesetInfo = tilesets[layerName]

    if (tilesetInfo){
      try{
        const tilesetImage = await loadImage(tilesetInfo.imageUrl)
        renderLayer(tilesData,tilesetImage,tilesetInfo.tileSize,offscreenContext)
      }
      catch (error){
        console.error(`Failed to load image for layer ${layerName}:`, error)
      }
    }
  }


  return offscreenCanvas
}
// END - Tile setup

const player = new Player({
  x: 100,
  y: 100,
  size: 16,
  velocity: { x: 0, y: 0 },
})

let currentCheckpoint = {x: 100, y:100}

const keys = {
  w:{
    pressed: false
  },
  a:{
    pressed: false
  },
  d:{
    pressed: false
  },
  s:{
    pressed: false
  }
}

function drawHud(ctx){ // to store the score
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(8,8,170,28);

  ctx.fillStyle = "white";
  ctx.font = '16px monospace'
  ctx.fillText('SCORE: ' + score, 16, 28)
  ctx.restore();
}

function drawLevelComplete(ctx){
  ctx.save()
  ctx.fillStyle='rgba(0,0,0,0.65)'
  ctx.fillRect(0,0,1024,576);

  ctx.fillStyle = 'yellow'
  ctx.font = '48px monospace'
  ctx.fillText('LEVEL COMPLETED!!!', 240, 250)

  ctx.font = '20px monospace'
  ctx.fillStyle = 'white'
  ctx.fillText("(Press R to restart) || (just refresh page lol!)", 285, 310);
  ctx.restore();
}

function tryCollectGems(deltaTime){
  if(levelDone)return;
  const pb = player.getBounds()

  for(let i=0;i<gems.length;i++){
    const g = gems[i]
    g.update(deltaTime);

    if(g.collected) continue;

    const gb = g.getBounds();
    if(rectsTouching(pb,gb)){
      const got = g.collect()
      score += got
      console.log("Collected gem +" + got);
    }
  }

  let left = 0;
  for(let i=0;i<gems.length;i++){
    if(!gems[i].collected)left++;
  }
  if(gems.length > 0 && left == 0){
    levelDone = true
  }
}

function checkEnemyHit(){
  const pb = player.getBounds();

  for(let i=0;i<enemies.length;i++){
    const e = enemies[i];
    if(e.dead){
      continue;
    }

    const eb = e.getBounds();
    if(rectsTouching(pb,eb)){
      if(player.velocity.y > 0 && player.y + player.height - 5 < e.y){
        e.dead = true;
        player.velocity.y = -150;
        score = score + 30;
      }
      else{
        if(player.invincible){
          return;
        }

        player.health -= 1;
        player.velocity.y = -120;
        player.invincible = true;
        player.invincibleTime = 1;

        if(player.health <= 0){
          player.health = player.maxHealth;
          player.x = currentCheckpoint.x;
          player.y = currentCheckpoint.y;
          player.velocity.x = 0;
          player.velocity.y = 0;
          console.log("respawned at checkpoint")
        }
      }
    }
  }
}

function checkDoor(){
  const pb = player.getBounds();
  const db = door.getBounds();

  if(rectsTouching(pb,db)){
    if(gems.length > 0){
      return;
    }

    levelDone = true;
  }
}

function checkCheckpointTouch(){
  const pb = player.getBounds();

  for(let i=0;i<checkpoints.length;i++){
    const cp = checkpoints[i];
    const cb = cp.getBounds();

    if(rectsTouching(pb,cb)){
      if(!cp.activated){
        console.log("checkpoint reached");
        cp.activated = true;
        currentCheckpoint.x = cp.x;
        currentCheckpoint.y = cp.y;
      }
    }
  }
}

camera.viewW = 1024;
camera.viewH = 576;
camera.offsetX = 250;
camera.offsetY = 220
camera.smooth = 0.12

cameraSetWorldSizeFromLayer(l_Back_Tiles);

function animate(backgroundCanvas) {
  
  const currentTime = performance.now()
  const deltaTime = (currentTime - lastTime) / 1000
  lastTime = currentTime

  if(!levelDone){
    player.handleInput(keys)
    player.update(deltaTime, collisionBlocks);
    for(let i=0;i<enemies.length;i++){
      enemies[i].update(deltaTime,collisionBlocks);
    }
    for(let i=enemies.length-1;i>=0;i--){
      if(enemies[i].dead){
        enemies.splice(i,1)
      }
    }
    for(let i=barrels.length-1;i>=0;i--){
      const barrel = barrels[i];
      barrel.update(deltaTime, collisionBlocks);

      if(barrel.dead){
        barrels.splice(i,1);
      }
    }
    for(let i=fires.length-1;i>=0;i--){
      fires[i].update(deltaTime, collisionBlocks);
      if(fires[i].dead){
        fires.splice(i,1);
      }
    }
  }
  else{
    player.velocity.x = 0;
    player.velocity.y = 0;
  }
  
  cameraUpdate(deltaTime, player);
  tryCollectGems(deltaTime);
  checkEnemyHit();
  checkBarrelHit();
  checkFireHit();

  c.save()
  c.scale(dpr, dpr);
  c.clearRect(0,0,1024,576)
  c.save()
  c.translate(-camera.x, -camera.y)
  c.drawImage(backgroundCanvas,0,0)

  door.draw(c);

  for(let i=0;i<ladders.length;i++){
    const l=ladders[i];
    c.fillStyle='rgba(0,255,0,0.3)';
    c.fillRect(l.x,l.y,l.width,l.height);
  }

  for(let i=0;i<gems.length;i++){
    gems[i].draw(c, gemsImage, 16)
  }
  for(let i=0;i<enemies.length;i++){
    enemies[i].draw(c);
  }

  for(let i=0;i<barrels.length;i++){
    barrels[i].draw(c);
  }

  for(let i=0;i<fires.length;i++){
    fires[i].draw(c);
  }

  player.draw(c)
  c.restore()
  drawHud(c);
  if(levelDone)drawLevelComplete(c);
  c.restore()

  requestAnimationFrame(() => animate(backgroundCanvas))
}

const startRendering = async () => {
  try {
    const backgroundCanvas = await renderStaticLayers()
    if (!backgroundCanvas) {
      console.error('Failed to create the background canvas')
      return
    }

    gemsImage = await loadImage("./images/decorations.png")
    animate(backgroundCanvas)
  } catch (error) {
    console.error('Error during rendering:', error)
  }
}

startRendering()
