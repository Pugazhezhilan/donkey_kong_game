window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase()
  if (["w", "a", "d", "arrowup", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault()
  }

  switch (key) {
    case 'w':
    case 'arrowup':
    case ' ':
      player.jump()
      keys.w.pressed = true
      break
    case 'a':
    case 'arrowleft':
      keys.a.pressed = true
      break
    case 'd':
    case 'arrowright':
      keys.d.pressed = true
      break
  }
})

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase()
  switch (key) {
    case 'a':
    case 'arrowleft':
      keys.a.pressed = false
      break
    case 'd':
    case 'arrowright':
      keys.d.pressed = false
      break
    case 'w':
    case 'arrowup':
    case ' ':
      keys.w.pressed = false
      break
  }
})

// On return to game's tab, ensure delta time is reset
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastTime = performance.now()
  }
})