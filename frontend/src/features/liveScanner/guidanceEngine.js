// F1 Advanced: Guidance Engine with Temporal Smoothing & Hysteresis
// Centralized guidance decision engine that prevents rapid flickering.

export const GUIDANCE_PRIORITIES = {
  INITIALIZING: 0,
  NO_LEAF: 10,
  DARK: 20,
  BRIGHT: 30,
  BLURRY: 40,
  MOVE_LEFT: 50,
  MOVE_RIGHT: 50,
  MOVE_UP: 50,
  MOVE_DOWN: 50,
  MOVE_CLOSER: 60,
  MOVE_AWAY: 60,
  READY: 100,
};

export class LiveGuidanceEngine {
  /**
   * @param {Object} options
   * @param {number} [options.historySize=4] - Rolling buffer length
   * @param {number} [options.readyStreakRequired=3] - Consecutive frames needed to trigger READY
   */
  constructor(options = {}) {
    this.historySize = options.historySize || 4;
    this.readyStreakRequired = options.readyStreakRequired || 3;
    this.history = [];
    this.currentState = 'INITIALIZING';
    this.consecutiveCount = 0;
  }

  /**
   * Pushes a raw frame classification and returns the temporally smoothed guidance.
   *
   * @param {string} rawCandidateState - Output of classifyLeafFraming
   * @returns {{ state: string, isReady: boolean, consecutiveCount: number }}
   */
  update(rawCandidateState) {
    this.history.push(rawCandidateState);
    if (this.history.length > this.historySize) {
      this.history.shift();
    }

    if (rawCandidateState === this.currentState) {
      this.consecutiveCount++;
    } else {
      // Check if the new state has appeared consistently in the recent window
      const countInWindow = this.history.filter((s) => s === rawCandidateState).length;
      if (countInWindow >= 2 || rawCandidateState === 'DARK' || rawCandidateState === 'BRIGHT') {
        this.currentState = rawCandidateState;
        this.consecutiveCount = 1;
      }
    }

    const isReady = this.currentState === 'READY' && this.consecutiveCount >= this.readyStreakRequired;

    return {
      state: this.currentState,
      isReady,
      consecutiveCount: this.consecutiveCount,
    };
  }

  reset() {
    this.history = [];
    this.currentState = 'INITIALIZING';
    this.consecutiveCount = 0;
  }
}
