const X_VELOCITY = 200
const JUMP_POWER = 250
const GRAVITY = 580
const HITBOX_OFFSET_X = 5
const HITBOX_OFFSET_Y = 9

class Player{
  constructor({x, y, size, velocity = { x: 0, y: 0 }}){
    this.x = x
    this.y = y
    this.width = size
    this.height = size
    this.velocity = velocity
    this.isOnGround = false
    this.wasOnGround = false   
    this.coyoteTime = 0.1
    this.loaded = false
    this.image = new Image()
    this.image.onload = () => {
      this.loaded = true
    }
    this.image.src = './images/player.png'
    this.currentFrame = 0
    this.frameInterval = 0.1
    this.elapsedTime = 0
    this.sprites = {idle: { x: 0, y: 2, width: 33, height: 30, frames: 4 },jump: { x: 0, y: 160, width: 33, height: 28, frames: 1 },run: { x: 0, y: 36, width: 33, height: 28, frames: 6 },fall: { x: 33, y: 160, width: 33, height: 28, frames: 1 }}
    this.cropbox = this.sprites.idle
    this.hitbox = {
      x: this.x + HITBOX_OFFSET_X,
      y: this.y + HITBOX_OFFSET_Y,
      width: 20,
      height: 23,
    }
    this.previousHitboxY = this.hitbox.y
    this.isFacingLeft = false
    this.health = 3
    this.maxHealth = 3
    this.invincible = false
    this.invincibleTime = 0
  }

  getBounds(){
    return {x: this.x, y: this.y, width: this.width, height: this.height}
  }

  draw(c, deltaTime){
    if(!deltaTime || !this.loaded) return
    if(this.invincible){
      if(Math.floor(Date.now() / 100) % 2 === 0) return;
    }

    this.elapsedTime += deltaTime
    if(this.isFacingLeft){
      c.save()
      c.scale(-1, 1)
      c.drawImage(
        this.image,
        this.cropbox.x + this.currentFrame * this.cropbox.width,
        this.cropbox.y,
        this.cropbox.width,
        this.cropbox.height,
        -this.x - this.width,
        this.y,
        this.width,
        this.height
      )
      c.restore()
    }
    else{
      c.drawImage(this.image,this.cropbox.x + this.currentFrame * this.cropbox.width,this.cropbox.y,this.cropbox.width,this.cropbox.height,this.x,this.y,this.width,this.height)
    }
    if (this.elapsedTime > this.frameInterval){
      this.currentFrame = (this.currentFrame + 1) % this.cropbox.frames
      this.elapsedTime -= this.frameInterval
    }
  }

  update(deltaTime, collisionBlocks, platforms){
    if(!deltaTime || !this.loaded) return
    this.previousHitboxY = this.hitbox.y;
    if(this.invincible){
      this.invincibleTime -= deltaTime
      if(this.invincibleTime <= 0){
        this.invincible = false
        this.invincibleTime = 0
      }
    }
    this.isOnGround = false
    this.applyGravity(deltaTime)
    this.updateHorizontalPosition(deltaTime)
    this.checkForHorizontalCollisions(collisionBlocks)
    this.updateVerticalPosition(deltaTime)
    this.checkForVerticalCollisions(collisionBlocks)

    if (this.velocity.y >= 0){
      this.checkPlatformCollisions(platforms, deltaTime)
    }
    if (!this.wasOnGround && this.isOnGround){
      window.__sound?.play('land', { volume: 0.6 })
    }
    if (this.isOnGround) this.coyoteTime = 0.1
    else this.coyoteTime = Math.max(0, this.coyoteTime - deltaTime)

    this.chooseSprite()

    if (typeof WORLD_HEIGHT == 'number'){
      const maxY = WORLD_HEIGHT - this.height
      if (this.y > maxY) {
        this.y = maxY
        this.velocity.y = 0
        this.isOnGround = true
        this.hitbox.y = this.y + HITBOX_OFFSET_Y
      }
    }
    this.wasOnGround = this.isOnGround
  }

