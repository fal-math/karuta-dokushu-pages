export function updateClock(clockEl) {
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
    const now = new Date();
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const day = now.getDay();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    clockEl.textContent = `${MM}/${dd}(${weekdays[day]}) ${hh}:${mm}:${ss}`;
}
