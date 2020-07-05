/**
 * Encapsulates delta time accounting.
 */
type timestepFunction = (timestep_sec : number) => void;

export class TimeManager {

    private readonly timestep_ms : number;
    private readonly timestep_sec : number;
    private readonly timestepLimitPerUpdate : number;

    private lastUpdateTime : number;
    private leftoverTime_ms : number;

    constructor(timestep_ms : number, timestepLimitPerUpdate : number) {
        this.timestep_ms = timestep_ms;
        this.timestep_sec = this.timestep_ms / 1000.0;
        this.timestepLimitPerUpdate = timestepLimitPerUpdate;
        this.lastUpdateTime = Date.now();
        this.leftoverTime_ms = 0;
    }

    /**
     * Based on the time since the last update, calls the given callback 
     * function with fixed sized timesteps to catch up with the current time.
     */
    Update(callback : timestepFunction) {
        let time = Date.now();
        
        let elapsed_ms = time - this.lastUpdateTime;

        // The timestepCount is the number of times we can fit a single timestep
        // in the total elapsed time plus any "leftover" fractional time from 
        // the last update.
        let timestepCount = 
            Math.floor((elapsed_ms + this.leftoverTime_ms) / this.timestep_ms);
        
        // The leftover time is any amount of time in the total elapsed time 
        // that can't fit int a single timestep.
        this.leftoverTime_ms = 
            (elapsed_ms + this.leftoverTime_ms) 
                - timestepCount * this.timestep_ms;

        // Clamp the timestep count to prevent any lag spikes from carrying over
        // too much.
        timestepCount = Math.min(timestepCount, this.timestepLimitPerUpdate);

        for (let i = 0; i < timestepCount; i++) {
            callback(this.timestep_sec);
        }

        // Remember this time as the last update time.
        this.lastUpdateTime = time;
    }
}