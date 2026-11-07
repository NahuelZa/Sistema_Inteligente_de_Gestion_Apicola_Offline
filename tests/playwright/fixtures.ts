import { test as base, expect, type Page, type Locator } from '@playwright/test';

/**
 * Extiende el objeto Page de Playwright con locators personalizados.
 *
 * - `getByWaInput(testId)`: Encuentra un `<wa-input>` por su `data-testid`
 *   y resuelve automáticamente el `<input>` nativo dentro del Shadow DOM.
 */
declare module '@playwright/test' {
  interface Page {
    getByWaInput(testId: string): Locator;
    toHaveURLPath(path: string): Promise<void>;
  }
}

export const test = base.extend<{
  page: Page;
}>({
  page: async ({ page }, use) => {
    page.getByWaInput = (testId: string) => {
      return page.getByTestId(testId).locator('input');
    };
    page.toHaveURLPath = async (path: string) => {
      const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await expect(page).toHaveURL(new RegExp(escaped));
    };
    await use(page);
  },
});

export { expect } from '@playwright/test';
