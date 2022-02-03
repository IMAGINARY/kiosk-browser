const { ipcMain, powerMonitor } = require('electron');
const { performance } = require('perf_hooks');

class Timeout {
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
    const systemIdleTime = Timeout.getIdleTime();
    if (systemIdleTime >= this.timeoutDelay) {
      if (this.repeat) this.reset();
      this.func(...this.args);
    } else {
      const idleTimeRemaining = this.timeoutDelay - systemIdleTime;
      this.timeoutId = setTimeout(this.testTimeoutCb, idleTimeRemaining);
    }
  }

  static resetIdleTime(idleTimeMs = 0) {
    Timeout.#LAST_EVENT_TIMESTAMP_MS = Math.max(
      performance.now() - idleTimeMs,
      Timeout.#LAST_EVENT_TIMESTAMP_MS
    );
  }

  static getIdleTime() {
    return Math.min(
      performance.now() - Timeout.#LAST_EVENT_TIMESTAMP_MS,
      powerMonitor.getSystemIdleTime() * 1000
    );
  }

  static #LAST_EVENT_TIMESTAMP_MS = performance.now();

  static IPC_CHANNEL = 'kiosk-browser-idle-detector-set-idle-time';

  static IPC_INTERVAL_MS = 500;
}

ipcMain.on(Timeout.IPC_CHANNEL, (event, idleTimeMs) =>
  Timeout.resetIdleTime(idleTimeMs)
);

module.exports = Timeout;
