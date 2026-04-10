const camera = {
  x: 0,
  y: 0,
  offsetX: 250,
  offsetY: 220,
  smoothX: 0.12,
  smoothY: 0.16,
  jumpCatchup: 0.26,
  worldW: 0,
  worldH: 0,
  viewW: 1024,
  viewH: 576,
}

const clamp = (v, min, max) => {
  if(v < min){
    return min;
  }
  if(v > max){
    return max;
  }
  return v;
}

const cameraSetWorldSizeFromLayer = (layer) => {
  const tile = 16;
  camera.worldH = layer.length*tile;
  camera.worldW = (layer[0] ? layer[0].length : 0) * tile;
}

const cameraUpdate = (dt,player) =>{
  const targetX = player.x - camera.offsetX;
  const targetY = player.y - camera.offsetY;

  let sx = camera.smoothX;
  let sy = camera.smoothY;
  if(dt > 0.05){
    sx = 0.2;
    sy = 0.24;
  }

  const verticalSpeed = Math.abs(player?.velocity?.y || 0)
  if(verticalSpeed > 120){
    sy = Math.max(sy, camera.jumpCatchup)
  }

  camera.x = camera.x + (targetX-camera.x)*sx;
  camera.y = camera.y + (targetY - camera.y)*sy;

  let maxY = camera.worldH - camera.viewH;
  if(camera.x < 0){
    camera.x = 0;
  }
  if(maxY < 0){
    maxY = 0;
  }

  camera.y = clamp(camera.y, 0, maxY);

  camera.x = Math.floor(camera.x);
  camera.y = Math.floor(camera.y);
}

const toScreenX = (x) => {
  return x-camera.x;
}
const toScreenY = (y) => {
  return y-camera.y;
}