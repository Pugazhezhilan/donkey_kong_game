const X_VELOCITY = 200
const JUMP_POWER = 250
const GRAVITY = 580

class Player{
  constructor({ x, y, size, velocity = { x: 0, y: 0 } }){
    this.x = x
    this.y = y
    this.onLadder = false
    this.climbSpeed = 120
    this.width = size
    this.height = size
    this.velocity = velocity
    this.isOnGround = false
  }

  getBounds(){
    return {x:this.x, y:this.y, width:this.width, height: this.height}
  }

  draw(c) {
    c.fillStyle = 'rgba(255, 0, 0, 0.5)'
    c.fillRect(this.x, this.y, this.width, this.height)
  }

  update(deltaTime, collisionBlocks){
    if(!deltaTime)return;
    this.checkLadder()

    if(!this.onLadder){
      this.applyGravity(deltaTime)
    }
    else{
      this.velocity.y = 0;
    }

    this.updateHorizontalPosition(deltaTime);
    this.checkForHorizontalCollisions(collisionBlocks)

    if(!this.onLadder){
      this.checkPlatformCollisions(platforms, deltaTime)
    }
    this.updateVerticalPosition(deltaTime);
    this.checkForVerticalCollisions(collisionBlocks);
  }

  jump(){
    if(this.onLadder)return;

    this.velocity.y = -JUMP_POWER
    this.isOnGround = false
  }

  updateHorizontalPosition(deltaTime){
    this.x += this.velocity.x * deltaTime
  }

  updateVerticalPosition(deltaTime){
    this.y += this.velocity.y * deltaTime
  }

  applyGravity(deltaTime){
    this.velocity.y += GRAVITY * deltaTime
  }

  handleInput(keys){
    this.velocity.x = 0
    if(keys.d.pressed){
      this.velocity.x = X_VELOCITY
    }
    else if(keys.a.pressed){
      this.velocity.x = -X_VELOCITY
    }

    if(this.onLadder){
      if(keys.w.pressed){
        this.velocity.y = -this.climbSpeed
      }
      else if(keys.s.pressed){
        this.velocity.y = this.climbSpeed;
      }
      else{
        this.velocity.y = 0;
      }
    }
  }

  checkForHorizontalCollisions(collisionBlocks){
    const buffer = 0.0001
    for (let i = 0; i < collisionBlocks.length; i++) {
      const collisionBlock = collisionBlocks[i]

      if (
        this.x <= collisionBlock.x + collisionBlock.width &&
        this.x + this.width >= collisionBlock.x &&
        this.y + this.height >= collisionBlock.y &&
        this.y <= collisionBlock.y + collisionBlock.height
      ){

        if (this.velocity.x < -0){
          this.x = collisionBlock.x + collisionBlock.width + buffer
          break
        }

        if (this.velocity.x > 0){
          this.x = collisionBlock.x - this.width - buffer
          break
        }
      }
    }
  }

  checkForVerticalCollisions(collisionBlocks){
    const buffer = 0.0001
    for (let i = 0; i < collisionBlocks.length; i++) {
      const collisionBlock = collisionBlocks[i]


      if(
        this.x <= collisionBlock.x + collisionBlock.width &&
        this.x + this.width >= collisionBlock.x &&
        this.y + this.height >= collisionBlock.y &&
        this.y <= collisionBlock.y + collisionBlock.height
      ){
    
        if (this.velocity.y < 0){
          this.velocity.y = 0
          this.y = collisionBlock.y + collisionBlock.height + buffer
          break
        }

        if (this.velocity.y > 0){
          this.velocity.y = 0
          this.y = collisionBlock.y - this.height - buffer
          this.isOnGround = true
          break
        }
      }
    }
  }

  checkPlatformCollisions(platforms, deltaTime) {
    const buffer = 0.0001
    for (let platform of platforms) {
      if (platform.checkCollision(this, deltaTime)) {
        this.velocity.y = 0
        this.y = platform.y - this.height - buffer
        this.isOnGround = true
        return
      }
    }
    this.isOnGround = false
  }

  checkLadder(){
    this.onLadder = false;
    for(let i=0;i<window.ladders.length;i++){
      const l=window.ladders[i];

      if(this.x < l.x + l.window && this.x + this.width > l.x && this.y < l.y + l.height && this.y + this.height > l.y){
        this.onLadder = true;
        if(keys.w.pressed || keys.s.pressed){
          this.x = l.x + (l.width/2)-(this.width/2);
        }
        return;
      }
    }
  }
}
