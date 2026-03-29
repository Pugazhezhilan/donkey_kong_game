class Door{
    constructor({x,y,width=16,height=16}){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
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
        c.fillStyle = "yellow" 
        c.fillRect(this.x, this.y, this.width, this.height);
    }
}