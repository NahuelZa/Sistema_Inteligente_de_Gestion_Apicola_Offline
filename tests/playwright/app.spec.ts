import { test, expect } from './fixtures';

test.describe('BeeKeep Application', () => {
  test('debe cargar la página principal correctamente', async ({ page }) => {
    await page.goto('/');

    // Verificar que la página carga sin errores
    await expect(page).toHaveTitle(/BeeKeep/);
  });
  
  test('debe poder crear una cuenta', async ({ page, getByWaInput }) => {
    await page.goto('/');

    // Hacer clic en el botón para cambiar al modo de registro
    await page.getByTestId('auth-toggle-mode').click();

    // Verificar que el título cambió a "Crear cuenta"
    await expect(page.getByTestId('auth-heading')).toContainText('Crear cuenta');

    // Completar el formulario de registro
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    await getByWaInput('auth-email').fill(testEmail);
    await getByWaInput('auth-password').fill(testPassword);

    // Hacer clic en el botón de crear cuenta
    await page.getByTestId('auth-submit-btn').click();

    // Esperar a que aparezca el mensaje de éxito
    await page.getByTestId('auth-feedback').waitFor({ timeout: 10000 });

    // Verificar que se muestra el mensaje de éxito
    const feedbackText = await page.getByTestId('auth-feedback').textContent();
    expect(feedbackText).toContain('Cuenta creada');
  });

  test('debe poder crear una cuenta e iniciar sesión', async ({ page, getByWaInput }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'password123';

    // --- Paso 1: Crear cuenta ---
    await page.goto('/');
    await page.getByTestId('auth-toggle-mode').click();
    await expect(page.getByTestId('auth-heading')).toContainText('Crear cuenta');

    await getByWaInput('auth-email').fill(testEmail);
    await getByWaInput('auth-password').fill(testPassword);
    await page.getByTestId('auth-submit-btn').click();

    // Verificar que la cuenta se creó correctamente
    await page.getByTestId('auth-feedback').waitFor({ timeout: 10000 });
    const registerFeedback = await page.getByTestId('auth-feedback').textContent();
    expect(registerFeedback).toContain('Cuenta creada');

    // --- Paso 2: Iniciar sesión con la cuenta creada ---
    // Esperar a la redirección o navegar manualmente al login
    await page.waitForTimeout(1000);

    // Si la redirección ya ocurrió, volver al login; si no, cambiar al modo login
    const currentUrl = page.url();
    if (currentUrl.includes('/apiarios')) {
      // Ya está logueado, cerrar sesión o navegar al login
      await page.goto('/');
    }

    // Asegurarse de estar en modo login
    const headingText = await page.getByTestId('auth-heading').textContent();
    if (headingText?.includes('Crear cuenta')) {
      await page.getByTestId('auth-toggle-mode').click();
    }
    await expect(page.getByTestId('auth-heading')).toContainText('Iniciar sesión');

    // Completar el formulario de login
    await getByWaInput('auth-email').fill(testEmail);
    await getByWaInput('auth-password').fill(testPassword);
    await page.getByTestId('auth-submit-btn').click();

    // Verificar que el login fue exitoso
    await page.getByTestId('auth-feedback').waitFor({ timeout: 10000 });
    const loginFeedback = await page.getByTestId('auth-feedback').textContent();
    expect(loginFeedback).toContain('Bienvenido');
  });
});
