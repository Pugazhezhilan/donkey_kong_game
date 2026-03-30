class CheckPoint{
    constructor({x,y,width=16,height=32}){
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.activated = false
    }

    getBounds(){
        return{
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        }
    }
}