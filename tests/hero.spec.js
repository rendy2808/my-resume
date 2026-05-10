const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

test.describe('Hero section – Void Strike animation', () => {

  test('1. Vader silhouette is removed', async ({ page }) => {
    await page.goto(FILE_URL);
    // No Vader-specific SVG gradient IDs
    await expect(page.locator('#helmShine')).toHaveCount(0);
    await expect(page.locator('#visorGlow')).toHaveCount(0);
    await expect(page.locator('#bodyGrad')).toHaveCount(0);
    // No chest-panel rect at the vader coordinates
    const chestPanel = page.locator('rect[x="170"][y="180"]');
    await expect(chestPanel).toHaveCount(0);
  });

  test('2. Void Strike animation container is present and visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(FILE_URL);
    const frame = page.locator('.void-strike-frame');
    await expect(frame).toHaveCount(1);
    await expect(frame).toBeVisible();
    // Required SVG class primitives
    await expect(frame.locator('.vs-core')).toHaveCount(1);
    await expect(frame.locator('.vs-beam')).toHaveCount(1);
    await expect(frame.locator('.vs-shockwave')).toHaveCount(1);
  });

  test('3. Animation keyframes are wired up', async ({ page }) => {
    await page.goto(FILE_URL);
    // At least one keyframe animation rule referencing voidStrike, voidPulse, or shockwave
    const hasKeyframes = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule instanceof CSSKeyframesRule) {
              const n = rule.name;
              if (n === 'voidStrike' || n === 'voidPulse' || n === 'shockwave') return true;
            }
          }
        } catch (_) {}
      }
      return false;
    });
    expect(hasKeyframes).toBe(true);

    // At least one element inside .void-strike-frame has a running animation
    const animationName = await page.evaluate(() => {
      const el = document.querySelector('.void-strike-frame .vs-core');
      if (!el) return 'none';
      return getComputedStyle(el).animationName;
    });
    expect(animationName).not.toBe('none');
  });

  test('4. Mobile hide rule preserved for .void-strike-frame', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto(FILE_URL);
    const display = await page.evaluate(() => {
      const el = document.querySelector('.void-strike-frame');
      return el ? getComputedStyle(el).display : 'missing';
    });
    expect(display).toBe('none');
  });

  test('5. Page-level smoke – no console errors, key elements present', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(FILE_URL);
    expect(errors).toHaveLength(0);
    // Nav still renders
    await expect(page.locator('nav')).toBeVisible();
    // Hero copy present
    await expect(page.locator('.hero-content')).toBeVisible();
    // Play Void Strike button still wired
    await expect(page.locator('#play-game-btn')).toHaveCount(1);
    // Game overlay still in DOM
    await expect(page.locator('#game-overlay')).toHaveCount(1);
  });

});
