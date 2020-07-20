const {powerMonitor} = require("electron");

class IdleDetector {
    constructor() {
        this.lastId = 0;
        this.timers = new Map();
    }

    setTimeout(func, timeoutDelay, ...args) {
        const id = ++this.lastId;
        this.timers.set(id, new Timer(true, func, timeoutDelay, ...args));
        return id;
    }

    setTimeoutOnce(func, timeoutDelay, ...args) {
        const id = ++this.lastId;
        this.timers.set(id, new Timer(false, func, timeoutDelay, ...args));
        return id;
    }

    clearTimeout(id) {
        const timer = this.timers.get(id);
        if (typeof timer !== undefined)
            timer.clear();
        this.timers.delete(id);
    }

    reset() {
        this.timers.forEach(timer => timer.reset());
    }

    clear() {
        this.timers.forEach(timer => timer.clear());
        this.timers.clear();
    }

    /***
     * Return the time in ms since the last interruption of the idle state
     * if there is at least one active (interval) timeout
     * registered. Otherwise returns -1;
     * @returns {number}
     */
    getIdleTime() {
        return powerMonitor.getSystemIdleTime() * 1000;
    }
}

class Timer {
    constructor(repeat, func, timeoutDelay, ...args) {
        this.repeat = repeat;
        this.func = func;
        this.timeoutDelay = timeoutDelay;
        this.args = args;
        this.timeoutId = 0;
        this.testTimeoutCb = () => this._testTimeout();
        this.reset();
    }

    reset() {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(this.testTimeoutCb, this.timeoutDelay);
    }

    clear() {
        clearTimeout(this.timeoutId);
    }

    _testTimeout() {
        const systemIdleTime = powerMonitor.getSystemIdleTime() * 1000;
        if (systemIdleTime >= this.timeoutDelay) {
            if (this.repeat)
                this.reset();
            this.func(...this.args);
        } else {
            const idleTimeRemaining = this.timeoutDelay - systemIdleTime;
            this.timeoutId = setTimeout(this.testTimeoutCb, idleTimeRemaining);
        }
    }
}

module.exports = new IdleDetector();
