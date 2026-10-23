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
  initialDiffMode = 'sidebyside',
  pageUrl = 'https://example.test/',
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
        <div class="mobile-tools">
          <form>
            <select name="do">
              <option value="">Tools</option>
              <option value="recent">Recent Changes</option>
            </select>
          </form>
        </div>
      </div>
      <div class="diffoptions">
        <form>
          <select name="difftype">
            <option value="sidebyside" ${initialDiffMode === 'sidebyside' ? 'selected' : ''}>Side by Side</option>
            <option value="inline" ${initialDiffMode === 'inline' ? 'selected' : ''}>Inline</option>
          </select>
          <button type="submit">Go</button>
        </form>
      </div>
      <details>
        <summary id="toggle_usertools">User tools</summary>
        <div id="usertools"><a href="#user">User tools</a></div>
      </details>
    </body></html>`,
    { runScripts: 'outside-only', url: pageUrl },
  );
  const { document } = dom.window;
  if (savedTheme) dom.window.localStorage.setItem('zenlike-theme', savedTheme);
  let diffSubmissions = 0;
  const diffForm = document.querySelector('.diffoptions form');
  diffForm.requestSubmit = () => {
    diffSubmissions += 1;
    diffForm.dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true }),
    );
  };
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
    getDiffSubmissions: () => diffSubmissions,
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
  assert.equal(themeToggle.parentElement, document.querySelector('.headings'));
  assert.equal(themeToggle.hidden, true);
  assert.equal(input.placeholder, 'Search ...');

  dom.window.close();
});

test('uses inline diffs on mobile and side-by-side diffs on desktop', async () => {
  const mobilePage = await createPage();
  assert.equal(
    mobilePage.document.querySelector('[name="difftype"]').value,
    'inline',
  );
  assert.equal(mobilePage.getDiffSubmissions(), 1);
  mobilePage.setMobile(false);
  assert.equal(
    mobilePage.document.querySelector('[name="difftype"]').value,
    'sidebyside',
  );
  assert.equal(mobilePage.getDiffSubmissions(), 2);
  mobilePage.dom.window.close();

  const desktopPage = await createPage(false);
  assert.equal(
    desktopPage.document.querySelector('[name="difftype"]').value,
    'sidebyside',
  );
  assert.equal(desktopPage.getDiffSubmissions(), 0);
  desktopPage.dom.window.close();

  const inlineDesktopPage = await createPage(false, false, null, 'inline');
  assert.equal(
    inlineDesktopPage.document.querySelector('[name="difftype"]').value,
    'inline',
  );
  assert.equal(inlineDesktopPage.getDiffSubmissions(), 0);
  inlineDesktopPage.dom.window.close();
});

test('keeps an explicit mobile diff selection', async () => {
  const { document, dom, getDiffSubmissions } = await createPage(
    true,
    false,
    null,
    'sidebyside',
    'https://example.test/?difftype=sidebyside',
  );

  assert.equal(document.querySelector('[name="difftype"]').value, 'sidebyside');
  assert.equal(getDiffSubmissions(), 0);

  dom.window.close();
});

test('keeps a manual diff selection when the viewport changes', async () => {
  const { document, dom, getDiffSubmissions, setMobile } = await createPage();
  const diffType = document.querySelector('[name="difftype"]');

  diffType.value = 'sidebyside';
  diffType.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  setMobile(false);
  setMobile(true);

  assert.equal(diffType.value, 'sidebyside');
  assert.equal(getDiffSubmissions(), 1);
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

test('adds theme modes to mobile tools without submitting navigation', async () => {
  const { document, dom } = await createPage();
  const select = document.querySelector('.mobile-tools select');
  const toggle = document.getElementById('toggle_theme');
  const menuToggle = document.getElementById('toggle_sitemenu');
  const menu = document.getElementById('zenlike__menucontent');
  const appearanceGroup = select.querySelector('optgroup:last-of-type');
  const appearanceOptions = [...appearanceGroup.querySelectorAll('option')];
  let submissions = 0;

  select.addEventListener('change', () => {
    submissions += 1;
  });

  assert.equal(select.options[0].hidden, true);
  assert.equal(appearanceGroup.label, 'Appearance');
  assert.deepEqual(
    appearanceOptions.map((option) => option.value),
    ['zenlike-theme-system', 'zenlike-theme-light', 'zenlike-theme-dark'],
  );
  assert.deepEqual(
    appearanceOptions.map((option) => option.textContent),
    ['✓ System', 'Light', 'Dark'],
  );
  assert.equal(toggle.hidden, true);

  menuToggle.click();
  select.value = 'zenlike-theme-light';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

  assert.equal(menu.hidden, true);
  assert.equal(menuToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, menuToggle);
  assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'light');
  assert.deepEqual(
    appearanceOptions.map((option) => option.textContent),
    ['System', '✓ Light', 'Dark'],
  );
  assert.equal(select.value, '');
  assert.equal(submissions, 0);

  menuToggle.click();
  select.value = 'zenlike-theme-dark';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'dark');
  assert.deepEqual(
    appearanceOptions.map((option) => option.textContent),
    ['System', 'Light', '✓ Dark'],
  );

  menuToggle.click();
  select.value = 'zenlike-theme-system';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'system');
  assert.deepEqual(
    appearanceOptions.map((option) => option.textContent),
    ['✓ System', 'Light', 'Dark'],
  );

  select.value = 'recent';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(submissions, 1);

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
  assert.equal(themeToggle.hidden, false);
  assert.equal(sidebarToggle.hidden, true);
  assert.equal(sidebarToggle.getAttribute('aria-expanded'), 'true');
  assert.equal(sidebar.hidden, false);

  setMobile(true);
  assert.equal(toggle.hidden, false);
  assert.equal(menu.hidden, true);
  assert.equal(search.parentElement, menu);
  assert.equal(themeToggle.parentElement, themeHome);
  assert.equal(themeToggle.hidden, true);
  assert.equal(sidebarToggle.hidden, false);
  assert.equal(sidebarToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(sidebar.hidden, true);

  dom.window.close();
});

test('uses native details disclosure for user tools', async () => {
  const { document, dom } = await createPage();
  const disclosure = document.querySelector('details');
  const toggle = document.getElementById('toggle_usertools');

  assert.equal(disclosure.open, false);
  toggle.click();
  assert.equal(disclosure.open, true);

  toggle.click();
  assert.equal(disclosure.open, false);

  dom.window.close();
});
