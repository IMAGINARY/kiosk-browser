const { powerMonitor, ipcMain } = require("electron");
const { performance } = require('perf_hooks');

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
   * Return the time in ms since the last interruption of the idle state.
   * @returns {number}
   */
  getIdleTime() {
    return Timer.getIdleTime();
  }

  get IPC_CHANNEL() {
    return Timer.IPC_CHANNEL;
  }

  get IPC_INTERVAL_MS() {
    return Timer.IPC_INTERVAL_MS;
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
    const systemIdleTime = Timer.getIdleTime();
    if (systemIdleTime >= this.timeoutDelay) {
      if (this.repeat)
        this.reset();
      this.func(...this.args);
    } else {
      const idleTimeRemaining = this.timeoutDelay - systemIdleTime;
      this.timeoutId = setTimeout(this.testTimeoutCb, idleTimeRemaining);
    }
  }

  static resetIdleTime(idleTimeMs = 0) {
    Timer._lastEventTimestampMs = Math.max(
      performance.now() - idleTimeMs,
      Timer._lastEventTimestampMs,
    );
  }

  static getIdleTime() {
    return Math.min(
      performance.now() - Timer._lastEventTimestampMs,
      powerMonitor.getSystemIdleTime() * 1000
    );
  }

  static _lastEventTimestampMs = performance.now();

  static IPC_CHANNEL = 'kiosk-browser-idle-detector-set-idle-time';
  static IPC_INTERVAL_MS = 500;
}

ipcMain.on(Timer.IPC_CHANNEL, (event, idleTimeMs) => Timer.resetIdleTime(idleTimeMs));

module.exports = new IdleDetector();
