import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';

const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');

async function createPage(
  initiallyMobile = true,
  systemDark = false,
  savedTheme = null,
) {
  const dom = new JSDOM(
    `<!doctype html>
    <html><body>
      <div class="headings">
        <div id="headercontent"></div>
        <button id="toggle_sitemenu" aria-expanded="false" hidden></button>
        <div id="header-tools">
          <div id="search">
            <form>
              <input class="edit">
              <button type="submit">Search</button>
            </form>
          </div>
        </div>
        <button id="toggle_theme" data-appearance-label="Appearance" data-theme-system-label="System" data-theme-light-label="Light" data-theme-dark-label="Dark" data-next-label="Next mode" aria-label="Appearance: System. Next mode: Light" title="Appearance: System. Next mode: Light"><span class="appearance-icon" aria-hidden="true">◐</span></button>
      </div>
      <button id="toggle_sidebar" aria-controls="dokuwiki__aside" aria-expanded="true" hidden>Sidebar</button>
      <nav id="dokuwiki__aside"><a href="#sidebar">Sidebar link</a></nav>
      <div id="zenlike__menucontent" hidden>
        <nav><a href="#page">Page</a></nav>
      </div>
      <button id="toggle_usertools" aria-expanded="false"></button>
      <div id="usertools" hidden><a href="#user">User tools</a></div>
    </body></html>`,
    { runScripts: 'outside-only', url: 'https://example.test/' },
  );
  const { document } = dom.window;
  if (savedTheme) dom.window.localStorage.setItem('zenlike-theme', savedTheme);
  let matches = initiallyMobile;
  const listeners = new Set();
  let systemMatches = systemDark;
  const systemListeners = new Set();
  const mediaQuery = {
    get matches() {
      return matches;
    },
    addEventListener(type, listener) {
      if (type === 'change') listeners.add(listener);
    },
    addListener(listener) {
      listeners.add(listener);
    },
  };
  const systemMediaQuery = {
    get matches() {
      return systemMatches;
    },
    addEventListener(type, listener) {
      if (type === 'change') systemListeners.add(listener);
    },
    addListener(listener) {
      systemListeners.add(listener);
    },
  };
  dom.window.matchMedia = (query) =>
    query.includes('prefers-color-scheme') ? systemMediaQuery : mediaQuery;

  const ready =
    document.readyState === 'loading'
      ? new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve, {
            once: true,
          });
        })
      : Promise.resolve();

  dom.window.eval(script);
  await ready;

  return {
    dom,
    document,
    setMobile(value) {
      matches = value;
      for (const listener of listeners) listener();
    },
    setSystemDark(value) {
      systemMatches = value;
      for (const listener of systemListeners) listener();
    },
  };
}

test('initializes the mobile menu and moves search into its panel', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_sitemenu');
  const menu = document.getElementById('zenlike__menucontent');
  const search = document.getElementById('search');
  const themeToggle = document.getElementById('toggle_theme');
  const input = search.querySelector('input');

  assert.equal(toggle.hidden, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(menu.hidden, true);
  assert.equal(search.parentElement, menu);
  assert.equal(themeToggle.parentElement, menu);
  assert.equal(themeToggle, menu.lastElementChild);
  assert.equal(themeToggle.classList.contains('theme-toggle--menu'), true);
  assert.equal(input.placeholder, 'Search ...');

  dom.window.close();
});

test('collapses the sidebar on mobile and toggles its ARIA state', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_sidebar');
  const sidebar = document.getElementById('dokuwiki__aside');

  assert.equal(toggle.hidden, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(sidebar.hidden, true);

  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(sidebar.hidden, false);

  dom.window.close();
});

test('closes the mobile sidebar on Escape and restores focus', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_sidebar');
  const sidebar = document.getElementById('dokuwiki__aside');
  toggle.click();
  toggle.focus();

  document.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Escape' }),
  );

  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(sidebar.hidden, true);
  assert.equal(document.activeElement, toggle);

  dom.window.close();
});

