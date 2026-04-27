import { expect, test, type Page, type TestInfo } from '@playwright/test';
import type { LevelId } from '../types';

async function stubCatApi(page: Page): Promise<void> {
  await page.route('**/api/cat/wisdom', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, message: 'Smoke wisdom.' }),
    });
  });

  await page.route('**/api/cat/death-message', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, message: 'Smoke crash.' }),
    });
  });
}

async function attachScreenshot(testInfo: TestInfo, page: Page, name: string): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

async function expectSmokeApi(page: Page): Promise<void> {
  await expect
    .poll(async () => page.evaluate(() => Boolean(window.__BEACH_KITTY_TEST_API__)))
    .toBe(true);
}

async function forceVictoryAndReturnToCampaign(
  page: Page,
  input: { levelId: LevelId; finalScore: number },
): Promise<void> {
  await page.evaluate((payload) => {
    window.__BEACH_KITTY_TEST_API__?.forceVictory({
      levelId: payload.levelId,
      finalScore: payload.finalScore,
    });
  }, input);

  await expect(page.getByRole('heading', { name: /victory!/i })).toBeVisible();
  await page.getByRole('button', { name: /main menu/i }).click();
  await expect(page.getByRole('heading', { name: /beach kitty/i })).toBeVisible();
}

test.describe('browser smoke', () => {
  test('boots campaign, closet, and Phaser shells', async ({ page }, testInfo) => {
    await stubCatApi(page);
    await page.goto('/?unlock_all=1');

    await expect(page.getByRole('heading', { name: /beach kitty/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /start run on sunny shore/i })).toBeVisible();
    await attachScreenshot(testInfo, page, 'campaign');

    await page.getByRole('button', { name: /open kitty closet/i }).click();
    await expect(page.getByRole('heading', { name: /kitty closet/i })).toBeVisible();
    await attachScreenshot(testInfo, page, 'closet');
    await page.getByRole('button', { name: /discard changes/i }).click();

    await expect(page.getByRole('heading', { name: /beach kitty/i })).toBeVisible();
    await page.getByRole('button', { name: /start run on sunny shore/i }).click();
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /eject/i })).toBeVisible();
    await attachScreenshot(testInfo, page, 'runner-shell');
    const gameCanvas = page.locator('canvas').first();
    await expect(gameCanvas).toBeVisible();
    await gameCanvas.focus();
    await expect(gameCanvas).toBeFocused();
    await page.keyboard.press('p');
    await expect(page.getByRole('heading', { name: /paused/i })).toBeVisible();
    await page.keyboard.press('p');
    await expect(page.getByRole('heading', { name: /paused/i })).toBeHidden();
    await page.getByRole('button', { name: /eject/i }).click();

    await expect(page.getByRole('heading', { name: /beach kitty/i })).toBeVisible();
    await expectSmokeApi(page);
    await page.evaluate(() => {
      window.__BEACH_KITTY_TEST_API__?.startBossPractice();
    });
    await expect(page.getByRole('button', { name: /eject/i })).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => window.__BEACH_KITTY_TEST_API__?.getSnapshot().status))
      .toBe('BOSS_FIGHT');
    await expect
      .poll(async () => page.evaluate(() => window.__BEACH_KITTY_TEST_API__?.getSnapshot().shellAmmo ?? 0))
      .toBeGreaterThanOrEqual(5);
    await attachScreenshot(testInfo, page, 'boss-practice-ammo');
    await page.getByRole('button', { name: /eject/i }).click();

    await expect(page.getByRole('heading', { name: /beach kitty/i })).toBeVisible();
    await page.getByRole('button', { name: /city heights/i }).click();
    await page.getByRole('button', { name: /start run on city heights/i }).click();
    await expect(page.getByRole('button', { name: /eject/i })).toBeVisible();
    await attachScreenshot(testInfo, page, 'platformer-shell');
  });

  test('forces victory and game over through live handlers', async ({ page }, testInfo) => {
    await stubCatApi(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /beach kitty/i })).toBeVisible();
    await expectSmokeApi(page);

    await page.getByRole('button', { name: /start run on sunny shore/i }).click();
    await expect(page.getByRole('button', { name: /eject/i })).toBeVisible();

    await page.evaluate(() => {
      window.__BEACH_KITTY_TEST_API__?.forceVictory({ finalScore: 321 });
    });

    await expect(page.getByRole('heading', { name: /victory!/i })).toBeVisible();
    await expect(page.getByText(/next level unlocked:\s*city heights/i)).toBeVisible();
    await attachScreenshot(testInfo, page, 'victory');

    const completedLevels = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('beach-cat-completed-levels-v1') ?? '{}'),
    );
    expect(completedLevels).toMatchObject({ BEACH: true });

    const beachResult = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('beach-cat-level-result-BEACH-v1') ?? 'null'),
    );
    expect(beachResult).toMatchObject({
      levelId: 'BEACH',
      score: 321,
      stars: 2,
    });

    await page.getByRole('button', { name: /main menu/i }).click();
    await expect(page.getByRole('heading', { name: /beach kitty/i })).toBeVisible();

    const hallOfFame = page.locator('section').filter({
      has: page.getByRole('heading', { name: /hall of fame/i }),
    });
    await expect(hallOfFame.getByText(/beach kitty/i)).toHaveCount(1);
    await expect(hallOfFame.getByText(/sunny shore/i)).toBeVisible();

    await page.getByRole('button', { name: /start run on sunny shore/i }).click();
    await expect(page.getByRole('button', { name: /eject/i })).toBeVisible();

    await page.evaluate(async () => {
      await window.__BEACH_KITTY_TEST_API__?.forceGameOver(111);
    });

    await expect(page.getByRole('heading', { name: /crash!/i })).toBeVisible();
    await expect(page.getByText(/smoke crash\./i)).toBeVisible();
    await expect(page.getByText(/all 9 lives exhausted!/i)).toBeVisible();
    await attachScreenshot(testInfo, page, 'game-over');

    const hallOfFameEntries = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('beach-cat-scores-v2') ?? '[]'),
    );
    expect(hallOfFameEntries).toHaveLength(2);
    expect(hallOfFameEntries[0]).toMatchObject({
      levelId: 'BEACH',
      score: 321,
      isVictory: true,
    });
    expect(hallOfFameEntries[1]).toMatchObject({
      levelId: 'BEACH',
      score: 111,
      isVictory: false,
    });

    await page.getByRole('button', { name: /campaign menu/i }).click();
    await expect(page.getByRole('heading', { name: /beach kitty/i })).toBeVisible();
    await expect(hallOfFame.getByText(/beach kitty/i)).toHaveCount(2);
  });

  test('caps and orders Hall of Fame entries after repeated wins', async ({ page }, testInfo) => {
    await stubCatApi(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /beach kitty/i })).toBeVisible();
    await expectSmokeApi(page);

    const runs = [
      { levelId: 'BEACH', finalScore: 400 },
      { levelId: 'ROOFTOPS', finalScore: 999 },
      { levelId: 'KITCHEN', finalScore: 300 },
      { levelId: 'SPACE', finalScore: 650 },
      { levelId: 'YARN', finalScore: 150 },
      { levelId: 'STREET', finalScore: 875 },
    ] as const;

    for (const run of runs) {
      await forceVictoryAndReturnToCampaign(page, run);
    }

    await expect(page.getByText(/6\/9 complete/i)).toBeVisible();

    const hallOfFameEntries = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('beach-cat-scores-v2') ?? '[]'),
    );
    expect(hallOfFameEntries).toHaveLength(5);
    expect(hallOfFameEntries.map((entry: { score: number }) => entry.score)).toEqual([999, 875, 650, 400, 300]);
    expect(hallOfFameEntries.some((entry: { score: number }) => entry.score === 150)).toBe(false);

    const completedLevels = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('beach-cat-completed-levels-v1') ?? '{}'),
    );
    expect(completedLevels).toMatchObject({
      BEACH: true,
      ROOFTOPS: true,
      KITCHEN: true,
      SPACE: true,
      YARN: true,
      STREET: true,
    });

    const hallOfFame = page.locator('section').filter({
      has: page.getByRole('heading', { name: /hall of fame/i }),
    });
    await expect(hallOfFame.locator('li')).toHaveCount(3);
    await expect(hallOfFame.locator('li').nth(0)).toContainText(/999/);
    await expect(hallOfFame.locator('li').nth(0)).toContainText(/city heights/i);
    await expect(hallOfFame.locator('li').nth(1)).toContainText(/875/);
    await expect(hallOfFame.locator('li').nth(1)).toContainText(/busy crossing/i);
    await expect(hallOfFame.locator('li').nth(2)).toContainText(/650/);
    await expect(hallOfFame.locator('li').nth(2)).toContainText(/cardboard cosmos/i);

    await attachScreenshot(testInfo, page, 'hall-of-fame-ordered');
  });
});
