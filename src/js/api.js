import { CONFIG } from './config.js';

/**
 * @typedef {import('./types.js').Card} Card
 * @typedef {Object} JokaData
 * @property {number} id
 * @property {string} kimariji
 * @property {Array<Array<string|{rb:string, rt:string}>>} lines
 */

let jokaCache = null;
let cardsCache = null;

export const api = {
    /**
     * Fetch Joka data.
     * @returns {Promise<JokaData>}
     */
    fetchJoka: async () => {
        if (jokaCache) return jokaCache;
        const res = await fetch(CONFIG.JOKA_URL);
        jokaCache = await res.json();
        return jokaCache;
    },

    /**
     * Fetch all 100 karuta data.
     * @returns {Promise<Card[]>}
     */
    fetchCards: async () => {
        if (cardsCache) return cardsCache;
        const res = await fetch(CONFIG.HYAKUNIN_URL);
        cardsCache = await res.json();
        return cardsCache;
    }
};
