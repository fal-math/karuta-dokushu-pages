/** @typedef {import('./types.js').Card} Card */
import { saveState, loadState } from './storage.js';
import { CONSTANTS } from './constants.js';

export const state = {
    /** @type {Card[]} */
    cards: [],
    /** @type {Card[]} */
    deck: [],
    currentIndex: 1,
    /** @type {Set<number>} */
    selectedIds: new Set(CONSTANTS.INITIAL_SELECTED_IDS), // むすめふさほせ
    /** @type {'id'|'kimariji'|'kimariji-len'|'group'} */
    currentSort: 'group',
    unitSeconds: 1.0,
};

export const getters = {
    getCards: () => state.cards,
    getDeck: () => state.deck,
    getCurrentIndex: () => state.currentIndex,
    getSelectedIds: () => state.selectedIds,
    getCurrentSort: () => state.currentSort,
    getUnitSeconds: () => state.unitSeconds,
};

export const mutators = {
    setCards: (cards) => { state.cards = cards; },
    setDeck: (deck) => { state.deck = deck; },
    setCurrentIndex: (index) => { state.currentIndex = index; },
    setUnitSeconds: (sec) => { state.unitSeconds = sec; },
    setCurrentSort: (sort) => { state.currentSort = sort; },

    addSelectedId: (id) => { state.selectedIds.add(id); },
    deleteSelectedId: (id) => { state.selectedIds.delete(id); },
    clearSelectedIds: () => { state.selectedIds.clear(); },
    setSelectedIds: (ids) => { state.selectedIds = new Set(ids); },
};

export const persistence = {
    save: () => {
        saveState({
            deck: state.deck,
            currentIndex: state.currentIndex,
            unitSeconds: state.unitSeconds,
            selectedIds: Array.from(state.selectedIds)
        });
    },
    load: () => {
        const saved = loadState();
        if (saved) {
            if (saved.deck) state.deck = saved.deck;
            if (saved.currentIndex) state.currentIndex = saved.currentIndex;
            if (saved.unitSeconds) state.unitSeconds = saved.unitSeconds;
            if (saved.selectedIds) state.selectedIds = new Set(saved.selectedIds);
            return true;
        }
        return false;
    }
};
