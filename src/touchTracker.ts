export class TouchTracker {

    private posX: number;
    private posY: number;

    private prevPosX: number; 
    private prevPosY: number;

    constructor(posX: number, posY: number) {
        this.posX = posX;
        this.posY = posY;

        this.prevPosX = posX;
        this.prevPosY = posY;
    }
    
    SetPos(posX: number, posY: number) : void {
        this.prevPosX = this.posX;
        this.prevPosY = this.posY;

        this.posX = posX;
        this.posY = posY;
    }

    GetPosX() : number {
        return this.posX;
    } 
    GetPosY() : number {
        return this.posY;
    }

    GetPrevPosX() : number {
        return this.prevPosX;
    } 
    GetPrevPosY() : number {
        return this.prevPosY;
    }
}
