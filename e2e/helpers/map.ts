import type { Page } from '@playwright/test';

/**
 * Wait for the MapLibre map canvas to be rendered and interactive.
 */
export async function waitForMapReady(page: Page): Promise<void> {
  await page.waitForSelector('.map-container canvas', { timeout: 30_000 });

  // Wait for canvas to have non-zero dimensions (tiles rendered)
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('.map-container canvas');
      return canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0;
    },
    { timeout: 20_000 },
  );
}

/**
 * Click on the map canvas at a relative position.
 * offsetX/offsetY are fractions of the canvas size (0-1).
 * E.g., (0.5, 0.5) clicks at the center.
 */
export async function clickOnMapAt(
  page: Page,
  offsetX: number,
  offsetY: number,
): Promise<void> {
  const canvas = page.locator('.map-container canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Cannot get map canvas bounding box');

  await page.mouse.click(
    box.x + box.width * offsetX,
    box.y + box.height * offsetY,
  );

  // Small delay to let the map process the click
  await page.waitForTimeout(300);
}

/**
 * Click multiple points on the map to trace a route or polygon.
 * Each point is an [offsetX, offsetY] pair (0-1 fractions of canvas size).
 */
export async function clickMultiplePoints(
  page: Page,
  points: [number, number][],
): Promise<void> {
  for (const [x, y] of points) {
    await clickOnMapAt(page, x, y);
  }
}
