/** @typedef {import('./types.js').AppState} AppState */

const STORAGE_KEY = 'karuta-dokushu-state';

/**
 * 状態を保存する
 * @param {AppState} state - 保存する状態オブジェクト
 */
export function saveState(state) {
    try {
        const data = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
        console.error('Failed to save state to localStorage', e);
    }
}

/**
 * 保存された状態を読み込む
 * @returns {AppState|null}
 */
export function loadState() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to load state from localStorage', e);
        return null;
    }
}

/**
 * 保存された状態をクリアする
 */
export function clearState() {
    localStorage.removeItem(STORAGE_KEY);
}
