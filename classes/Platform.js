class Platform {
  constructor({ x, y, width = 16, height = 4 }) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  draw(c) {
    c.fillStyle = 'rgba(255, 0, 0, 0.5)'
    c.fillRect(this.x, this.y, this.width, this.height)
  }

  checkCollision(player, deltaTime) {
    return (
      player.y + player.height <= this.y &&
      player.y + player.height + player.velocity.y * deltaTime >= this.y &&
      player.x + player.width > this.x &&
      player.x < this.x + this.width
    )
  }
}

class Enemy{
  constructor({x,y,width=16,height=16}){
    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.velocity = {
      x: 40,
      y: 0
    }

    this.gravity = 500;
    this.isOnGrow = false;
  }

  getBounds(){
    return{
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }

  draw(c){
    c.fillStyle = "purple" // enemy color lol
    c.fillRect(this.x, this.y, this.width, this.height)
  }

  update(deltaTime, collisionBlocks){
    // apply gravity
    this.velocity.y += this.gravity*deltaTime;

    // move X
    this.x += this.velocity.x*deltaTime

    for(let i=0;i<collisionBlocks.length;i++){
      const block = collisionBlocks[i];

      if(this.x < block.width && this.x + this.width > block.x && this.y + this.height > block.y && this.y < block.y + block.height){
        // reverse direction
        this.velocity.x = -this.velocity.x

        
      }
    }
  }
}