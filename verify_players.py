from playwright.sync_api import sync_playwright
import time
import os
import subprocess

def verify_players_tabs():
    js_code = """
    const jose = require('jose');

    async function run() {
        const secret = new TextEncoder().encode('secreto_inseguro_por_defecto_para_dev');
        const token = await new jose.SignJWT({
            _id: '123456789012345678901234',
            email: 'coach@test.com',
            name: 'Test Coach',
            role: 'entrenador',
            isActive: true,
            team: { _id: 'team123', name: 'My Team' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

        console.log(token);
    }
    run();
    """
    with open("/app/generate_token.js", "w") as f:
        f.write(js_code)

    token = subprocess.check_output(["node", "/app/generate_token.js"]).decode('utf-8').strip()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        context.add_cookies([{
            "name": "token",
            "value": token,
            "domain": "localhost",
            "path": "/",
        }])

        # Route mocking for the players API to avoid MongoDB requirements
        def route_handler(route, request):
            if "teamType=mine" in request.url:
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body='{"success":true,"data":[{"_id":"player1","name":"John Doe","team":"My Team","dorsal":10,"position":"Base","isActive":true}],"currentPage":1,"totalPages":1,"totalCount":1}'
                )
            elif "teamType=rivals" in request.url:
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body='{"success":true,"data":[{"_id":"player2","name":"Jane Smith","team":"Rival Team","dorsal":20,"position":"Escolta","isActive":true}],"currentPage":1,"totalPages":1,"totalCount":1}'
                )
            else:
                route.continue_()

        page.route("**/api/players*", route_handler)

        page.goto("http://localhost:3000/panel/players")
        page.wait_for_timeout(3000)

        page.screenshot(path="/app/players_my_team.png")

        page.get_by_role("button", name="Rivales").click()
        page.wait_for_timeout(1000)

        page.screenshot(path="/app/players_rivals.png")

        browser.close()

if __name__ == "__main__":
    verify_players_tabs()
