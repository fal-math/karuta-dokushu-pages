/** @typedef {import('./types.js').Card} Card */
/** @typedef {import('./types.js').AppState} AppState */

import { paintSegmentsRing, startTimer, resetTimer } from './timer.js';
import { renderTanka } from './cardRender.js';
import { saveState, loadState } from './storage.js';
import { updateClock } from './clock.js';

/* =======================
   状態管理
======================= */
/** @type {Card[]} */
let cards = [];
/** @type {Card[]} */
let deck = [];
/** @type {number} */
let currentIndex = 1;

const JOKA_URL = './src/data/joka.json';
const HYAKUNIN_URL = './src/data/hyakunin_isshu.json';

/* =======================
   DOM 参照
======================= */
const prevCardEl = document.getElementById('prevCard');
const nextCardEl = document.getElementById('nextCard');
const btnPrevEl = document.getElementById('btnPrev');
const btnNextEl = document.getElementById('btnNext');
const progressLabelEl = document.getElementById('progressLabel');
const segmentsRingEl = document.getElementById('segments');
const elapsedOverlayEl = document.getElementById('elapsed');
const segmentLabelEl = document.getElementById('segmentLabel');
const unitSecondsInputEl = document.getElementById('unitSeconds');
const btnStartTimerEl = document.getElementById('btnStartTimer');
const btnResetTimerEl = document.getElementById('btnResetTimer');
const menuToggleEl = document.getElementById("menuToggle");
const menuPanelEl = document.getElementById("menuPanel");
const clockEl = document.getElementById("clock");
const startScreenEl = document.getElementById('startScreen');
const pickerOverlayEl = document.getElementById('pickerOverlay');
const appMainEl = document.getElementById('appMain');
const cardGridEl = document.getElementById('cardGrid');
const btnStartAllEl = document.getElementById('btnStartAll');
const btnOpenPickerEl = document.getElementById('btnOpenPicker');
const btnClosePickerEl = document.getElementById('btnClosePicker');
const btnStartSelectedEl = document.getElementById('btnStartSelected');
const btnSelectAllEl = document.getElementById('btnSelectAll');
const btnDeselectAllEl = document.getElementById('btnDeselectAll');

/** @type {Set<number>} */
let selectedIds = new Set();

/* =======================
   初期化とイベント設定
======================= */

async function init() {
    // 時計開始
    updateClock(clockEl);
    setInterval(() => updateClock(clockEl), 1000);

    // タイマー初期描画
    paintSegmentsRing(segmentsRingEl);

    // データ読込み
    try {
        const [jokaRes, cardsRes] = await Promise.all([
            fetch(JOKA_URL).then(r => r.json()),
            fetch(HYAKUNIN_URL).then(r => r.json())
        ]);
        cards = cardsRes;

        // 保存された状態の復元
        const saved = loadState();
        if (saved && saved.deck) {
            deck = saved.deck;
            currentIndex = saved.currentIndex || 1;
            unitSecondsInputEl.value = saved.unitSeconds || 1.0;
            selectedIds = new Set(saved.selectedIds || []);

            // 既に練習開始している場合はアプリ画面を表示
            showMain();
        } else {
            // 初期状態はスタート画面を表示
            showStart();
        }

        generatePicker();
    } catch (e) {
        console.error("Failed to load data", e);
    }

    renderCurrentCard();
    handleReset();

    // イベント登録
    btnPrevEl.addEventListener('click', goPrev);
    btnNextEl.addEventListener('click', goNext);
    btnStartTimerEl.addEventListener('click', handleStart);
    btnResetTimerEl.addEventListener('click', handleReset);
    unitSecondsInputEl.addEventListener('change', () => {
        handleReset();
        paintSegmentsRing(segmentsRingEl);
        triggerSave();
    });

    // モード選択系
    btnStartAllEl.addEventListener('click', () => {
        setupDeck(cards.map(c => c.id));
        showMain();
    });

    btnOpenPickerEl.addEventListener('click', () => {
        pickerOverlayEl.classList.remove('hidden');
    });

    btnClosePickerEl.addEventListener('click', () => {
        pickerOverlayEl.classList.add('hidden');
    });

    btnSelectAllEl.addEventListener('click', () => {
        cards.forEach(c => selectedIds.add(c.id));
        updatePickerUI();
    });

    btnDeselectAllEl.addEventListener('click', () => {
        selectedIds.clear();
        updatePickerUI();
    });

    btnStartSelectedEl.addEventListener('click', () => {
        if (selectedIds.size === 0) {
            alert('札を1つ以上選択してください');
            return;
        }
        setupDeck(Array.from(selectedIds));
        pickerOverlayEl.classList.add('hidden');
        showMain();
    });

    // 練習を終了してスタート画面に戻る
    window.exitToStart = () => {
        if (!confirm('練習を終了してスタート画面に戻りますか？（現在の進捗はリセットされます）')) return;

        handleReset(); // タイマー停止とリセット

        // 状態をクリアして初期化
        deck = [];
        currentIndex = 1;
        saveState({
            deck: [],
            currentIndex: 1,
            unitSeconds: parseFloat(unitSecondsInputEl.value),
            selectedIds: Array.from(selectedIds)
        });

        menuPanelEl.classList.add("hidden");
        showStart();
    };

    menuToggleEl.addEventListener("click", () => menuPanelEl.classList.toggle("hidden"));
    document.addEventListener("click", (e) => {
        if (!menuPanelEl.contains(e.target) && !menuToggleEl.contains(e.target)) {
            menuPanelEl.classList.add("hidden");
        }
    });
}

