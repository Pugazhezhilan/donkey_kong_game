const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const dpr = window.devicePixelRatio || 1

canvas.width = 1024 * dpr
canvas.height = 576 * dpr

let score = 0;
let levelDone = false;
let gemsImage = null;
let lastTime = performance.now()

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


// Tile setup
const collisionBlocks = []
const platforms = []
const blockSize = 16 
const ladders = []

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
    else if(sumbol == 3){
      ladders.push({
        x: y*
      })
    }
  })
})

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

const keys = {
  w:{
    pressed: false
  },
  a:{
    pressed: false
  },
  d:{
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

camera.viewH = 1024;
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
  }
  else{
    player.velocity.x = 0;
    player.velocity.y = 0;
  }

  cameraUpdate(deltaTime, player);
  tryCollectGems(deltaTime);

  c.save()
  c.scale(dpr, dpr);
  c.clearRect(0,0,canvas.width, canvas.height)
  c.save()
  c.translate(-camera.x, -camera.y)
  c.drawImage(backgroundCanvas,0,0)

  for(let i=0;i<gems.length;i++){
    gems[i].draw(c, gemsImage, 16)
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
