/**
 * 円グラフタイマーの制御ロジック
 */

export const SEGMENT_COLORS = [
  getComputedStyle(document.documentElement).getPropertyValue('--c0').trim() || '#22c55e',
  getComputedStyle(document.documentElement).getPropertyValue('--c1').trim() || '#f59e0b',
  getComputedStyle(document.documentElement).getPropertyValue('--c2').trim() || '#3b82f6',
  getComputedStyle(document.documentElement).getPropertyValue('--c3').trim() || '#ef4444',
];

let isTimerRunning = false;
let rafId = null;
let timerStartMs = 0;
let carriedElapsedMs = 0;

export function paintSegmentsRing(element, segmentUnits) {
  const totalUnits = segmentUnits.reduce((s, v) => s + v, 0);
  let acc = 0;
  const stops = [];
  for (let i = 0; i < segmentUnits.length; i++) {
    const start = (acc / totalUnits) * 360;
    acc += segmentUnits[i];
    const end = (acc / totalUnits) * 360;
    stops.push(`${SEGMENT_COLORS[i]} ${start}deg ${end}deg`);
  }
  element.style.background = `conic-gradient(from 0deg, ${stops.join(',')})`;
}

export function currentSegmentIndex(elapsedMs, unitSec, cumulativeUnits) {
  const elapsedUnits = elapsedMs / (1000 * unitSec);
  for (let i = 0; i < cumulativeUnits.length; i++) {
    if (elapsedUnits < cumulativeUnits[i]) return i;
  }
  return cumulativeUnits.length - 1;
}

export function startTimer(options, segmentUnits) {
  const { onUpdate, onComplete, getUnitSec } = options;
  if (isTimerRunning) return;

  const totalUnits = segmentUnits.reduce((s, v) => s + v, 0);
  const cumulativeUnits = segmentUnits.reduce((arr, u) => {
    arr.push((arr.at(-1) || 0) + u);
    return arr;
  }, []);

  isTimerRunning = true;
  timerStartMs = performance.now();

  const loop = (now) => {
    if (!isTimerRunning) return;

    const unitSec = getUnitSec();
    const elapsed = carriedElapsedMs + (now - timerStartMs);
    const totalMs = totalUnits * 1000 * unitSec;
    const clamped = Math.min(elapsed, totalMs);

    onUpdate({
      clamped,
      totalMs,
      segIdx: currentSegmentIndex(clamped, unitSec, cumulativeUnits),
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
