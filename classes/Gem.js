class Gem{
    constructor({x,y,size = 16,symbol,points = 10}){
        this.x = x
        this.y = y
        this.width = size
        this.height = size
        this.symbol = symbol
        this.points = points
        this.collected = false
        this.floatTime = Math.random() * Math.PI * 2
    }
    getBounds(){
        return {x : this.x, y: this.y, width: this.width, height: this.height,}
    }

    update(deltaTime){
        this.floatTime += deltaTime*3;
    }

    collect(){
        if(this.collected){
            return 0;
        }
        this.collected = true;
        return this.points;
    }

    draw(context, gemsImage, tileSize=16){
        if(this.collected)return;
        if(!gemsImage)return;

        const tilesPerRow = Math.max(1,Math.floor(gemsImage.width/tileSize))
        const tileIndex = this.symbol - 1;
        const srcX = (tileIndex % tilesPerRow) * tileSize;
        const srcY = Math.floor(tileIndex/tilesPerRow)*tileSize
        const bob = Math.sin(this.floatTime) * 1.5;
        const glow = 0.72 + (Math.sin(this.floatTime*2) + 1) * 0.14;

        context.save();
        context.globalAlpha = glow
        context.drawImage(gemsImage, srcX, srcY, tileSize, tileSize, this.x, this.y+bob, this.width, this.height)
        context.restore();
    }
}