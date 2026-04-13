window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase()
  if (event.repeat && (key === 'w' || key === 'arrowup' || key === ' ')){
    return
  }
  if (["w", "a", "d", "arrowup", "arrowleft", "arrowright", " "].includes(key)){
    event.preventDefault()
  }

  switch (key){
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

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastTime = performance.now()
  }
})

document.getElementById("left").ontouchstart = () =>  keys.a.pressed = true;
document.getElementById("left").ontouchend = () => keys.a.pressed = false;
document.getElementById("right").ontouchstart = () => keys.d.pressed = true;
document.getElementById("right").ontouched = () => keys.d.presses = false;
document.getElementById("jump").ontouchstart = () => {
  player.velocity.y = -15;
}

if(window.innerWidth > 768){
  document.getElementById("mobile-controls").style.display = "none";
}