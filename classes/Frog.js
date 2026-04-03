class Frog{
  constructor({x,y,width = 32,height = 32,minX = x - 60,maxX = x + 60,jumpInterval = 1.2,jumpPower = 260,moveSpeed = 60,idleImageSrc = './images/frog-idle.png',jumpImageSrc = './images/frog-jump.png'}){
    this.x=x
    this.y=y;
    this.width=width
    this.height = height
    this.minX = minX
    this.maxX = maxX
    this.moveSpeed = moveSpeed
    this.dir = 1
    this.velocity = {x: moveSpeed, y: 0}
    this.gravity =500
    this.isOnGround = false
    this.dead = false
    this.jumpInterval = jumpInterval
    this.jumpTimer=0
    this.jumpPower = jumpPower
    this.idleLoaded = false
    this.jumpLoaded = false;
    this.idleImage = new Image()
    this.idleImage.onload = () => { this.idleLoaded = true }
    this.idleImage.src = idleImageSrc
    this.jumpImage = new Image()
    this.jumpImage.onload = () => { this.jumpLoaded = true };
    this.jumpImage.src=jumpImageSrc;
  }

  getBounds(){
    return {x: this.x, y: this.y, width: this.width, height: this.height}
  }

  update(deltaTime,collisionBlocks){
    if(this.dead)return
    this.jumpTimer += deltaTime
    if(this.isOnGround && this.jumpTimer >= this.jumpInterval){
      this.velocity.y = -this.jumpPower
      this.isOnGround = false
      this.jumpTimer = 0;
    }
    this.velocity.x = this.dir*this.moveSpeed;
    this.x += this.velocity.x*deltaTime

    if(this.x < this.minX){
      this.x = this.minX
      this.dir = 1
    }
    else if(this.x > this.maxX){
      this.x = this.maxX;
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
        }
      }
    }
  }

  draw(c){
    if(this.dead)return;
    const inAir = !this.isOnGround
    const img = inAir ? this.jumpImage : this.idleImage
    const ok = inAir ? this.jumpLoaded : this.idleLoaded

    if(!ok){
      c.fillStyle = 'lime';
      c.fillRect(this.x, this.y, this.width, this.height)
      return;
    }
    if(this.dir < 0){
      c.save()
      c.scale(-1,1);
      c.drawImage(img, -this.x-this.width, this.y, this.width, this.height)
      c.restore()
    }
    else{
      c.drawImage(img, this.x, this.y, this.width, this.height)
    }
  }
}

window.Frog = Frog