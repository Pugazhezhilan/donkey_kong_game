class Fire{
    constructor({x, y, width=14, height = 14, speed = 50, direction = 1}){
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.speed = speed
        this.direction = direction
        this.velocity = {
            x: this.speed * this.direction,
            y: 0
        }
        this.gravity = 900
        this.isOnGround = false
        this.dead = false
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
        if(this.dead)return;
        c.save()
        c.fillStyle = "orange";
        c.beginPath()
        c.arc(this.x+this.width/2, this.y+this.height/2, this.width/2, 0, Math.PI*2)
        c.fill()
        c.fillStyle = "yellow"
        c.beginPath()
        c.arc(this.x+this.width/2, this.y+this.height/2, this.width/4, 0, Math.PI*2);
        c.fill()
        c.restore()
    }
    update(deltaTime, collisionBlocks){
        if(this.dead)return;

        this.velocity.y += this.gravity*deltaTime;
        this.x += this.velocity.x*deltaTime;

        for(let i=0;i<collisionBlocks.length;i++){
            const block = collisionBlocks[i];
            if(rectsTouching(this.getBounds, block)){
                this.direction *= -1;
                this.velocity.x = this.speed*this.direction
                if(this.direction > 0){
                    this.x = block.x + block.width + 0.01;
                }
                else{
                    this.x = block.x - this.width - 0.01;
                }
                break;
            }
        }

        this.y += this.velocity.y*deltaTime
        this.isOnGround = false
        for(let i=0;i<collisionBlocks.length;i++){
            const block = collisionBlocks[i];
            if(rectsTouching(this.getBounds(), block)){
                if(this.velocity.y > 0){
                    this.velocity.y = 0;
                    this.y = block.y-this.height-0.01
                    this.isOnGround = true
                }
            }
        }
    }
}