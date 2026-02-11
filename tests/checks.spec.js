import { test, expect } from '@playwright/test';

test.describe('Picker UI Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // ピッカーを開く
        await page.click('#btnOpenPicker');
        await expect(page.locator('#pickerOverlay')).not.toHaveClass(/hidden/);
    });

    test('Matrix View (Default ID Sort)', async ({ page }) => {
        // Matrixテーブルが表示されていること
        await expect(page.locator('.matrix-table')).toBeVisible();
        // ID 100が存在すること (Row 0, Col 0)
        await expect(page.locator('.matrix-cell[data-id="100"]')).toBeVisible();
        // ID 1が存在すること
        await expect(page.locator('.matrix-cell[data-id="1"]')).toBeVisible();
    });

    test('Section View (Kimariji Sort)', async ({ page }) => {
        // 「五十音」ボタンをクリック
        await page.click('button[data-sort="kimariji"]');

        // セクションヘッダーが表示されていること
        await expect(page.locator('.section-header').first()).toBeVisible();

        // 「あ」セクションのヘッダーをクリックして一括選択
        const headerA = page.locator('.section-header', { hasText: /あ/ }).first();
        await headerA.click();

        // ID 1 (あきの) は選択されているはず
        const card1 = page.locator('.card-item[data-id="1"]');
        await expect(card1).toHaveClass(/selected/);

        // ID 61 (いに) は選択されていないはず
        const card61 = page.locator('.card-item[data-id="61"]');
        await expect(card61).not.toHaveClass(/selected/);
    });

    test('Section View (Length Sort)', async ({ page }) => {
        // 「文字数」ボタンをクリック
        await page.click('button[data-sort="kimariji-len"]');

        // 「1字」セクションのヘッダーをクリック
        const header1 = page.locator('.section-header', { hasText: /1字/ }).first();
        await header1.click();

        // 1字決まり (ID 87: む) は選択
        const card87 = page.locator('.card-item[data-id="87"]');
        await expect(card87).toHaveClass(/selected/);

        // 5字決まり (ID 1: あきの) は非選択
        const card1 = page.locator('.card-item[data-id="1"]');
        await expect(card1).not.toHaveClass(/selected/);
    });

    test('Matrix Row Selection (Tens place)', async ({ page }) => {
        // デフォルトは歌番号順 (Matrix)

        // 「0-」行（十の位＝0）をクリック
        const row0 = page.locator('.matrix-header', { hasText: /^0-$/ });
        await row0.click();

        // ID 1 (01) -> 選択
        await expect(page.locator('.matrix-cell[data-id="1"]')).toHaveClass(/selected/);
        // ID 9 (09) -> 選択
        await expect(page.locator('.matrix-cell[data-id="9"]')).toHaveClass(/selected/);
        // ID 100 (00扱い) -> 選択
        await expect(page.locator('.matrix-cell[data-id="100"]')).toHaveClass(/selected/);

        // ID 10 (十の位＝1, Row 1) -> 非選択
        await expect(page.locator('.matrix-cell[data-id="10"]')).not.toHaveClass(/selected/);
    });
});
