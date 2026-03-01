import { test, expect } from '@playwright/test';
import * as jose from 'jose';

test('Verify Create Session Form with Partido de Temporada', async ({ page, context }) => {
  // 1. Generate a mock JWT token. The payload must be unwrapped because the backend jose.jwtVerify unwraps it
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
  const token = await new jose.SignJWT({
    _id: 'mock_admin_id',
    role: 'admin',
    name: 'Admin User',
    team: { _id: 'team_id', name: 'Lakers' }
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2h')
    .sign(secret);

  // 2. Set the token as a cookie (must match COOKIE_NAME in constants)
  await context.addCookies([
    {
      name: 'token',
      value: token,
      domain: 'localhost',
      path: '/',
    },
  ]);

  // 3. Mock the API responses
  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      json: {
        data: {
          _id: 'mock_admin_id',
          role: 'admin',
          name: 'Admin User',
          isActive: true,
          team: { _id: 'team_id', name: 'Lakers' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  });

  await page.route('**/api/players*', async route => {
    await route.fulfill({
      status: 200,
      json: {
        data: [
          { _id: 'p1', name: 'LeBron James', team: 'Lakers' },
          { _id: 'p2', name: 'Anthony Davis', team: 'Lakers' },
          { _id: 'p3', name: 'Stephen Curry', team: 'Warriors' },
          { _id: 'p4', name: 'Klay Thompson', team: 'Warriors' },
        ]
      }
    });
  });

  // 4. Navigate to the page
  await page.goto('http://localhost:3000/panel/sessions/new');

  // 5. Select "Partido de Temporada"
  await page.waitForSelector('select');
  await page.selectOption('select', 'Partido de Temporada');

  // 6. Wait for a short moment for effect to run
  await page.waitForTimeout(500);

  // 7. Verify Team A Name is set to Lakers
  await expect(page.locator('input[value="Lakers"]')).toBeVisible();

  // 8. Take screenshot
  await page.screenshot({ path: '/home/jules/verification/create_session.png', fullPage: true });
});