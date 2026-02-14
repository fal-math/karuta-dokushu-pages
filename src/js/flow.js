import { getters, mutators, persistence } from './state.js';
import { renderTanka } from './cardRender.js';
import { startTimer, resetTimer, paintSegmentsRing } from './timer.js';
import { api } from './api.js';
import { CONFIG } from './config.js';
import { CONSTANTS } from './constants.js';

let els = {}; // DOM Elements container

export function initFlow(domElements) {
    els = domElements;
}

export function renderCurrentCard() {
    const deck = getters.getDeck();
    const currentIndex = getters.getCurrentIndex();

    if (!deck || deck.length < 2) return;

    const currentCard = deck[currentIndex];
    const prevCard = currentIndex > 0 ? deck[currentIndex - 1] : null;

    if (els.nextCard) els.nextCard.innerHTML = renderTanka(currentCard.lines, true);
    if (els.prevCard) els.prevCard.innerHTML = prevCard ? renderTanka(prevCard.lines, false) : "???";

    if (els.progressLabel) els.progressLabel.textContent = `${currentIndex} / ${deck.length - 1}`;

    if (els.btnPrev) els.btnPrev.disabled = (currentIndex === 1);
    if (els.btnNext) els.btnNext.disabled = (currentIndex === deck.length - 1);
}

export function goPrev() {
    const currentIndex = getters.getCurrentIndex();
    if (currentIndex > 1) {
        mutators.setCurrentIndex(currentIndex - 1);
        renderCurrentCard();
        persistence.save();
    }
}

export function goNext() {
    const deck = getters.getDeck();
    const currentIndex = getters.getCurrentIndex();

    if (currentIndex < deck.length - 1) {
        handleReset();
        mutators.setCurrentIndex(currentIndex + 1);
        renderCurrentCard();
        persistence.save();
    }
}

export async function setupDeck(ids) {
    const cards = getters.getCards();
    const jokaRes = await api.fetchJoka();
    const filteredCards = cards.filter(c => ids.includes(c.id));

    // Fisher-Yates Shuffle
    for (let i = filteredCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredCards[i], filteredCards[j]] = [filteredCards[j], filteredCards[i]];
    }

    const newDeck = [jokaRes, ...filteredCards];
    mutators.setDeck(newDeck);
    mutators.setCurrentIndex(1);

    handleReset();
    renderCurrentCard();
    persistence.save();
}

export function handleStart() {
    const unitSec = getters.getUnitSeconds();

    startTimer({
        getUnitSec: () => Math.max(unitSec || CONFIG.DEFAULT_UNIT_SECONDS, CONFIG.MIN_UNIT_SECONDS),
        onUpdate: ({ fraction, segIdx }) => {
            if (els.elapsedOverlay) els.elapsedOverlay.style.setProperty('--deg', (fraction * 360) + 'deg');
            if (els.segmentLabel) els.segmentLabel.textContent = CONFIG.SEGMENT_LABELS[segIdx];
        },
        onComplete: () => {
            if (els.btnStartTimer) els.btnStartTimer.disabled = false;
        }
    }, CONSTANTS.SEGMENT_UNITS);
    if (els.btnStartTimer) els.btnStartTimer.disabled = true;
}

export function handleReset() {
    resetTimer({
        onReset: () => {
            if (els.elapsedOverlay) els.elapsedOverlay.style.setProperty('--deg', '0deg');
            if (els.segmentLabel) els.segmentLabel.textContent = `---`;
            if (els.btnStartTimer) els.btnStartTimer.disabled = false;
        }
    });
}

export function handleUnitSecondsChange(value) {
    const val = parseFloat(value);
    mutators.setUnitSeconds(Object.is(NaN, val) ? 1.0 : val);
    handleReset(); // Reset timer visual
    if (els.segmentsRing) paintSegmentsRing(els.segmentsRing);
    persistence.save();
}

export function showStart() {
    if (els.startScreen) els.startScreen.classList.remove('hidden');
    if (els.appMain) els.appMain.classList.add('hidden');
}

export function showMain() {
    if (els.startScreen) els.startScreen.classList.add('hidden');
    if (els.appMain) els.appMain.classList.remove('hidden');
    renderCurrentCard();
}

export function exitToStart() {
    if (!confirm('練習を終了してスタート画面に戻りますか？（現在の進捗はリセットされます）')) return;

    handleReset();

    mutators.setDeck([]);
    mutators.setCurrentIndex(1);
    persistence.save();

    if (els.menuPanel) els.menuPanel.classList.add("hidden");
    showStart();
}
