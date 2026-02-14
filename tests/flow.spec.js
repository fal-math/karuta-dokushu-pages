import { test, expect } from '@playwright/test';

test.describe('Flow Logic Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Start with all cards to have a predictable state (ordered by ID initially if not shuffled? 
        // Actually setupDeck does shuffle. 
        // To test next/prev logic deterministicly, we might want to select a few cards or check the logic regardless of order.
        // Let's just start with all cards.
        await page.click('#btnStartAll');
        await expect(page.locator('#appMain')).toBeVisible();
    });

    test('Initial State', async ({ page }) => {
        // App starts at 1/100 (Index 1, 0 is Joka)
        await expect(page.locator('#progressLabel')).toHaveText('1 / 100');
        // Prev button should be disabled at start
        await expect(page.locator('#btnPrev')).toBeDisabled();
        // Next button should be enabled
        await expect(page.locator('#btnNext')).toBeEnabled();
    });

    test('Navigate Next and Prev', async ({ page }) => {
        // Click Next
        await page.click('#btnNext');

        // Should be 2/100
        await expect(page.locator('#progressLabel')).toHaveText('2 / 100');

        // Prev button should now be enabled
        await expect(page.locator('#btnPrev')).toBeEnabled();

        // Click Prev
        await page.click('#btnPrev');

        // Should be back to 1/100
        await expect(page.locator('#progressLabel')).toHaveText('1 / 100');
        // Prev button disabled again
        await expect(page.locator('#btnPrev')).toBeDisabled();
    });

    test('Exit to Start', async ({ page }) => {
        // Open Menu
        await page.click('#menuToggle');
        await expect(page.locator('#menuPanel')).toBeVisible();

        // Handle Confirm Dialog
        page.on('dialog', dialog => dialog.accept());

        // Click Exit
        await page.click('#btnExit');

        // Should be back to Start Screen
        await expect(page.locator('#startScreen')).toBeVisible();
        await expect(page.locator('#appMain')).not.toBeVisible();
    });

    test('Timer Reset on Navigation', async ({ page }) => {
        // Start Timer
        await page.click('#btnStartTimer');

        // Wait a bit (simulate playing)
        // Check that 'Start' button is disabled while running (optional, implementation detail)
        // But we want to check reset behavior.

        // Navigate Next
        await page.click('#btnNext');

        // Timer should be reset (Start button enabled)
        await expect(page.locator('#btnStartTimer')).toBeEnabled();
        // Segment Label should be reset
        await expect(page.locator('#segmentLabel')).toHaveText('---');
    });
});