function renderCurrentCard() {
    if (deck.length < 2) return;
    const currentCard = deck[currentIndex];
    const prevCard = currentIndex > 0 ? deck[currentIndex - 1] : null;

    nextCardEl.innerHTML = renderTanka(currentCard.lines, true);
    prevCardEl.innerHTML = prevCard ? renderTanka(prevCard.lines, false) : "???";

    progressLabelEl.textContent = `${currentIndex}/${deck.length - 1}`;
    btnPrevEl.disabled = (currentIndex === 1);
    // btnNextEl.disabled = (currentIndex === deck.length - 1);
}

function goPrev() {
    if (currentIndex > 1) {
        currentIndex -= 1;
        renderCurrentCard();
        triggerSave();
    }
}

function goNext() {
    if (currentIndex < deck.length - 1) {
        handleReset();
        currentIndex += 1;
        renderCurrentCard();
        triggerSave();
    } else if (currentIndex === deck.length - 1) {
        alert('すべての札を読み終えました！');
    }
}

function triggerSave() {
    saveState({
        deck,
        currentIndex,
        unitSeconds: parseFloat(unitSecondsInputEl.value),
        selectedIds: Array.from(selectedIds)
    });
}

/**
 * 画面表示制御
 */
function showStart() {
    startScreenEl.classList.remove('hidden');
    appMainEl.classList.add('hidden');
}

function showMain() {
    startScreenEl.classList.add('hidden');
    appMainEl.classList.remove('hidden');
    renderCurrentCard();
}

/**
 * ピッカー生成
 */
function generatePicker() {
    cardGridEl.innerHTML = '';
    cards.forEach(card => {
        const item = document.createElement('div');
        item.className = 'card-item';
        if (selectedIds.has(card.id)) item.classList.add('selected');

        // 「あき(1)」のような表示形式
        item.textContent = `${card.kimariji || '??'}`;

        item.addEventListener('click', () => {
            if (selectedIds.has(card.id)) {
                selectedIds.delete(card.id);
                item.classList.remove('selected');
            } else {
                selectedIds.add(card.id);
                item.classList.add('selected');
            }
        });
        cardGridEl.appendChild(item);
    });
}

function updatePickerUI() {
    const items = cardGridEl.querySelectorAll('.card-item');
    items.forEach((item, index) => {
        const id = cards[index].id;
        if (selectedIds.has(id)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

/**
 * デッキ構築
 */
async function setupDeck(ids) {
    const jokaRes = await fetch(JOKA_URL).then(r => r.json());
    const filteredCards = cards.filter(c => ids.includes(c.id));

    // シャッフル機能もここに関連付けることも可能だが、
    // まずは選択された順（または番号順）で作成
    deck = [jokaRes, ...filteredCards];
    currentIndex = 1;

    handleReset();
    renderCurrentCard();
    triggerSave();
}

function handleStart() {
    const segmentLabelArray = ["下の句", "余韻", "間合い", "上の句"];
    startTimer({
        getUnitSec: () => Math.max(parseFloat(unitSecondsInputEl.value) || 1, 0.1),
        onUpdate: ({ fraction, segIdx }) => {
            elapsedOverlayEl.style.setProperty('--deg', (fraction * 360) + 'deg');
            segmentLabelEl.textContent = segmentLabelArray[segIdx];
        },
        onComplete: () => {
            btnStartTimerEl.disabled = false;
        }
    });
    btnStartTimerEl.disabled = true;
}

function handleReset() {
    resetTimer({
        onReset: () => {
            elapsedOverlayEl.style.setProperty('--deg', '0deg');
            segmentLabelEl.textContent = `---`;
            btnStartTimerEl.disabled = false;
        }
    });
}

// 離脱防止の警告
function setupUnloadGuard() {
    // リロードやタブを閉じる際の警告
    window.addEventListener('beforeunload', (e) => {
        e.preventDefault();
        // e.returnValue = ''; // ブラウザ標準の警告を表示
    });

    // 戻るボタン対策
    history.pushState(null, null, location.href);
    window.addEventListener('popstate', () => {
        if (confirm('練習を終了してよろしいですか？')) {
            history.back();
        } else {
            history.pushState(null, null, location.href);
        }
    });
}

// 実行
init();
setupUnloadGuard();
