class Platform{
  constructor({x, y, width=16, height=4}){
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.dead = false
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height }
  }

  draw(c) {
    if (this.dead) return
    c.fillStyle = 'purple'
    c.fillRect(this.x, this.y, this.width, this.height)
  }

  checkCollision(player, deltaTime) {
    if (player.hitbox && typeof player.previousHitboxY == 'number') {
      const LANDING_TOLERANCE = 6
      const currentBottom = player.hitbox.y + player.hitbox.height
      const previousBottom = player.previousHitboxY + player.hitbox.height
      const isFalling = player.velocity.y >= 0
      const crossedPlatformTop = previousBottom <= this.y && currentBottom >= this.y - LANDING_TOLERANCE;

      return (isFalling && crossedPlatformTop && player.hitbox.x + player.hitbox.width > this.x && player.hitbox.x < this.x + this.width)
    }

    return (player.y + player.height <= this.y && player.y + player.height + player.velocity.y * deltaTime >= this.y && player.x + player.width > this.x && player.x < this.x + this.width)
  }
}