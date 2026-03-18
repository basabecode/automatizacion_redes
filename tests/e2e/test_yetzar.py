"""
Yetzar — Suite de tests E2E con Playwright
Ejecutar: python tests/e2e/test_yetzar.py
Requiere: pnpm dev corriendo en localhost:3000
"""

import sys
import os
import io
import time
from playwright.sync_api import sync_playwright, Page, expect

# Forzar UTF-8 en Windows para evitar UnicodeEncodeError
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE_URL    = "http://localhost:3000"
EMAIL       = "admin@local.com"
PASSWORD    = "password123"
SCREENSHOTS = os.path.join(os.path.dirname(__file__), "screenshots")

os.makedirs(SCREENSHOTS, exist_ok=True)

# ── Colores para output ──────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

results: list[dict] = []

def ok(name: str, msg: str = ""):
    tag = f"{GREEN}✓ PASS{RESET}"
    print(f"  {tag}  {name}" + (f" — {msg}" if msg else ""))
    results.append({"name": name, "status": "pass"})

def fail(name: str, error: str):
    tag = f"{RED}✗ FAIL{RESET}"
    print(f"  {tag}  {name} — {error}")
    results.append({"name": name, "status": "fail", "error": error})

def screenshot(page: Page, name: str):
    path = os.path.join(SCREENSHOTS, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    return path

def login(page: Page):
    """Helper: hace login y espera redirect al dashboard."""
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.fill("#login-email", EMAIL)
    page.fill("#login-password", PASSWORD)
    page.click("#login-submit")
    page.wait_for_url(f"{BASE_URL}/dashboard", timeout=8000)


# ── TEST 1: Redirect de / a /login si no hay sesión ─────────────────────────
def test_redirect_unauthenticated(page: Page):
    print(f"\n{CYAN}▸ Auth & Redirect{RESET}")
    try:
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        url = page.url
        assert "/login" in url or "/dashboard" in url, f"URL inesperada: {url}"
        ok("Redirect raíz", f"→ {url}")
    except Exception as e:
        fail("Redirect raíz", str(e))

    try:
        page.goto(f"{BASE_URL}/dashboard/projects")
        page.wait_for_load_state("networkidle")
        assert "/login" in page.url, f"Debería redirigir a login, got: {page.url}"
        ok("Protección de ruta /dashboard/projects")
    except Exception as e:
        fail("Protección de ruta /dashboard/projects", str(e))


# ── TEST 2: Login correcto ───────────────────────────────────────────────────
def test_login(page: Page):
    print(f"\n{CYAN}▸ Login{RESET}")
    try:
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        screenshot(page, "01_login_page")

        # Verifica que el título "Yetzar" esté presente
        assert page.locator("text=Yetzar").first.is_visible(), "No se encontró 'Yetzar' en login"
        ok("Branding Yetzar visible en login")
    except Exception as e:
        fail("Branding Yetzar visible en login", str(e))

    try:
        # Login con credenciales incorrectas
        page.fill("#login-email", "wrong@test.com")
        page.fill("#login-password", "wrongpass")
        page.click("#login-submit")
        page.wait_for_timeout(2000)
        # El error puede aparecer aunque el botón quede disabled (NextAuth tarda)
        still_on_login = "/login" in page.url
        assert still_on_login, "Debería permanecer en login con credenciales incorrectas"
        ok("Error con credenciales incorrectas — permanece en /login")
    except Exception as e:
        fail("Error con credenciales incorrectas", str(e))

    try:
        # Login correcto
        page.fill("#login-email", EMAIL)
        page.fill("#login-password", PASSWORD)
        page.click("#login-submit")
        page.wait_for_url(f"{BASE_URL}/dashboard", timeout=8000)
        screenshot(page, "02_dashboard")
        ok("Login exitoso", f"→ {page.url}")
    except Exception as e:
        fail("Login exitoso", str(e))
        screenshot(page, "02_login_fail")


# ── TEST 3: Navegación del sidebar ──────────────────────────────────────────
def test_navigation(page: Page):
    print(f"\n{CYAN}▸ Navegación del sidebar{RESET}")
    login(page)

    nav_items = [
        ("/dashboard",                   "Inicio"),
        ("/dashboard/projects",          "Proyectos"),
        ("/dashboard/generate",          "Generar"),
        ("/dashboard/posts",             "Posts"),
        ("/dashboard/settings/accounts", "Cuentas sociales"),
        ("/dashboard/settings",          "API Keys"),
    ]

    for path, label in nav_items:
        try:
            page.goto(f"{BASE_URL}{path}")
            page.wait_for_load_state("networkidle")
            status = page.evaluate("() => document.title")
            assert page.url == f"{BASE_URL}{path}", f"URL no coincide: {page.url}"
            assert "404" not in page.content().lower()[:500], "Página contiene 404"
            ok(f"/{path.split('/')[-1] or 'dashboard'} ({label})")
        except Exception as e:
            fail(f"{label} → {path}", str(e))
            screenshot(page, f"nav_fail_{label.replace(' ', '_')}")

    screenshot(page, "03_navigation")


# ── TEST 4: Dashboard carga datos ────────────────────────────────────────────
def test_dashboard_loads(page: Page):
    print(f"\n{CYAN}▸ Dashboard{RESET}")
    login(page)

    try:
        page.goto(f"{BASE_URL}/dashboard")
        page.wait_for_load_state("networkidle")

        # Verifica que el sidebar de Yetzar está presente
        assert page.locator("text=Yetzar").first.is_visible()
        ok("Branding Yetzar en sidebar")
    except Exception as e:
        fail("Branding Yetzar en sidebar", str(e))

    try:
        # Verifica que las stat cards cargan (tienen números)
        page.wait_for_timeout(1000)
        stats = page.locator(".rounded-2xl").all()
        assert len(stats) > 0, "No se encontraron stat cards"
        ok("Stat cards renderizadas", f"{len(stats)} cards")
    except Exception as e:
        fail("Stat cards renderizadas", str(e))

    try:
        # Verifica que la sección Chispa IA existe
        assert page.locator("text=Chispa IA del día").is_visible()
        ok("Sección 'Chispa IA del día' visible")
    except Exception as e:
        fail("Sección 'Chispa IA del día' visible", str(e))

    try:
        # Verifica pilares de contenido
        assert page.locator("text=Pilares de contenido").is_visible()
        ok("Sección 'Pilares de contenido' visible")
    except Exception as e:
        fail("Sección 'Pilares de contenido' visible", str(e))

    screenshot(page, "04_dashboard_loaded")


# ── TEST 5: Proyectos CRUD ───────────────────────────────────────────────────
def test_projects_crud(page: Page):
    print(f"\n{CYAN}▸ Proyectos CRUD{RESET}")
    login(page)
    page.goto(f"{BASE_URL}/dashboard/projects")
    page.wait_for_load_state("networkidle")
    screenshot(page, "05_projects_before")

    project_name = f"Test Proyecto {int(time.time())}"
    project_slug = f"test-proyecto-{int(time.time())}"

    # Crear
    try:
        page.click("button:has-text('Nuevo proyecto')")
        page.wait_for_timeout(500)

        page.fill("input[placeholder='SomosTécnicos']", project_name)
        page.fill("input[placeholder='somostecnicos']", project_slug)
        page.fill("input[placeholder='tecnología, barbería, salud...']", "tecnología")

        page.click("button:has-text('Crear proyecto')")
        page.wait_for_timeout(1500)
        screenshot(page, "06_project_created")
        ok("Crear proyecto", project_name)
    except Exception as e:
        fail("Crear proyecto", str(e))
        screenshot(page, "06_project_create_fail")

    # Verificar que aparece en la lista
    try:
        page.wait_for_timeout(1000)
        # Buscar el texto del proyecto en cualquier elemento
        matches = page.locator(f"text={project_name}").all()
        assert len(matches) > 0, f"No se encontró '{project_name}' en la página"
        ok("Proyecto aparece en lista")
    except Exception as e:
        fail("Proyecto aparece en lista", str(e))

    # Botón generar desde proyectos
    try:
        gen_btn = page.locator("a:has-text('Generar')").first
        assert gen_btn.count() > 0, "No se encontró ningún botón Generar"
        ok("Botón 'Generar' visible en proyecto")
    except Exception as e:
        fail("Botón 'Generar' visible en proyecto", str(e))


# ── TEST 6: Página de Generar ────────────────────────────────────────────────
def test_generate_page(page: Page):
    print(f"\n{CYAN}▸ Página Generar{RESET}")
    login(page)
    page.goto(f"{BASE_URL}/dashboard/generate")
    page.wait_for_load_state("networkidle")
    screenshot(page, "07_generate_page")

    try:
        # El select de proyectos debe cargar
        page.wait_for_selector("select", timeout=5000)
        options = page.locator("select option").all()
        ok("Select de proyectos carga", f"{len(options)} opciones")
    except Exception as e:
        fail("Select de proyectos carga", str(e))

    try:
        # Los botones de redes sociales deben estar presentes
        assert page.locator("button:has-text('Facebook')").is_visible()
        assert page.locator("button:has-text('Instagram')").is_visible()
        assert page.locator("button:has-text('TikTok')").is_visible()
        ok("Botones de redes sociales visibles")
    except Exception as e:
        fail("Botones de redes sociales visibles", str(e))

    try:
        # Botón generar debe estar deshabilitado sin datos
        btn = page.locator("button:has-text('Generar contenido')").last
        assert btn.is_disabled(), "El botón debería estar deshabilitado sin proyecto/tema"
        ok("Botón 'Generar' deshabilitado sin datos (validación correcta)")
    except Exception as e:
        fail("Botón 'Generar' deshabilitado sin datos", str(e))


# ── TEST 7: Historial de Posts ───────────────────────────────────────────────
def test_posts_page(page: Page):
    print(f"\n{CYAN}▸ Historial de Posts{RESET}")
    login(page)
    page.goto(f"{BASE_URL}/dashboard/posts")
    page.wait_for_load_state("networkidle")
    screenshot(page, "08_posts_page")

    try:
        # La página debe cargar sin error
        assert "404" not in page.content()[:500]
        ok("Página de posts carga sin error")
    except Exception as e:
        fail("Página de posts carga sin error", str(e))

    try:
        # Debe mostrar el título
        assert page.locator("text=Historial de posts").is_visible()
        ok("Título 'Historial de posts' visible")
    except Exception as e:
        fail("Título 'Historial de posts' visible", str(e))


# ── TEST 8: Settings / API Keys ──────────────────────────────────────────────
def test_settings_page(page: Page):
    print(f"\n{CYAN}▸ Settings / API Keys{RESET}")
    login(page)
    page.goto(f"{BASE_URL}/dashboard/settings")
    page.wait_for_load_state("networkidle")
    screenshot(page, "09_settings_page")

    try:
        assert page.locator("text=Configuración").first.is_visible()
        ok("Página de configuración carga")
    except Exception as e:
        fail("Página de configuración carga", str(e))

    try:
        # Debe mostrar los campos de API keys
        assert page.locator("text=Anthropic API Key").is_visible()
        assert page.locator("text=fal.ai API Key").is_visible()
        ok("Campos de API Keys visibles")
    except Exception as e:
        fail("Campos de API Keys visibles", str(e))


# ── TEST 9: Cuentas Sociales ─────────────────────────────────────────────────
def test_accounts_page(page: Page):
    print(f"\n{CYAN}▸ Cuentas Sociales{RESET}")
    login(page)
    page.goto(f"{BASE_URL}/dashboard/settings/accounts")
    page.wait_for_load_state("networkidle")
    screenshot(page, "10_accounts_page")

    try:
        assert page.locator("text=Cuentas sociales").first.is_visible()
        ok("Página de cuentas carga")
    except Exception as e:
        fail("Página de cuentas carga", str(e))

    try:
        # Botón principal "Agregar cuenta" (el del header, no el inline)
        assert page.locator("button.btn-primary:has-text('Agregar cuenta')").is_visible()
        ok("Botón 'Agregar cuenta' visible")
    except Exception as e:
        fail("Botón 'Agregar cuenta' visible", str(e))

    try:
        # Abrir formulario
        page.click("button:has-text('Agregar cuenta')")
        page.wait_for_timeout(500)
        assert page.locator("text=Vincular nueva cuenta").is_visible()
        ok("Formulario de nueva cuenta se abre")
        screenshot(page, "10b_accounts_form")
    except Exception as e:
        fail("Formulario de nueva cuenta se abre", str(e))


# ── TEST 10: Logout ──────────────────────────────────────────────────────────
def test_logout(page: Page):
    print(f"\n{CYAN}▸ Logout{RESET}")
    login(page)

    try:
        page.click("button:has-text('Cerrar sesión')")
        page.wait_for_url(f"{BASE_URL}/login", timeout=6000)
        ok("Logout redirige a /login")
        screenshot(page, "11_after_logout")
    except Exception as e:
        fail("Logout redirige a /login", str(e))

    try:
        # Después de logout, /dashboard debe redirigir a login
        page.goto(f"{BASE_URL}/dashboard")
        page.wait_for_load_state("networkidle")
        assert "/login" in page.url
        ok("Sesión destruida — /dashboard redirige a login")
    except Exception as e:
        fail("Sesión destruida", str(e))


# ── RUNNER PRINCIPAL ─────────────────────────────────────────────────────────
def run_all():
    print(f"\n{BOLD}{CYAN}{'═' * 60}{RESET}")
    print(f"{BOLD}{CYAN}  Yetzar — Suite E2E Tests{RESET}")
    print(f"{BOLD}{CYAN}  {BASE_URL}{RESET}")
    print(f"{BOLD}{CYAN}{'═' * 60}{RESET}")

    tests = [
        test_redirect_unauthenticated,
        test_login,
        test_navigation,
        test_dashboard_loads,
        test_projects_crud,
        test_generate_page,
        test_posts_page,
        test_settings_page,
        test_accounts_page,
        test_logout,
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})

        for test_fn in tests:
            page = context.new_page()
            try:
                test_fn(page)
            except Exception as e:
                fail(test_fn.__name__, f"Error inesperado: {e}")
            finally:
                page.close()

        browser.close()

    # ── Resumen final ────────────────────────────────────────────────────────
    passed = sum(1 for r in results if r["status"] == "pass")
    failed = sum(1 for r in results if r["status"] == "fail")
    total  = len(results)

    print(f"\n{BOLD}{'─' * 60}{RESET}")
    print(f"{BOLD}  Resultado: {GREEN}{passed} pasaron{RESET}  {RED if failed else ''}{failed} fallaron{RESET}  / {total} total{RESET}")

    if failed:
        print(f"\n{RED}  Tests fallidos:{RESET}")
        for r in results:
            if r["status"] == "fail":
                print(f"    {RED}✗{RESET} {r['name']}: {r.get('error', '')}")

    print(f"\n  Screenshots guardados en: {SCREENSHOTS}\n")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_all())
