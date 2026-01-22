/**
 * 円グラフタイマーの制御ロジック
 */

export const SEGMENT_UNITS = [5, 3, 1, 6];
export const SEGMENT_COLORS = [
  getComputedStyle(document.documentElement).getPropertyValue('--c0').trim() || '#22c55e',
  getComputedStyle(document.documentElement).getPropertyValue('--c1').trim() || '#f59e0b',
  getComputedStyle(document.documentElement).getPropertyValue('--c2').trim() || '#3b82f6',
  getComputedStyle(document.documentElement).getPropertyValue('--c3').trim() || '#ef4444',
];

const TOTAL_UNITS = SEGMENT_UNITS.reduce((s, v) => s + v, 0);
const CUMULATIVE_UNITS = SEGMENT_UNITS.reduce((arr, u) => {
  arr.push((arr.at(-1) || 0) + u);
  return arr;
}, []);

let isTimerRunning = false;
let rafId = null;
let timerStartMs = 0;
let carriedElapsedMs = 0;

export function paintSegmentsRing(element) {
  let acc = 0;
  const stops = [];
  for (let i = 0; i < SEGMENT_UNITS.length; i++) {
    const start = (acc / TOTAL_UNITS) * 360;
    acc += SEGMENT_UNITS[i];
    const end = (acc / TOTAL_UNITS) * 360;
    stops.push(`${SEGMENT_COLORS[i]} ${start}deg ${end}deg`);
  }
  element.style.background = `conic-gradient(from 0deg, ${stops.join(',')})`;
}

export function currentSegmentIndex(elapsedMs, unitSec) {
  const elapsedUnits = elapsedMs / (1000 * unitSec);
  for (let i = 0; i < CUMULATIVE_UNITS.length; i++) {
    if (elapsedUnits < CUMULATIVE_UNITS[i]) return i;
  }
  return CUMULATIVE_UNITS.length - 1;
}

export function startTimer(options) {
  const { onUpdate, onComplete, getUnitSec } = options;
  if (isTimerRunning) return;

  isTimerRunning = true;
  timerStartMs = performance.now();

  const loop = (now) => {
    if (!isTimerRunning) return;

    const unitSec = getUnitSec();
    const elapsed = carriedElapsedMs + (now - timerStartMs);
    const totalMs = TOTAL_UNITS * 1000 * unitSec;
    const clamped = Math.min(elapsed, totalMs);

    onUpdate({
      clamped,
      totalMs,
      segIdx: currentSegmentIndex(clamped, unitSec),
      fraction: clamped / totalMs
    });

    if (elapsed >= totalMs) {
      isTimerRunning = false;
      carriedElapsedMs = totalMs;
      onComplete();
      return;
    }
    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);
}

export function resetTimer(options) {
  const { onReset } = options;
  isTimerRunning = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  carriedElapsedMs = 0;
  timerStartMs = 0;
  onReset();
}

export function isRunning() {
  return isTimerRunning;
}
