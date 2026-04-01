class Enemy{
  constructor({x,y,width = 32,height = 32,imageSrc = './images/opossum.png',frames = 6,frameInterval = 0.12}){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.velocity = { x: 40, y: 0 }
    this.gravity = 500
    this.isOnGround = false
    this.dead = false
    this.frames = frames
    this.currentFrame = 0
    this.frameInterval = frameInterval
    this.elapsedTime = 0
    this.loaded = false
    this.image = new Image()
    this.image.onload = () => {
      this.loaded = true
      this.frameWidth = Math.floor(this.image.width / this.frames)
      this.frameHeight = this.image.height
    }
    this.image.src = imageSrc
  }

  getBounds(){
    return { x: this.x, y: this.y, width: this.width, height: this.height }
  }

  draw(c, deltaTime){
    if (this.dead) return
    if (!this.loaded) {
      c.fillStyle = 'purple'
      c.fillRect(this.x, this.y, this.width, this.height)
      return
    }

    if (deltaTime){
      this.elapsedTime += deltaTime
      while (this.elapsedTime >= this.frameInterval){
        this.currentFrame = (this.currentFrame + 1) % this.frames
        this.elapsedTime -= this.frameInterval
      }
    }

    const sx = this.currentFrame * this.frameWidth
    const sy = 0
    const facingRight = this.velocity.x > 0

    if(!facingRight){
      c.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, this.x, this.y, this.width, this.height)
    }
    else{
      c.save()
      c.scale(-1,1);
      c.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, -this.x-this.width, this.y, this.width, this.height)
      c.restore()
    }
  }

  update(deltaTime, collisionBlocks){
    if (this.dead) return
    this.velocity.y += this.gravity * deltaTime
    this.x += this.velocity.x * deltaTime
    for (let i = 0; i < collisionBlocks.length; i++){
      const block = collisionBlocks[i]
      if(
        this.x < block.x + block.width &&
        this.x + this.width > block.x &&
        this.y + this.height > block.y &&
        this.y < block.y + block.height
      ){
        this.velocity.x = -this.velocity.x * 0.95
        if (this.velocity.x > 0) this.x = block.x + block.width
        else this.x = block.x - this.width
        break
      }
    }

    this.y += this.velocity.y * deltaTime
    this.isOnGround = false

    for(let i = 0; i < collisionBlocks.length; i++){
      const block = collisionBlocks[i]
      if (
        this.x < block.x + block.width &&
        this.x + this.width > block.x &&
        this.y + this.height > block.y &&
        this.y < block.y + block.height
      ){
        if (this.velocity.y > 0){
          this.velocity.y = 0
          this.y = block.y - this.height
          this.isOnGround = true
        }
      }
    }
  }
}