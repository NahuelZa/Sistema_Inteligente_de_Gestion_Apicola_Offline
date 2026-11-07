import { test as base, type Locator } from '@playwright/test';

/**
 * Extiende el test base de Playwright con locators personalizados.
 *
 * - `getByWaInput(testId)`: Encuentra un `<wa-input>` por su `data-testid`
 *   y resuelve automáticamente el `<input>` nativo dentro del Shadow DOM.
 */
export const test = base.extend<{
  getByWaInput: (testId: string) => Locator;
}>({
  getByWaInput: async ({ page }, use) => {
    await use((testId: string) => {
      return page.getByTestId(testId).locator('input');
    });
  },
});

export { expect } from '@playwright/test';
