import { describe, it, expect } from 'vitest';
import { LiveGuidanceEngine } from '../guidanceEngine.js';

describe('Live Camera Scanner: LiveGuidanceEngine', () => {
  it('smooths out transient frame glitches via temporal window', () => {
    const engine = new LiveGuidanceEngine({ historySize: 4, readyStreakRequired: 3 });

    // Initial state
    expect(engine.currentState).toBe('INITIALIZING');

    // Push NO_LEAF
    let res = engine.update('NO_LEAF');
    expect(res.state).toBe('INITIALIZING'); // Not enough history yet

    res = engine.update('NO_LEAF');
    expect(res.state).toBe('NO_LEAF'); // Transitioned after 2 frames

    // Single glitch frame: READY should not immediately flip the state
    res = engine.update('READY');
    expect(res.state).toBe('NO_LEAF'); // Glitch rejected!

    // Sustained READY frames
    engine.update('READY');
    res = engine.update('READY');
    expect(res.state).toBe('READY');
  });

  it('triggers isReady only after meeting the required consecutive streak', () => {
    const engine = new LiveGuidanceEngine({ historySize: 4, readyStreakRequired: 3 });

    engine.update('READY');
    engine.update('READY');
    let res = engine.update('READY');
    expect(res.state).toBe('READY');
    expect(res.isReady).toBe(false); // Only 2 consecutive after transition

    res = engine.update('READY');
    expect(res.state).toBe('READY');
    expect(res.isReady).toBe(true); // Reached 3 consecutive streak!
  });

  it('resets state cleanly when scanner is closed or reopened', () => {
    const engine = new LiveGuidanceEngine();
    engine.update('READY');
    engine.update('READY');
    engine.reset();

    expect(engine.currentState).toBe('INITIALIZING');
    expect(engine.history.length).toBe(0);
    expect(engine.consecutiveCount).toBe(0);
  });
});
