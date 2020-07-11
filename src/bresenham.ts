type bresenhamCallbackType = (x: number, y: number) => void;

/**
 * Run bresenham's line algorithm from the start position to the end position,
 * and perform the given callback function on each integer point between those
 * two positions. 
 * Based on http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
 */
export function BresenhamLine(
    startX : number, startY : number, 
    endX : number, endY : number,
    callback : bresenhamCallbackType) : void 
{
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);

    const sx = startX < endX ? 1 : -1;
    const sy = startY < endY ? 1 : -1;
    
    let err = dx - dy;
    let x = startX;
    let y = startY;

    while (x != endX || y != endY) {
        callback(x, y);

        let e2 = 2 * err;
        
        if (e2 > -dy) {
          err -= dy;
          x = x + sx;
        }

        if (e2 < dx) {
          err = err + dx;
          y = y + sy;
        }
    }
}

/**
 * Use Bresenham's line algorithm to draw a filled circle
 * Based on http://actionsnippet.com/?p=496
 */
export function BresenhamFilledCircle(
    centerX : number, centerY : number, 
    radius : number,
    callback : bresenhamCallbackType) : void 
{
    let xoff =0;
    let yoff = radius;
    let balance = -radius;
 
    while (xoff <= yoff) {
         let p0 = centerX - xoff;
         let p1 = centerX - yoff;
         
         let w0 = xoff + xoff;
         let w1 = yoff + yoff;
         
         BresenhamLine(p0, centerY + yoff, p0 + w0, centerY + yoff, callback);
         BresenhamLine(p0, centerY - yoff, p0 + w0, centerY - yoff, callback);
         
         BresenhamLine(p1, centerY + xoff, p1 + w1, centerY + xoff, callback);
         BresenhamLine(p1, centerY - xoff, p1 + w1, centerY - xoff, callback);
       
        if ((balance += xoff++ + xoff)>= 0) {
            balance-=--yoff+yoff;
        }
    }
}