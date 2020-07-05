export class WaveSolver {
    private velocity: number[][];
    private density: number[][];

    private friction: number;
    private speed: number;

    constructor(cellCountX: number, cellCountY: number) {
        this.velocity = [];
        this.density = [];

        this.friction = 0.58;
        this.speed = 20.0;

        // Fill the 2D arrays with all zeroes.
        for (var i = 0; i < cellCountX; i++) {
            this.velocity[i] = [];
            this.density[i] = [];

            for (var j = 0; j < cellCountY; j++) {
                this.velocity[i][j] = 0.0;
                this.density[i][j] = 0.0;
            }
        }
    }

    Solve(timeStep: number) {
        // xxx: My old code had some logic errors that ended up giving pretty
        // neat results. Using the proper wave equations here gives something
        // more physically accurate, but I've not been able to tune the 
        // parameters to get them to match what I had before.
        for (var i = 0; i < this.velocity.length; i++) {
            for (var j = 0; j < this.velocity[i].length; j++) {
                var densDiff = this._GetAdjacentSum(this.density, i, j) - 4.0 * this.density[i][j];
                this.velocity[i][j] = this.friction * this.velocity[i][j] + densDiff * timeStep * this.speed;
                this.density[i][j] += this.velocity[i][j];
            }
        }
    }

    AddVelocity(amount: number, i: number, j: number) : void {
        this.velocity[Math.floor(i)][Math.floor(j)] += amount;
    }

    GetCellCountX() : number {
        return this.velocity.length;
    }

    GetCellCountY() : number {
        return this.velocity[0].length;
    }

    GetDensity(i: number, j: number) : number {
        return this.density[Math.floor(i)][Math.floor(j)];
    }

    GetVelocity(i: number, j: number) : number {
        return this.velocity[Math.floor(i)][Math.floor(j)];
    }

    private _GetAdjacentSum(arr: number[][], i: number, j: number) : number {
        var sum = 0;

        sum += arr[Math.max(i-1, 0)][j];
        sum += arr[i][Math.max(j-1, 0)];

        sum += arr[Math.min(i+1, arr.length-1)][j];
        sum += arr[i][Math.min(j+1, arr[i].length-1)];

        return sum;
    }

}