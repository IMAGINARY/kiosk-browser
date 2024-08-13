import Timeout from './idleTimeout';

class IdleDetector {
  constructor() {
    this.lastId = 0;
    this.timeouts = new Map();
  }

  setTimeout(func, timeoutDelay, ...args) {
    this.lastId += 1;
    const id = this.lastId;
    this.timeouts.set(id, new Timeout(true, func, timeoutDelay, ...args));
    return id;
  }

  setTimeoutOnce(func, timeoutDelay, ...args) {
    this.lastId += 1;
    const id = this.lastId;
    this.timeouts.set(id, new Timeout(false, func, timeoutDelay, ...args));
    return id;
  }

  clearTimeout(id) {
    const timer = this.timeouts.get(id);
    if (typeof timer !== 'undefined') timer.clear();
    this.timeouts.delete(id);
  }

  reset() {
    this.timeouts.forEach((timer) => timer.reset());
  }

  clear() {
    this.timeouts.forEach((timer) => timer.clear());
    this.timeouts.clear();
  }

  /**
   * Return the time in ms since the last interruption of the idle state.
   * @returns {number}
   */
  // eslint-disable-next-line class-methods-use-this
  getIdleTime() {
    return Timeout.getIdleTime();
  }

  // eslint-disable-next-line class-methods-use-this
  get IPC_CHANNEL() {
    return Timeout.IPC_CHANNEL;
  }

  // eslint-disable-next-line class-methods-use-this
  get IPC_INTERVAL_MS() {
    return Timeout.IPC_INTERVAL_MS;
  }
}

const idleDetector = new IdleDetector();
export default idleDetector;
