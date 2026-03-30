class Barrel{
    constructor({x,y,width=16,height=16,speed=80,direction=1}){
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.speed = speed
        this.direction = direction
        this.velocity = {
            x: this.speed*this.direction,
            y: 0
        }
        this.gravity = 800
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
        c.fillStyle = "saddlebrown"
        c.beginPath();
        c.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, 2*Math.PI);
        c.fill()
        c.strokeStyle = "black"
        c.stroke()
        c.restore()
    }

    update(deltaTime, collisionBlocks){
        if(this.dead)return;

        this.velocity.y += this.gravity * deltaTime;
        this.x += this.velocity.x * deltaTime

        for(let i=0;i<collisionBlocks.length;i++){
            const block = collisionBlocks[i];
            if(rectsTouching(this.getBounds(), block)){
                this.direction *= -1;
                this.velocity.x = this.speed*thiis.direction;
                if(this.direction > 0){
                    this.x = block.x + block.width + 0.001;
                }
                else{
                    this.x = block.x - this.width - 0.001;
                }
                break;
            }
        }

        this.y += this.velocity.y*deltaTime;
        this.isOnGround = false;

        for(let i=0;i<collisionBlocks.length;i++){
            const block = collisionBlocks[i];
            if(rectsTouching(this.getBounds(),block)){
                if(this.velocity.y > 0){
                    this.velocity.y = 0;
                    this.y = block.y - this.height - 0.001;
                    this.isOnGround = true;
                }
            }
        }
    }
}