test('follows system appearance and stores explicit theme choices', async () => {
  const { document, dom, setSystemDark } = await createPage(false, true);
  const root = document.documentElement;
  const toggle = document.getElementById('toggle_theme');

  assert.equal(root.getAttribute('data-theme'), 'dark');
  assert.match(toggle.getAttribute('aria-label'), /System/);
  assert.equal(toggle.querySelector('.appearance-icon').textContent, '◐');

  toggle.click();
  assert.equal(root.getAttribute('data-theme'), 'light');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'light');
  assert.match(toggle.getAttribute('aria-label'), /Light/);
  assert.equal(toggle.querySelector('.appearance-icon').textContent, '☀');

  toggle.click();
  assert.equal(root.getAttribute('data-theme'), 'dark');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'dark');
  assert.match(toggle.getAttribute('aria-label'), /Dark/);
  assert.equal(toggle.querySelector('.appearance-icon').textContent, '☾');

  toggle.click();
  setSystemDark(false);
  assert.equal(root.getAttribute('data-theme'), 'light');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'system');
  assert.match(toggle.getAttribute('aria-label'), /System/);

  dom.window.close();
});

test('restores a saved theme preference on initialization', async () => {
  const { document, dom } = await createPage(false, false, 'dark');

  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(document.querySelector('.appearance-icon').textContent, '☾');
  assert.match(
    document.getElementById('toggle_theme').getAttribute('aria-label'),
    /Dark/,
  );

  dom.window.close();
});

test('opens and closes the mobile menu with synchronized ARIA state', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_sitemenu');
  const menu = document.getElementById('zenlike__menucontent');

  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(menu.hidden, false);

  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(menu.hidden, true);

  dom.window.close();
});

test('closes the mobile menu on Escape and restores focus to its toggle', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_sitemenu');
  const menu = document.getElementById('zenlike__menucontent');
  toggle.click();

  document.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Escape' }),
  );

  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(menu.hidden, true);
  assert.equal(document.activeElement, toggle);

  dom.window.close();
});

test('closes the mobile menu after following a menu link', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_sitemenu');
  const menu = document.getElementById('zenlike__menucontent');
  toggle.click();

  menu.querySelector('a').click();

  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(menu.hidden, true);

  dom.window.close();
});

test('restores the search on desktop and updates menu visibility on resize', async () => {
  const { document, dom, setMobile } = await createPage();
  const toggle = document.getElementById('toggle_sitemenu');
  const menu = document.getElementById('zenlike__menucontent');
  const search = document.getElementById('search');
  const searchHome = document.getElementById('header-tools');
  const themeToggle = document.getElementById('toggle_theme');
  const themeHome = document.querySelector('.headings');
  const sidebarToggle = document.getElementById('toggle_sidebar');
  const sidebar = document.getElementById('dokuwiki__aside');

  setMobile(false);
  assert.equal(toggle.hidden, true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(menu.hidden, false);
  assert.equal(search.parentElement, searchHome);
  assert.equal(themeToggle.parentElement, themeHome);
  assert.equal(themeToggle.classList.contains('theme-toggle--menu'), false);
  assert.equal(sidebarToggle.hidden, true);
  assert.equal(sidebarToggle.getAttribute('aria-expanded'), 'true');
  assert.equal(sidebar.hidden, false);

  setMobile(true);
  assert.equal(toggle.hidden, false);
  assert.equal(menu.hidden, true);
  assert.equal(search.parentElement, menu);
  assert.equal(themeToggle.parentElement, menu);
  assert.equal(themeToggle.classList.contains('theme-toggle--menu'), true);
  assert.equal(sidebarToggle.hidden, false);
  assert.equal(sidebarToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(sidebar.hidden, true);

  dom.window.close();
});

test('toggles user tools and keeps their ARIA state synchronized', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_usertools');
  const userTools = document.getElementById('usertools');

  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(userTools.hidden, false);

  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(userTools.hidden, true);

  dom.window.close();
});
