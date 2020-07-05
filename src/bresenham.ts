
type bresenhamCallbackType = (x: number, y: number) => void;

export function Bresenham(
    startX : number, startY : number, 
    endX : number, endY : number,
    callback : bresenhamCallbackType) : void 
{
    var dx = Math.abs(endX - startX);
    var dy = Math.abs(endY - startY);

    var sx;
    var sy;
    if (startX < endX)
        sx = 1;
    else
        sx = -1;
    if (startY < endY)
        sy = 1;
    else
        sy = -1;
    
    var err = dx - dy;
    var x0 = startX;
    var y0 = startY;
    var x1 = endX;
    var y1 = endY;
    var i = 0;

    while ((x0 != x1) || (y0 != y1)) {

        callback(x0, y0);

        // var cellI = 
        //     THREE.MathUtils.clamp(x0, 
        //         /* min */ 0, 
        //         /* max */ waveSolver.GetCellCountX() - 1);
        // var cellJ = 
        //     THREE.MathUtils.clamp(y0,
        //         /* min */ 0, 
        //         /* max */ waveSolver.GetCellCountY() - 1);
        
        // waveSolver.AddVelocity(force, cellI, cellJ);

        var e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0 = x0 + sx;
        }
        if (e2 < dx) {
          err = err + dx;
          y0 = y0 + sy;
        }
    }
}