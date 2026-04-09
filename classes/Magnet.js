class Magnet{
    constructor({x,y,size=16,duration=8,radius=140}){
        this.x = x;
        this.y = y;
        this.size = size;
        this.duration = duration;
        this.radius = radius;
        this.collected = false;
    }

    getBounds(){
        return{
            x:this.x,
            y:this.y,
            width:this.size,
            height: this.size
        }
    }

    collect(player){
        if(this.collected){
            return
        }
        this.collected = true;
        player.magnetActive = true;
        player.magnetTimeLeft = Math.max(
            player.magnetTimeLeft ?? 0, this.duration
        );
        player.magnetRadius = this.radius;
    }

    draw(ctx){
        if(this.collected)return;
        ctx.save();
        ctx.fillStyle="#ff4df8";
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.fillStyle = "#111";
        ctx.font = "12px monospace";
        ctx.fillText("M", this.x+4, this.y+12);
        ctx.restore();
    }
}
window.Magnet = Magnet;