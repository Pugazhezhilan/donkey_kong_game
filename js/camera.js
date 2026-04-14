let __shakeTime = 0;
let __shakeDuration = 0;
let __shakeStrength = 0;
let __shakeSeed = 1;
let __shakeKickX = 0;
let __shakeKickY = 0;

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

function __shakeRand(){
  __shakeSeed = (__shakeSeed*1664525 + 1013904223) >>> 0;
  return __shakeSeed/4294967296;
}

window.cameraShakeImpulse = (strength, seconds = 0.18, kick = null) => {
  if (!Number.isFinite(strength) || strength <= 0) {
    return;
  }

  __shakeStrength = Math.max(__shakeStrength, strength);
  __shakeDuration = Math.max(__shakeDuration, seconds);
  __shakeTime = __shakeDuration;

  if (kick && typeof kick === 'object') {
    const kx = Number(kick.x || 0);
    const ky = Number(kick.y || 0);

    if (Math.abs(kx) > Math.abs(__shakeKickX)) __shakeKickX = kx;
    if (Math.abs(ky) > Math.abs(__shakeKickY)) __shakeKickY = ky;
  }
};

window.cameraGetShakeOffset = (deltaTime) => {
  if (__shakeTime <= 0 || __shakeStrength <= 0) {
    return { x: 0, y: 0 };
  }

  __shakeTime = Math.max(0, __shakeTime - deltaTime);
  const t = __shakeDuration > 0 ? (__shakeTime / __shakeDuration) : 0;
  const amp = __shakeStrength * (t * t);

  let x = (__shakeRand() * 2 - 1) * amp * 0.55;
  let y = (__shakeRand() * 2 - 1) * amp * 1.0;
  x += (__shakeKickX || 0);
  y += (__shakeKickY || 0);

  const kickDecay = Math.pow(0.001, deltaTime); 
  __shakeKickX = (__shakeKickX || 0) * kickDecay;
  __shakeKickY = (__shakeKickY || 0) * kickDecay;

  if (__shakeTime === 0) {
    __shakeStrength = 0;
    __shakeDuration = 0;
    __shakeKickX = 0;
    __shakeKickY = 0;
  }
  return { x, y };
};