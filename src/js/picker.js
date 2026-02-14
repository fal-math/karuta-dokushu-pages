import { state, getters, mutators } from './state.js';
import { CONSTANTS } from './constants.js';

// DOM References (will be initialized in initPicker)
/** @type {HTMLElement} */
let pickerContentEl = null;

const GROUP_MAP = {};
Array.from(CONSTANTS.GROUP_ORDER_STR).forEach((char, idx) => {
    GROUP_MAP[char] = idx;
});

export function initPicker(contentElement) {
    pickerContentEl = contentElement;
}

export function generatePicker() {
    if (!pickerContentEl) return;

    pickerContentEl.innerHTML = '';
    const currentSort = getters.getCurrentSort();

    if (currentSort === 'id') {
        renderMatrix();
    } else {
        renderSections(currentSort);
    }
    updatePickerUI();
}

/**
 * ID Matrix Rendering
 */
function renderMatrix() {
    const container = document.createElement('div');
    container.className = 'matrix-container';
    const table = document.createElement('table');
    table.className = 'matrix-table';

    const thead = document.createElement('tr');
    thead.innerHTML = '<th class="matrix-header"></th>';
    for (let c = 0; c < 10; c++) {
        const th = document.createElement('th');
        th.className = 'matrix-header col-header';
        th.dataset.col = String(c);
        th.textContent = String(c);
        th.addEventListener('click', () => toggleColumn(c));
        thead.appendChild(th);
    }
    table.appendChild(thead);

    for (let r = 0; r < 10; r++) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.className = 'matrix-header row-header';
        th.dataset.row = String(r);
        th.textContent = `${r}-`;
        th.addEventListener('click', () => toggleRow(r));
        tr.appendChild(th);

        for (let c = 0; c < 10; c++) {
            const td = document.createElement('td');
            td.className = 'matrix-cell';

            let id;
            if (c === 0 && r === 0) {
                id = 100
            } else {
                id = r * 10 + c;
            }

            td.textContent = String(id);
            td.dataset.id = String(id);
            td.addEventListener('click', () => toggleId(id));
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    container.appendChild(table);
    pickerContentEl.appendChild(container);
}

/**
 * Section Rendering
 */
function renderSections(sortType) {
    const cards = getters.getCards();
    const groups = {};

    cards.forEach(card => {
        let key = '';
        const k = card.kimariji || '';
        if (sortType === 'kimariji') {
            key = k.charAt(0);
        } else if (sortType === 'kimariji-len') {
            key = `${k.length}字`;
        } else if (sortType === 'group') {
            const char = k.charAt(0);
            if (CONSTANTS.ONE_JI_STR.includes(char)) {
                key = CONSTANTS.ONE_JI_STR;
            } else {
                key = GROUP_MAP[char] !== undefined ? char : '他';
            }
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(card);
    });

    let sortedKeys = Object.keys(groups);
    if (sortType === 'kimariji') {
        sortedKeys.sort((a, b) => a.localeCompare(b, 'ja'));
    } else if (sortType === 'kimariji-len') {
        sortedKeys.sort((a, b) => parseInt(a) - parseInt(b));
    } else if (sortType === 'group') {
        sortedKeys.sort((a, b) => {
            if (a === CONSTANTS.ONE_JI_STR) return -1; // First
            if (b === CONSTANTS.ONE_JI_STR) return 1;

            const idxA = GROUP_MAP[a] !== undefined ? GROUP_MAP[a] : 999;
            const idxB = GROUP_MAP[b] !== undefined ? GROUP_MAP[b] : 999;
            return idxA - idxB;
        });
    }

    sortedKeys.forEach(key => {
        const groupCards = groups[key];

        // Sorting logic inside group
        if (sortType === 'kimariji-len') {
            // Secondary sort: Musume Fusahose
            groupCards.sort((a, b) => {
                const ka = (a.kimariji || '').charAt(0);
                const kb = (b.kimariji || '').charAt(0);
                const idxA = GROUP_MAP[ka] !== undefined ? GROUP_MAP[ka] : 999;
                const idxB = GROUP_MAP[kb] !== undefined ? GROUP_MAP[kb] : 999;
                if (idxA !== idxB) return idxA - idxB;
                return (a.kimariji || '').localeCompare(b.kimariji || '', 'ja');
            });
        } else if (sortType === 'group' && key === CONSTANTS.ONE_JI_STR) {
            // Musume Sort within the group
            groupCards.sort((a, b) => {
                const ka = (a.kimariji || '').charAt(0);
                const kb = (b.kimariji || '').charAt(0);
                return GROUP_MAP[ka] - GROUP_MAP[kb];
            });
        } else {
            // Default: Aiueo
            groupCards.sort((a, b) => (a.kimariji || '').localeCompare(b.kimariji || '', 'ja'));
        }

        const sectionBlock = document.createElement('div');
        sectionBlock.className = 'section-block';

        const header = document.createElement('div');
        header.className = 'section-header';

        // Display count differently if aggregated
        const countLabel = `(${groupCards.length}首)`;

        header.innerHTML = `<span>${key} <small>${countLabel}</small></span> <span>▼</span>`;
        header.addEventListener('click', () => {
            batchToggleIds(groupCards.map(c => c.id));
        });
        sectionBlock.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'section-grid';

        groupCards.forEach(card => {
            const item = document.createElement('div');
            item.className = 'card-item';
            item.dataset.id = String(card.id);
            item.textContent = `${card.kimariji}`;
            if (state.selectedIds.has(card.id)) item.classList.add('selected');
            item.addEventListener('click', () => toggleId(card.id));
            grid.appendChild(item);
        });

        sectionBlock.appendChild(grid);
        pickerContentEl.appendChild(sectionBlock);
    });
}

function toggleId(id) {
    if (state.selectedIds.has(id)) {
        mutators.deleteSelectedId(id);
    } else {
        mutators.addSelectedId(id);
    }
    updatePickerUI();
}

function batchToggleIds(ids) {
    const allOn = ids.every(id => state.selectedIds.has(id));
    if (allOn) {
        ids.forEach(id => mutators.deleteSelectedId(id));
    } else {
        ids.forEach(id => mutators.addSelectedId(id));
    }
    updatePickerUI();
}

function toggleColumn(one) {
    const targetIds = [];
    for (let r = 0; r <= 9; r++) {
        let id;
        if (one === 0) {
            if (r === 0) id = 100;
            else id = r * 10;
        } else {
            id = r * 10 + one;
        }
        targetIds.push(id);
    }
    batchToggleIds(targetIds);
}

function toggleRow(ten) {
    const targetIds = [];
    for (let c = 1; c <= 10; c++) {
        let one = (c === 10) ? 0 : c;
        let id;
        if (one === 0) {
            if (ten === 0) id = 100;
            else id = ten * 10;
        } else {
            id = ten * 10 + one;
        }
        targetIds.push(id);
    }
    batchToggleIds(targetIds);
}

export function updatePickerUI() {
    if (!pickerContentEl) return;

    const count = state.selectedIds.size;
    const btnStart = document.getElementById('btnStartSelected');
    if (btnStart) {
        btnStart.textContent = `選択した札（${count}首）で開始`;
    }

    // Determine Mode
    const isMatrix = pickerContentEl.querySelector('.matrix-container');

    if (isMatrix) {
        // --- Matrix View ---

        // 1. Cells
        const cells = pickerContentEl.querySelectorAll('.matrix-cell');
        cells.forEach(cell => {
            // @ts-ignore
            const id = parseInt(cell.dataset.id, 10);
            if (state.selectedIds.has(id)) cell.classList.add('selected');
            else cell.classList.remove('selected');
        });

        // 2. Col Headers
        const colHeaders = pickerContentEl.querySelectorAll('.matrix-header.col-header');
        colHeaders.forEach(th => {
            // @ts-ignore
            const col = parseInt(th.dataset.col, 10);
            let all = true;
            for (let row = 0; row < 10; row++) { // 0-9
                let id;
                if (col === 0 && row === 0) id = 100;
                else id = row * 10 + col;

                if (!state.selectedIds.has(id)) {
                    all = false;
                    break;
                }
            }
            if (all) th.classList.add('selected');
            else th.classList.remove('selected');
        });

        // 3. Row Headers
        const rowHeaders = pickerContentEl.querySelectorAll('.matrix-header.row-header');
        rowHeaders.forEach(th => {
            // @ts-ignore
            const row = parseInt(th.dataset.row, 10);
            let all = true;
            for (let col = 0; col < 10; col++) { // 0-9
                let id;
                if (col === 0 && row === 0) id = 100;
                else id = row * 10 + col;

                if (!state.selectedIds.has(id)) {
                    all = false;
                    break;
                }
            }
            if (all) th.classList.add('selected');
            else th.classList.remove('selected');
        });

    } else {
        // --- Section View ---
        const sections = pickerContentEl.querySelectorAll('.section-block');
        sections.forEach(section => {
            const items = section.querySelectorAll('.card-item');
            if (items.length === 0) return;

            let allSelected = true;
            items.forEach(item => {
                // @ts-ignore
                const id = parseInt(item.dataset.id, 10);
                if (state.selectedIds.has(id)) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                    allSelected = false;
                }
            });

            const header = section.querySelector('.section-header');
            if (header) {
                if (allSelected) header.classList.add('selected');
                else header.classList.remove('selected');
            }
        });
    }
}
