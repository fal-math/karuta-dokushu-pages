/**
 * 歌データのレンダリングロジック
 */

export function renderParts(parts) {
    return parts.map(p => {
        if (typeof p === "string") return p;
        if (typeof p === "object" && "rb" in p && "rt" in p) {
            return `<ruby>${p.rb}<rt>${p.rt}</rt></ruby>`;
        }
        return "";
    }).join("");
}

export function renderTanka(lines, isNext) {
    if (lines.length !== 5) {
        console.error("一首は必ず5句である必要があります", lines);
        return "";
    }

    const upperLine1 = renderParts(lines[0]) + renderParts(lines[1]);
    const upperLine2 = renderParts(lines[2]);
    const lowerLine1 = renderParts(lines[3]);
    const lowerLine2 = renderParts(lines[4]);

    const greyUpper = isNext ? "" : " grey";
    const greyLower = isNext ? " grey" : "";

    return `
    <div class="upper${greyUpper}">${upperLine1}</div>
    <div class="upper${greyUpper}">${upperLine2}</div>
    <div class="lower${greyLower}">${lowerLine1}</div>
    <div class="lower${greyLower}">${lowerLine2}</div>
  `;
}
