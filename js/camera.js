const camera = {
  x: 0,
  y: 0,
  offsetX: 250,
  offsetY: 220,
  smooth: 0.12,
  worldW: 0,
  worldH: 0,
  viewW: 1024,
  viewH: 576,
}

const clamp = (v, min, max) => {
  if (v < min) return min
  if (v > max) return max
  return v
}

const cameraSetWorldSizeFromLayer = (layer) => {
  const tile = 16
  camera.worldH = layer.length * tile
  camera.worldW = (layer[0] ? layer[0].length : 0) * tile
}

const cameraUpdate = (dt, player) => {
  const targetX = player.x - camera.offsetX
  const targetY = player.y - camera.offsetY

  let s = camera.smooth
  if (dt > 0.05) s = 0.2

  camera.x = camera.x + (targetX - camera.x) * s
  camera.y = camera.y + (targetY - camera.y) * s

  let maxX = camera.worldW - camera.viewW
  let maxY = camera.worldH - camera.viewH
  if (maxX < 0) maxX = 0
  if (maxY < 0) maxY = 0

  camera.x = clamp(camera.x, 0, maxX)
  camera.y = clamp(camera.y, 0, maxY)

  camera.x = Math.floor(camera.x)
  camera.y = Math.floor(camera.y)
}

const toScreenX = (x) => x - camera.x
const toScreenY = (y) => y - camera.y