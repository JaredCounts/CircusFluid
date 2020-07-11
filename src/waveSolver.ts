import { BresenhamFilledCircle } from './bresenham'
import * as THREE from 'three';

export class WaveSolver {
    private readonly _velocity: number[][];
    private readonly _density: number[][];

    private readonly _prevVelocity: number[][];
    private readonly _prevDensity: number[][];

    private readonly _friction: number;
    private readonly _speed: number;

    constructor(cellCountX: number, cellCountY: number) {
        this._velocity = [];
        this._density = [];

        this._prevVelocity = [];
        this._prevDensity = [];

        this._friction = 0.992;
        this._speed = 50;

        // Fill the 2D arrays with all zeroes.
        for (let i = 0; i < cellCountX; i++) {
            this._velocity[i] = [];
            this._density[i] = [];
            
            this._prevVelocity[i] = [];
            this._prevDensity[i] = [];

            for (let j = 0; j < cellCountY; j++) {
                this._velocity[i][j] = 0.0;
                this._density[i][j] = 0.0;

                this._prevVelocity[i][j] = 0.0;
                this._prevDensity[i][j] = 0.0; 
            }
        }
    }

    Solve(timeStep : number) : void {
        for (let i = 0; i < this._velocity.length; i++) {
            for (let j = 0; j < this._velocity[i].length; j++) {
                this._prevVelocity[i][j] = this._velocity[i][j];
                this._prevDensity[i][j] = this._density[i][j]; 
            }
        }

        for (let i = 0; i < this._velocity.length; i++) {
            for (let j = 0; j < this._velocity[i].length; j++) {
                const densDiff = 
                    this._GetAdjacentSum(this._prevDensity, i, j) 
                    - 4.0 * this._prevDensity[i][j];
                
                const force = densDiff * this._speed * this._speed;

                this._velocity[i][j] = 
                    this._friction * this._prevVelocity[i][j] 
                    + force * timeStep;
                
                this._density[i][j] += this._velocity[i][j] * timeStep;
            }
        }
    }

    /**
     * Add velocity around the cell (i,j). This automatically clamps the indices
     * given.
     *
     */
    AddVelocity(amount: number, i: number, j: number) : void {
        const radius = 5;
        const area = 3.1415 * radius * radius;
        const amountPerCell = amount/area;
        BresenhamFilledCircle(
            i, j, radius, 
            this._ClampedAddVelocity.bind(this, amountPerCell));
    }

    GetCellCountX() : number {
        return this._velocity.length;
    }

    GetCellCountY() : number {
        return this._velocity[0].length;
    }

    /**
     * Get the density at cell (i, j).
     * timeSinceLastUpdate_timestep is the time since the last update, in units
     * of timestep size. This function extrapolates from the previously computed 
     * value using the timeSinceLastUpdate given.
     */
    GetDensity(i: number, j: number, timeSinceLastUpdate_timestep: number) : number {
        // console.log("get density");
        return this._Extrapolate(
            this._prevDensity[Math.floor(i)][Math.floor(j)],
            this._density[Math.floor(i)][Math.floor(j)],
            timeSinceLastUpdate_timestep);
    }

    /**
     * Get the velocity at cell (i, j).
     * timeSinceLastUpdate_timestep is the time since the last update, in units
     * of timestep size. This function extrapolates from the previously computed 
     * value using the timeSinceLastUpdate given.
     *
     * The value is smoothed by getting averaged with adjacent values before 
     * getting returned.
     */
    GetVelocitySmoothed(i: number, j: number, timeSinceLastUpdate_timestep: number) {
        // XXX: Ideally we'd use a gaussian kernel for smoothing.
        const prevVelocity = 
            (this._prevVelocity[i][j]
                + this._GetAdjacentSum(this._prevVelocity, i, j)) / 5;
        const currVelocity = 
            (this._velocity[i][j]
                + this._GetAdjacentSum(this._velocity, i, j)) / 5;

        return this._Extrapolate(
            prevVelocity, currVelocity, timeSinceLastUpdate_timestep);
    }

    private _ClampedAddVelocity(amount: number, i: number, j: number) {
        const cellI = 
            THREE.MathUtils.clamp(i, 
                /* min */ 0, 
                /* max */ this.GetCellCountX() - 1);
        const cellJ = 
            THREE.MathUtils.clamp(j,
                /* min */ 0, 
                /* max */ this.GetCellCountY() - 1);
        
        this._velocity[Math.floor(cellI)][Math.floor(cellJ)] += amount;
    }

    /**
     * Extrapolate from the previous and current values given an extrapolation 
     * amount. The previous value is assumed to be at time = -1, current value
     * at time = 0. The extrapolation amount is the time after 0.
     */
    private _Extrapolate(prevVal : number, currVal : number, amount: number) : number {
        return (currVal - prevVal) * amount + currVal;
    }

    private _GetAdjacentSum(arr: number[][], i: number, j: number) : number {
        let sum = 0;

        sum += arr[Math.max(i-1, 0)][j];
        sum += arr[i][Math.max(j-1, 0)];

        sum += arr[Math.min(i+1, arr.length-1)][j];
        sum += arr[i][Math.min(j+1, arr[i].length-1)];

        return sum;
    }

}