  chooseSprite(){
    if (this.velocity.y < 0 && this.cropbox !== this.sprites.jump){
      this.cropbox = this.sprites.jump
      this.currentFrame = 0
    }
    else if(this.velocity.y > 0 && this.cropbox !== this.sprites.fall){
      this.cropbox = this.sprites.fall
      this.currentFrame = 0
    }
    else if(this.velocity.x !== 0 && this.isOnGround && this.cropbox !== this.sprites.run){
      this.cropbox = this.sprites.run
      this.currentFrame = 0
    }
    else if(this.velocity.x === 0 && this.isOnGround && this.cropbox !== this.sprites.idle){
      this.cropbox = this.sprites.idle
      this.currentFrame = 0
    }

    if(this.velocity.x > 0) this.isFacingLeft = false
    else if (this.velocity.x < 0) this.isFacingLeft = true
  }

  jump(){
    if (this.coyoteTime <= 0) return
    this.velocity.y = -JUMP_POWER
    this.isOnGround = false
    this.coyoteTime = 0
    window.__sound?.play('jump', {volume: 0.9 })
  }

  updateHorizontalPosition(deltaTime){
    if (this.hitbox.x + this.velocity.x * deltaTime < 0) return
    this.x += this.velocity.x * deltaTime
    this.hitbox.x = this.x + HITBOX_OFFSET_X
  }

  updateVerticalPosition(deltaTime){
    this.y += this.velocity.y * deltaTime
    this.hitbox.y = this.y + HITBOX_OFFSET_Y
  }

  applyGravity(deltaTime){
    this.velocity.y += GRAVITY * deltaTime
  }

  handleInput(keys){
    this.velocity.x = 0
    if (keys.d.pressed) this.velocity.x = X_VELOCITY
    else if (keys.a.pressed) this.velocity.x = -X_VELOCITY
  }

  checkForHorizontalCollisions(collisionBlocks){
    const buffer = 0.0001
    for (let i = 0; i < collisionBlocks.length; i++){
      const block = collisionBlocks[i]
      if(this.hitbox.x <= block.x + block.width && this.hitbox.x + this.hitbox.width >= block.x && this.hitbox.y + this.hitbox.height >= block.y && this.hitbox.y <= block.y + block.height){
        if(this.velocity.x < 0){
          this.hitbox.x = block.x + block.width + buffer
          this.x = this.hitbox.x - HITBOX_OFFSET_X
          break
        }
        if(this.velocity.x > 0) {
          this.hitbox.x = block.x - this.hitbox.width - buffer
          this.x = this.hitbox.x - HITBOX_OFFSET_X
          break
        }
      }
    }
  }

  checkForVerticalCollisions(collisionBlocks){
    const buffer = 0.0001
    for (let i = 0; i < collisionBlocks.length; i++) {
      const block = collisionBlocks[i]

      if (this.hitbox.x <= block.x + block.width && this.hitbox.x + this.hitbox.width >= block.x && this.hitbox.y + this.hitbox.height >= block.y && this.hitbox.y <= block.y + block.height){
        if(this.velocity.y < 0){
          this.velocity.y = 0
          this.hitbox.y = block.y + block.height + buffer
          this.y = this.hitbox.y - HITBOX_OFFSET_Y
          break
        }
        if(this.velocity.y > 0){
          this.velocity.y = 0
          this.hitbox.y = block.y - this.hitbox.height - buffer
          this.y = this.hitbox.y - HITBOX_OFFSET_Y
          this.isOnGround = true
          break
        }
      }
    }
  }

  checkPlatformCollisions(platforms, deltaTime){
    const buffer = 0.0001
    for(let i = 0; i < platforms.length; i++){
      const platform = platforms[i]

      if(platform.checkCollision(this, deltaTime)){
        this.velocity.y = 0
        this.hitbox.y = platform.y - this.hitbox.height - buffer
        this.y = this.hitbox.y - HITBOX_OFFSET_Y
        this.isOnGround = true
        return
      }
    }
  }

  getHitBounds(){
    return{x: this.hitbox.x, y: this.hitbox.y, width: this.hitbox.width, height: this.hitbox.height}
  }
}