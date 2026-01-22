/**
 * @typedef {Object} CardPart
 * @property {string} [rb] - 漢字（ルビを振る対象）
 * @property {string} [rt] - 読み（ルビ）
 */

/**
 * @typedef {Array<string|CardPart>} CardLine
 */

/**
 * @typedef {Object} Card
 * @property {number} id - 札番号
 * @property {string|null} kimariji - 決まり字
 * @property {CardLine[]} lines - 歌詞（5句分）
 */

/**
 * @typedef {Object} AppState
 * @property {Card[]} deck - 現在のデッキ（シャッフル済みの可能性あり）
 * @property {number} currentIndex - 現在の札のインデックス
 * @property {number} unitSeconds - 1ユニットあたりの秒数
 */

export { };
