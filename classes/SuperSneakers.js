class SuperSneakers{
    constructor({x,y,size=16,duration=8,jumpMultiplier=1.5}){
        this.x = x;
        this.y = y;
        this.size = size;
        this.duration = duration
        this.jumpMultiplier = jumpMultiplier;
        this.collected = false;
        this._t = 0;
        this._baseY = y;
    }

    getBounds(){
        return {
            x: this.x, y:this.y, width: this.size, height: this.size
        }
    }

    update(dt){
        if(this.collected){
            return;
        }
        this._t += dt;
        this.y = this._baseY + Math.sin(this._t*6)*2;
    }

    collect(player){
        if(this.collected){
            return;
        }
        this.collected = true;
        player.superSneakersActive = true;
        player.superSneakersTimeLeft = Math.max(player.superSneakersTimeLeft ?? 0, this.duration);
        player.superSneakersJumpMultiplier = this.jumpMultiplier;
    }

    draw(ctx){
        if(this.collected){
            return;
        }
        const img = window.__sneakersImage;
        if(img){
            ctx.drawImage(img, this.x, this.y, this.size, this.size);
        }
        else{
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(this.x, this.y, this.size, this.size);
            ctx.fillStyle = '#00333a';
            ctx.font = '10px monospace';
            ctx.fillText('SS',this.x+2,this.y+12);
        }
    }
}
window.SuperSneakers = SuperSneakers;