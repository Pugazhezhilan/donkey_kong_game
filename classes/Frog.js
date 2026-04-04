class Frog{
  constructor({x,y,width = 32,height = 32,minX = x - 60,maxX = x + 60,jumpInterval = 1.2,jumpPower = 260,moveSpeed = 60,idleImageSrc = './images/frog-idle.png',jumpImageSrc = './images/frog-jump.png',idleFrames = 1,jumpFrames = 1,frameInterval = 0.12}){
    this.x=x
    this.y=y;
    this.width=width
    this.height = height
    this.minX = minX
    this.maxX = maxX
    this.moveSpeed = moveSpeed
    this.dir = 1
    this.velocity = {x: 0, y: 0}
    this.gravity =500
    this.isOnGround = false
    this.dead = false
    this.jumpInterval = jumpInterval
    this.jumpTimer=0
    this.jumpPower = jumpPower
    this.idleLoaded = false
    this.jumpLoaded = false;
    this.idleFrames = idleFrames
    this.jumpFrames = jumpFrames
    this.currentFrame = 0
    this.frameInterval = frameInterval
    this.elapsedTime = 0
    this.lastInAir = null
    this.idleFrameWidth = 0
    this.idleFrameHeight = 0
    this.jumpFrameWidth = 0
    this.jumpFrameHeight = 0
    this.idleImage = new Image()
    this.idleImage.onload = () => {
      this.idleLoaded = true
      this.idleFrameWidth = Math.floor(this.idleImage.width / this.idleFrames)
      this.idleFrameHeight = this.idleImage.height
    }
    this.idleImage.src = idleImageSrc
    this.jumpImage = new Image()
    this.jumpImage.onload = () => {
      this.jumpLoaded = true
      this.jumpFrameWidth = Math.floor(this.jumpImage.width / this.jumpFrames)
      this.jumpFrameHeight = this.jumpImage.height
    };
    this.jumpImage.src=jumpImageSrc;
  }

  getBounds(){
    return {x: this.x, y: this.y, width: this.width, height: this.height}
  }

  update(deltaTime,collisionBlocks){
    if(this.dead)return
    this.jumpTimer += deltaTime
    if(this.isOnGround && this.jumpTimer >= this.jumpInterval){
      const targetX = this.dir > 0 ? this.maxX : this.minX
      const airTime = Math.max((2 * this.jumpPower) / this.gravity, 0.001)
      const distanceToTarget = targetX - this.x
      this.velocity.x = distanceToTarget / airTime
      this.velocity.y = -this.jumpPower
      this.isOnGround = false
      this.jumpTimer = 0;
    }
    this.x += this.velocity.x*deltaTime

    for(let i = 0; i < collisionBlocks.length; i++){
      const block = collisionBlocks[i]
      if(this.x < block.x + block.width && this.x + this.width > block.x && this.y + this.height > block.y && this.y < block.y + block.height){
        if(this.velocity.x > 0){
          this.x = block.x - this.width
          this.dir = -1
        }
        else if(this.velocity.x < 0){
          this.x = block.x + block.width
          this.dir = 1
        }
      }
    }

    if(this.x < this.minX){
      this.x = this.minX
      this.velocity.x = 0
      this.dir = 1
    }
    else if(this.x > this.maxX){
      this.x = this.maxX;
      this.velocity.x = 0
      this.dir = -1;
    }
    this.velocity.y += this.gravity*deltaTime
    this.y += this.velocity.y*deltaTime
    this.isOnGround = false

    for(let i=0;i<collisionBlocks.length;i++){
      const block = collisionBlocks[i]
      if(this.x < block.x + block.width && this.x + this.width > block.x && this.y + this.height > block.y && this.y < block.y + block.height){
        if(this.velocity.y > 0){
          this.velocity.y = 0
          this.y = block.y - this.height
          this.isOnGround = true
          if(Math.abs(this.x - this.minX) <= Math.abs(this.x - this.maxX)){
            this.x = this.minX
            this.dir = 1
          }
          else{
            this.x = this.maxX
            this.dir = -1
          }
          this.velocity.x = 0
        }
        else if(this.velocity.y < 0){
          this.velocity.y = 0
          this.y = block.y + block.height
        }
      }
    }
  }

  draw(c,deltaTime){
    if(this.dead)return;
    const inAir = !this.isOnGround
    const facingRight = inAir ? this.velocity.x > 0 : this.dir > 0
    const img = inAir ? this.jumpImage : this.idleImage
    const ok = inAir ? this.jumpLoaded : this.idleLoaded
    const frames = inAir ? this.jumpFrames : this.idleFrames
    const frameWidth = inAir ? this.jumpFrameWidth : this.idleFrameWidth
    const frameHeight = inAir ? this.jumpFrameHeight : this.idleFrameHeight

    if(!ok){
      c.fillStyle = 'lime';
      c.fillRect(this.x, this.y, this.width, this.height)
      return;
    }

    if(this.lastInAir !== inAir){
      this.currentFrame = 0
      this.elapsedTime = 0
      this.lastInAir = inAir
    }

    if(deltaTime){
      this.elapsedTime += deltaTime
      while(this.elapsedTime >= this.frameInterval){
        this.currentFrame = (this.currentFrame + 1) % frames
        this.elapsedTime -= this.frameInterval
      }
    }

    const sx = this.currentFrame * frameWidth
    const sy = 0

    if(facingRight){
      c.save()
      c.scale(-1,1);
      c.drawImage(img, sx, sy, frameWidth, frameHeight, -this.x-this.width, this.y, this.width, this.height)
      c.restore()
    }
    else{
      c.drawImage(img, sx, sy, frameWidth, frameHeight, this.x, this.y, this.width, this.height)
    }
  }
}

window.Frog = Frog