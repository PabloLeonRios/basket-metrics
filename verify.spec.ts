import { test, expect } from '@playwright/test';
import * as jose from 'jose';

test('Verify scoreboard layout in GameTracker', async ({ page, context }) => {

  const secret = new TextEncoder().encode("secreto_inseguro_por_defecto_para_dev");
  const payload = {
      "_id": "65b93d0f0000000000000001",
      "name": "Test Coach",
      "email": "coach@test.com",
      "role": "entrenador",
      "isActive": true,
  };

  const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(secret);

  await context.addCookies([{
      name: "token",
      value: token,
      domain: "localhost",
      path: "/"
  }]);

  await page.route('**/api/sessions/*', async route => {
    const json = {
      success: true,
      data: {
        _id: "mock_session_id",
        sessionType: "Partido",
        currentQuarter: 2,
        teams: [
          { _id: "t1", name: "Lakers", players: [{ _id: "p1", name: "LeBron James", dorsal: 23 }] },
          { _id: "t2", name: "Warriors", players: [{ _id: "p2", name: "Stephen Curry", dorsal: 30 }] }
        ]
      }
    };
    await route.fulfill({ json });
  });

  await page.route('**/api/game-events?sessionId=*', async route => {
    const json = {
      success: true,
      data: [
        { _id: "e1", type: "tiro", team: "Lakers", details: { made: true, value: 3 }, player: "p1" },
        { _id: "e2", type: "tiro", team: "Lakers", details: { made: true, value: 2 }, player: "p1" },
        { _id: "e3", type: "tiro_libre", team: "Warriors", details: { made: true, value: 1 }, player: "p2" }
      ]
    };
    await route.fulfill({ json });
  });

  await page.route('**/api/assistant/proactive-suggestion', async route => {
    const json = {
        success: true,
        data: {
            type: 'POSITIVA',
            reason: 'El equipo está manteniendo un ritmo de juego sólido, rotaciones y toma de decisiones equilibradas. Mantengan la intensidad actual y la concentración en defensa.'
        }
    }
    await route.fulfill({ json });
  });

  await page.goto('http://localhost:3000/panel/tracker/mock_session_id');
  await expect(page.locator('text="Lakers"').first()).toBeVisible({ timeout: 10000 });

  await page.screenshot({ path: '/home/jules/verification/scoreboard.png', fullPage: true });

  // Test IA Suggestion Modal
  await page.locator('button:has-text("Sugerencia IA")').click();
  await expect(page.locator('h3:has-text("Sugerencia de la IA")')).toBeVisible();
  await expect(page.locator('p:has-text("El equipo está manteniendo")')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/ia_suggestion.png', fullPage: true });

});