const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const rectsTouching = (a,b) => {
  return (a.x < b.x+b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y)
}
