import { mutators, persistence, getters } from './state.js';
import { initPicker, generatePicker, updatePickerUI } from './picker.js';
import {
    initFlow, handleStart, handleReset, goNext, goPrev,
    setupDeck, handleUnitSecondsChange, showStart, showMain, exitToStart, renderCurrentCard
} from './flow.js';
import { updateClock } from './clock.js';
import { paintSegmentsRing } from './timer.js';
import { api } from './api.js';
import { CONSTANTS } from './constants.js';

// Constants moved to config.js / api.js

/* =======================
   DOM 参照
======================= */
const dom = {
    prevCard: document.getElementById('prevCard'),
    nextCard: document.getElementById('nextCard'),
    btnPrev: document.getElementById('btnPrev'),
    btnNext: document.getElementById('btnNext'),
    progressLabel: document.getElementById('progressLabel'),
    segmentsRing: document.getElementById('segments'),
    elapsedOverlay: document.getElementById('elapsed'),
    segmentLabel: document.getElementById('segmentLabel'),
    unitSeconds: document.getElementById('unitSeconds'),
    btnStartTimer: document.getElementById('btnStartTimer'),
    btnResetTimer: document.getElementById('btnResetTimer'),
    menuToggle: document.getElementById("menuToggle"),
    menuPanel: document.getElementById("menuPanel"),
    clock: document.getElementById("clock"),
    startScreen: document.getElementById('startScreen'),
    pickerOverlay: document.getElementById('pickerOverlay'),
    appMain: document.getElementById('appMain'),
    cardGrid: document.getElementById('cardGrid'),
    btnStartAll: document.getElementById('btnStartAll'),
    btnOpenPicker: document.getElementById('btnOpenPicker'),
    btnClosePicker: document.getElementById('btnClosePicker'),
    btnStartSelected: document.getElementById('btnStartSelected'),
    btnSelectAll: document.getElementById('btnSelectAll'),
    btnDeselectAll: document.getElementById('btnDeselectAll'),
    sortButtons: document.getElementById('sortButtons'),
    pickerContent: document.getElementById('pickerContent'),
    selectionCount: document.getElementById('selectionCount'),
    btnExit: document.getElementById('btnExit'),
};

/* =======================
   初期化とイベント設定
======================= */

async function init() {
    // 依存モジュールへのDOM渡し
    initFlow(dom);
    initPicker(dom.pickerContent, dom.selectionCount);

    // 時計開始
    updateClock(dom.clock);
    setInterval(() => updateClock(dom.clock), 1000);

    // タイマー初期描画
    paintSegmentsRing(dom.segmentsRing, CONSTANTS.SEGMENT_UNITS);

    // データ読込み
    try {
        const [jokaRes, cardsRes] = await Promise.all([
            api.fetchJoka(),
            api.fetchCards()
        ]);
        mutators.setCards(cardsRes);

        // 保存された状態の復元
        if (persistence.load()) {
            const savedUnitSec = getters.getUnitSeconds();
            dom.unitSeconds.value = savedUnitSec;

            // 既に練習開始している場合はアプリ画面を表示
            if (getters.getDeck().length > 0) {
                showMain();
            } else {
                showStart();
            }
        } else {
            showStart();
        }

        generatePicker();
    } catch (e) {
        console.error("Failed to load data", e);
    }

    renderCurrentCard();
    handleReset();

    // イベント登録
    dom.btnPrev.addEventListener('click', goPrev);
    dom.btnNext.addEventListener('click', goNext);
    dom.btnStartTimer.addEventListener('click', handleStart);
    dom.btnResetTimer.addEventListener('click', handleReset);

    dom.unitSeconds.addEventListener('change', (e) => {
        handleUnitSecondsChange(e.target.value);
    });

    // モード選択系
    dom.btnStartAll.addEventListener('click', () => {
        setupDeck(getters.getCards().map(c => c.id));
        showMain();
    });

    dom.btnOpenPicker.addEventListener('click', () => {
        dom.pickerOverlay.classList.remove('hidden');
    });

    dom.btnClosePicker.addEventListener('click', () => {
        dom.pickerOverlay.classList.add('hidden');
    });

    dom.btnSelectAll.addEventListener('click', () => {
        const allIds = getters.getCards().map(c => c.id);
        mutators.setSelectedIds(allIds);
        updatePickerUI();
    });

    dom.btnDeselectAll.addEventListener('click', () => {
        mutators.clearSelectedIds();
        updatePickerUI();
    });

    dom.btnStartSelected.addEventListener('click', () => {
        const selectedIds = getters.getSelectedIds();
        if (selectedIds.size === 0) {
            alert('札を1つ以上選択してください');
            return;
        }
        setupDeck(Array.from(selectedIds));
        dom.pickerOverlay.classList.add('hidden');
        showMain();
    });

    // ソート変更 (ボタン)
    dom.sortButtons.addEventListener('click', (e) => {
        // @ts-ignore
        const btn = e.target.closest('.btn');
        if (!btn || !dom.sortButtons.contains(btn)) return;

        const sortType = btn.dataset.sort;
        if (sortType) {
            mutators.setCurrentSort(sortType);
            // Active class update
            dom.sortButtons.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            generatePicker();
        }
    });

    dom.menuToggle.addEventListener("click", () => dom.menuPanel.classList.toggle("hidden"));
    document.addEventListener("click", (e) => {
        if (!dom.menuPanel.contains(e.target) && !dom.menuToggle.contains(e.target)) {
            dom.menuPanel.classList.add("hidden");
        }
    });

    // Global expose for menu exit button (onclick="exitToStart()") if used in HTML
    // Refactored to use addEventListener on #btnExit
    if (dom.btnExit) {
        dom.btnExit.addEventListener('click', exitToStart);
    }
}

// 離脱防止の警告
function setupUnloadGuard() {
    window.addEventListener('beforeunload', (e) => {
        e.preventDefault();
    });

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
