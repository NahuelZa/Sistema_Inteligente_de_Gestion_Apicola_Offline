import { test, expect } from './fixtures';

/**
 * Completa el formulario de registro y verifica el mensaje de éxito.
 * Reutiliza el código duplicado entre tests de registro.
 */
async function registerAccount(page: any, email: string, password: string) {
  await page.getByWaInput('auth-email').fill(email);
  await page.getByWaInput('auth-password').fill(password);
  await page.getByTestId('auth-submit-btn').click();

  // Esperar la redirección a /apiarios como indicador de registro exitoso
  await expect(page).toHaveURL(/\/apiarios/, { timeout: 10000 });
}

/**
 * Inicia sesión con las credenciales proporcionadas.
 */
async function login(page: any, email: string, password: string) {
  await page.goto('/');
  await page.getByWaInput('auth-email').fill(email);
  await page.getByWaInput('auth-password').fill(password);
  await page.getByTestId('auth-submit-btn').click();

  // Esperar la redirección a /apiarios como indicador de login exitoso
  await expect(page).toHaveURL(/\/apiarios/, { timeout: 10000 });
}

/**
 * Crea un apiario con el nombre proporcionado y verifica el mensaje de éxito.
 */
async function createApiario(page: any, nombre: string) {
  await page.getByTestId('btn-nuevo-apiario').click();
  await expect(page).toHaveURL(/\/apiario/);

  await page.getByWaInput('apiario-nombre').fill(nombre);
  await page.getByWaInput('apiario-ubicacion').fill('Ubicación de prueba');
  await page.getByTestId('apiario-descripcion').locator('textarea').fill('Notas de prueba');

  await page.getByTestId('apiario-submit-btn').click();
  await page.getByTestId('apiario-feedback').waitFor({ timeout: 10000 });
  const feedback = await page.getByTestId('apiario-feedback').textContent();
  expect(feedback).toContain('guardado');

  // Volver al listado para que las pestañas estén disponibles
  await page.getByTestId('apiario-cancel-btn').click();
  await expect(page).toHaveURL(/\/apiarios/);
}

/**
 * Crea una colmena seleccionando el primer apiario disponible y verifica el mensaje de éxito.
 */
async function createColmena(page: any, numero: string) {
  await page.getByTestId('btn-nueva-colmena').click();
  await expect(page).toHaveURL(/\/colmena/);

  await page.getByTestId('colmena-apiario').click();
  await page.getByRole('option').first().click();
  await page.getByWaInput('colmena-numero').fill(numero);
  await page.getByTestId('colmena-notas').locator('textarea').fill('Notas de prueba');

  await page.getByTestId('colmena-submit-btn').click();
  await page.getByTestId('colmena-feedback').waitFor({ timeout: 10000 });
  const feedback = await page.getByTestId('colmena-feedback').textContent();
  expect(feedback).toContain('guardada');

  // Volver al listado para que las pestañas estén disponibles
  await page.getByTestId('colmena-cancel-btn').click();
  await expect(page).toHaveURL(/\/colmenas/);
}

/**
 * Realiza una inspección seleccionando la primera colmena disponible y verifica el mensaje de éxito.
 */
async function createInspeccion(page: any) {
  await page.getByTestId('btn-nueva-inspeccion').click();
  await expect(page).toHaveURL(/\/inspeccion/);

  await page.getByTestId('inspeccion-colmena').click();
  await page.getByRole('option').first().click();
  await page.getByTestId('inspeccion-poblacion').click();
  await page.getByRole('option', { name: 'Media' }).click();
  await page.getByTestId('inspeccion-reina').click();
  await page.getByTestId('inspeccion-notas').locator('textarea').fill('Inspección de prueba');

  await page.getByTestId('inspeccion-submit-btn').click();
  await page.getByTestId('inspeccion-feedback').waitFor({ timeout: 10000 });
  const feedback = await page.getByTestId('inspeccion-feedback').textContent();
  expect(feedback).toContain('registrada');

  // Volver al listado para que las pestañas estén disponibles
  await page.getByTestId('inspeccion-cancel-btn').click();
  await expect(page).toHaveURL(/\/inspecciones/);
}

/**
 * Crea una cuenta nueva, cierra sesión y vuelve a iniciar sesión.
 * Retorna el email y password generados para uso posterior.
 */
async function registerAndLogin(page: any, prefix: string) {
  const testEmail = `${prefix}-${Date.now()}@example.com`;
  const testPassword = 'password123';

  // Crear cuenta (registerAccount espera la redirección a /apiarios internamente)
  await page.goto('/');
  await page.getByTestId('auth-toggle-mode').click();
  await registerAccount(page, testEmail, testPassword);

  // Cerrar sesión y volver a iniciar para usar el helper
  await page.getByTestId('logout-btn').click();
  await expect(page).toHaveURL(/\/login/);
  // login() espera la redirección a /apiarios internamente
  await login(page, testEmail, testPassword);

  return { testEmail, testPassword };
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

    // --- Paso 2: Cerrar sesión para poder probar el login ---
    // registerAccount() ya espera la redirección a /apiarios internamente
    await page.getByTestId('logout-btn').click();
    await expect(page).toHaveURL(/\/login/);

    // Asegurarse de estar en modo login
    await expect(page.getByTestId('auth-heading')).toContainText('Iniciar sesión');

    // --- Paso 3: Iniciar sesión con la cuenta creada ---
    await page.getByWaInput('auth-email').fill(testEmail);
    await page.getByWaInput('auth-password').fill(testPassword);
    await page.getByTestId('auth-submit-btn').click();

    // Verificar que el login fue exitoso esperando la redirección
    await expect(page).toHaveURL(/\/apiarios/, { timeout: 10000 });
  });
});

test.describe('Gestión de Apiarios, Colmenas e Inspecciones', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'gestion');
  });

  test('debe poder crear un apiario', async ({ page }) => {
    // Crear el apiario usando el helper
    const apiarioNombre = `Apiario Test ${Date.now()}`;
    await createApiario(page, apiarioNombre);
  });

  test('debe poder crear una colmena', async ({ page }) => {
    // Crear un apiario primero (necesario para asignar la colmena)
    const apiarioNombre = `Apiario Colmena ${Date.now()}`;
    await createApiario(page, apiarioNombre);

    // Navegar a la pestaña de colmenas
    await page.getByTestId('tab-colmenas').click();
    await expect(page).toHaveURL(/\/colmenas/);

    // Crear la colmena usando el helper
    const numeroColmena = `COL-${Date.now()}`;
    await createColmena(page, numeroColmena);
  });

  test('debe poder realizar una inspección en colmena', async ({ page }) => {
    // Crear un apiario (prerrequisito)
    const apiarioNombre = `Apiario Inspeccion ${Date.now()}`;
    await createApiario(page, apiarioNombre);

    // Navegar a colmenas y crear una colmena (prerrequisito)
    await page.getByTestId('tab-colmenas').click();
    await expect(page).toHaveURL(/\/colmenas/);
    const numeroColmena = `COL-INS-${Date.now()}`;
    await createColmena(page, numeroColmena);

    // Navegar a la pestaña de inspecciones
    await page.getByTestId('tab-inspecciones').click();
    await expect(page).toHaveURL(/\/inspecciones/);

    // Realizar la inspección usando el helper
    await createInspeccion(page);
  });
});
