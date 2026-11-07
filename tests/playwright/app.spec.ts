import { test, expect } from './fixtures';

/**
 * Completa el formulario de registro y verifica el mensaje de éxito.
 * Reutiliza el código duplicado entre tests de registro.
 */
async function registerAccount(page, email, password) {
  await page.getByWaInput('auth-email').fill(email);
  await page.getByWaInput('auth-password').fill(password);
  await page.getByTestId('auth-submit-btn').click();

  await page.getByTestId('auth-feedback').waitFor({ timeout: 10000 });
  const feedback = await page.getByTestId('auth-feedback').textContent();
  expect(feedback).toContain('Cuenta creada');
}

test.describe('BeeKeep Application', () => {
  test('debe cargar la página principal correctamente', async ({ page }) => {
    await page.goto('/');

    // Verificar que la página carga sin errores
    await expect(page).toHaveTitle(/BeeKeep/);
  });

  test('debe poder crear una cuenta', async ({ page }) => {
    await page.goto('/');

    // Hacer clic en el botón para cambiar al modo de registro
    await page.getByTestId('auth-toggle-mode').click();

    // Verificar que el título cambió a "Crear cuenta"
    await expect(page.getByTestId('auth-heading')).toContainText('Crear cuenta');

    // Completar el formulario de registro
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    await registerAccount(page, testEmail, testPassword);
  });

  test('debe poder crear una cuenta e iniciar sesión', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    // --- Paso 1: Crear cuenta ---
    await page.goto('/');
    await page.getByTestId('auth-toggle-mode').click();
    await expect(page.getByTestId('auth-heading')).toContainText('Crear cuenta');

    await registerAccount(page, testEmail, testPassword);

    // --- Paso 2: Esperar la redirección al dashboard y cerrar sesión ---
    // Después del registro exitoso, la app redirige a /apiarios automáticamente
    await expect(page).toHaveURL(/\/apiarios/, { timeout: 10000 });

    // Cerrar sesión para poder probar el login
    await page.getByTestId('logout-btn').click();
    await expect(page).toHaveURL(/\/login/);

    // Asegurarse de estar en modo login
    await expect(page.getByTestId('auth-heading')).toContainText('Iniciar sesión');

    // --- Paso 3: Iniciar sesión con la cuenta creada ---
    await page.getByWaInput('auth-email').fill(testEmail);
    await page.getByWaInput('auth-password').fill(testPassword);
    await page.getByTestId('auth-submit-btn').click();

    // Verificar que el login fue exitoso
    await page.getByTestId('auth-feedback').waitFor({ timeout: 10000 });
    const loginFeedback = await page.getByTestId('auth-feedback').textContent();
    expect(loginFeedback).toContain('Bienvenido');
  });
});
