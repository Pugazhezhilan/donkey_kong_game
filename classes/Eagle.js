class Eagle{
    constructor({x,y,width=32,height=32,minY=y-40,maxY=y+40,flySpeed=60,imageSrc='./images/eagle.png',frames=4,frameInterval=0.12}){
        this.x = x
        this.y = y
        this.startY = y;
        this.width = width;
        this.height = height
        this.minY = minY;
        this.maxY = maxY;
        this.flySpeed = flySpeed
        this.flyDir = 1
        this.dead = false
        this.frames = frames
        this.currentFrame = 0
        this.frameInterval = frameInterval;
        this.elapsedTime = 0
        this.loaded = false
        this.image = new Image()
        this.image.onload = () => {
            this.loaded = true
            this.frameWidth = Math.floor(this.image.width/this.frames)
            this.frameHeight = this.image.height
        }
        this.image.src = imageSrc;
    }
    getBounds(){
        return{x: this.x, y: this.y, width: this.width, height: this.height}
    }
    update(deltaTime){
        if(this.dead)return
        this.y += this.flyDir*this.flySpeed*deltaTime
        if(this.y > this.maxY){
            this.y=this.maxY
            this.flyDir = -1;
        }
        else if(this.y < this.minY){
            this.y = this.minY
            this.flyDir = 1
        }
    }
    draw(c,deltaTime){
        if(this.dead)return;
        if(!this.loaded){
            c.fillStyle = 'orange'
            c.fillRect(this.x, this.y, this.width, this.height)
            return
        }
        if(deltaTime){
            this.elapsedTime += deltaTime
            while(this.elapsedTime >= this.frameInterval){
                this.currentFrame = (this.currentFrame+1)%this.frames;
                this.elapsedTime -= this.frameInterval
            }
        }
        const sx = this.currentFrame * this.frameWidth;
        const sy = 0
        c.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, this.x, this.y, this.width, this.height)
    }
}

window.Eagle = Eagle;