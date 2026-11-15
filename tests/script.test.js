import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';

const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');

test('sets the theme before first paint on every page type', () => {
  const functions = readFileSync(
    new URL('../tpl_functions.php', import.meta.url),
    'utf8',
  );
  const initialScript = functions.match(/<script>([\s\S]*?)<\/script>/)[1];

  for (const file of ['main.php', 'mediamanager.php', 'detail.php']) {
    const template = readFileSync(
      new URL(`../${file}`, import.meta.url),
      'utf8',
    );
    assert.match(template, /_tpl_init_theme\(\)/, file);
  }

  for (const [preference, systemDark, expected] of [
    ['dark', false, 'dark'],
    ['light', true, 'light'],
    ['system', true, 'dark'],
    ['system', false, 'light'],
    [null, true, 'dark'],
  ]) {
    const dom = new JSDOM('<!doctype html><html class="no-js"></html>', {
      runScripts: 'outside-only',
      url: 'https://example.test/',
    });
    if (preference)
      dom.window.localStorage.setItem('zenlike-theme', preference);
    dom.window.matchMedia = () => ({ matches: systemDark });
    dom.window.eval(initialScript);

    assert.equal(dom.window.document.documentElement.dataset.theme, expected);
    assert.equal(dom.window.document.documentElement.className, 'js');
    dom.window.close();
  }
});

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
        <button id="toggle_sitemenu" aria-expanded="false" data-mobile-label="Menu" data-desktop-label="Tools" hidden></button>
        <div id="header-tools">
          <div id="search">
            <form>
              <input class="edit">
              <button type="submit">Search</button>
            </form>
          </div>
        </div>
        <div id="desktop-tools-content" hidden><div id="desktop-pagetools-content"></div><nav id="desktop-sitetools"><ul></ul></nav><label for="desktop-theme">Appearance</label><select id="desktop-theme"></select></div>
        <button id="toggle_theme" data-appearance-label="Appearance" data-theme-system-label="System" data-theme-light-label="Light" data-theme-dark-label="Dark" data-next-label="Next mode" aria-label="Appearance: System. Next mode: Light" title="Appearance: System. Next mode: Light"><span class="appearance-icon" aria-hidden="true">◐</span></button>
      </div>
      <button id="toggle_sidebar" aria-controls="dokuwiki__aside" aria-expanded="true" hidden>Sidebar</button>
      <nav id="dokuwiki__aside"><a href="#sidebar">Sidebar link</a></nav>
      <div id="zenlike__menucontent" hidden>
        <nav><a href="#page">Page</a></nav>
        <div class="desktop-tools"><ul class="desktop-menu"><li class="action recent"><a href="#recent">Recent Changes</a></li><li class="action media"><a href="#media">Media Manager</a></li><li class="action index"><a href="#index">Sitemap</a></li><li class="action plugin"><a href="#plugin">Plugin</a></li></ul></div>
        <div class="mobile-tools">
          <form>
            <select name="do">
              <option value="">Tools</option>
              <optgroup label="Page Tools">
                <option value="edit">Edit this page</option>
              </optgroup>
              <optgroup label="Site Tools">
                <option value="recent">Recent Changes</option>
              </optgroup>
            </select>
          </form>
          <div class="mobile-tools-list" hidden>
            <section class="mobile-tools-group" data-mobile-group="page"><ul><li><button type="button" data-mobile-action="edit"><svg></svg><span>Edit this page</span></button></li></ul></section>
            <section class="mobile-tools-group" data-mobile-group="site"><ul><li><button type="button" data-mobile-action="recent"><svg></svg><span>Recent Changes</span></button></li><li><button type="button" data-mobile-action="missing"><svg></svg><span>Unavailable</span></button></li></ul></section>
            <section class="mobile-tools-group" data-mobile-group="user"><ul></ul></section>
            <label for="mobile-theme">Appearance</label><select id="mobile-theme"></select>
          </div>
        </div>
      </div>
      <footer id="dokuwiki__footer">
        <nav id="dokuwiki__pagetools">
          <h3>Page Tools</h3>
          <ul>
            <li class="action top"><a href="#dokuwiki__top">Back to top</a></li>
            <li class="action discussion"><a href="/doku.php?id=talk:welcome" data-wiki-id="talk:welcome">Discussion</a></li>
          </ul>
        </nav>
        <nav id="zenlike__footer-pagetools" hidden><ul></ul></nav>
      </footer>
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

test('uses icon actions and synchronized appearance in mobile tools', async () => {
  const { document, dom } = await createPage();
  const select = document.querySelector('.mobile-tools form select');
  const theme = document.getElementById('mobile-theme');
  const desktopTheme = document.getElementById('desktop-theme');
  const tools = document.querySelector('.mobile-tools-list');
  const menuToggle = document.getElementById('toggle_sitemenu');
  const menu = document.getElementById('zenlike__menucontent');
  const discussionLink = tools.querySelector('li.discussion a');
  let action = null;

  discussionLink.addEventListener('click', (event) => {
    event.preventDefault();
  });
  select.addEventListener('change', () => {
    action = select.value;
  });

  assert.equal(tools.hidden, false);
  assert.equal(select.closest('form').hidden, true);
  assert.equal(tools.querySelectorAll('[data-mobile-action] svg').length, 2);
  assert.equal(tools.querySelector('[data-mobile-action="missing"]'), null);
  assert.equal(tools.querySelector('[data-mobile-group="user"]').hidden, true);
  assert.equal(discussionLink.getAttribute('data-wiki-id'), 'talk:welcome');
  assert.deepEqual(
    [...theme.options].map((option) => option.value),
    ['system', 'light', 'dark'],
  );

  menuToggle.click();
  theme.value = 'dark';
  theme.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'dark');
  assert.equal(desktopTheme.value, 'dark');
  assert.equal(action, null);

  tools.querySelector('[data-mobile-action="recent"]').click();
  assert.equal(action, 'recent');
  assert.equal(menu.hidden, true);
  assert.equal(menuToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, menuToggle);

  menuToggle.click();
  discussionLink.click();
  assert.equal(menu.hidden, true);

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
  const pageTools = document.getElementById('dokuwiki__pagetools');
  const footerPageTools = document.getElementById('zenlike__footer-pagetools');
  const backToTop = document.querySelector(
    '#zenlike__footer-pagetools li.action.top',
  );

  assert.equal(pageTools.parentElement.id, 'dokuwiki__footer');
  setMobile(false);
  assert.equal(toggle.hidden, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(toggle.getAttribute('aria-controls'), 'desktop-tools-content');
  assert.equal(toggle.getAttribute('aria-label'), 'Tools');
  assert.equal(menu.hidden, false);
  assert.equal(search.parentElement, searchHome);
  assert.equal(themeToggle.parentElement, themeHome);
  assert.equal(themeToggle.hidden, true);
  assert.equal(sidebarToggle.hidden, true);
  assert.equal(sidebarToggle.getAttribute('aria-expanded'), 'true');
  assert.equal(sidebar.hidden, false);
  assert.equal(pageTools.parentElement.id, 'desktop-pagetools-content');
  assert.equal(backToTop.parentElement, footerPageTools.querySelector('ul'));
  assert.equal(pageTools.hidden, false);
  assert.equal(footerPageTools.hidden, false);
  assert.equal(document.getElementById('desktop-tools-content').hidden, true);
  assert.deepEqual(
    [...document.querySelectorAll('#desktop-sitetools li')].map(
      (item) => item.className,
    ),
    ['action recent', 'action media', 'action index'],
  );
  assert.ok(document.querySelector('.desktop-menu > li.action.plugin'));

  setMobile(true);
  assert.equal(toggle.hidden, false);
  assert.equal(menu.hidden, true);
  assert.equal(search.parentElement, menu);
  assert.equal(themeToggle.parentElement, themeHome);
  assert.equal(themeToggle.hidden, true);
  assert.equal(sidebarToggle.hidden, false);
  assert.equal(sidebarToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(sidebar.hidden, true);
  assert.equal(backToTop.parentElement, footerPageTools.querySelector('ul'));
  assert.equal(pageTools.parentElement.id, 'dokuwiki__footer');
  assert.equal(pageTools.hidden, true);
  assert.equal(footerPageTools.hidden, false);
  assert.equal(document.getElementById('desktop-tools-content').hidden, true);
  assert.equal(toggle.getAttribute('aria-controls'), 'zenlike__menucontent');
  assert.equal(toggle.getAttribute('aria-label'), 'Menu');

  dom.window.close();
});

test('closes desktop page tools on Escape and outside click', async () => {
  const { document, dom } = await createPage(false);
  const menu = document.getElementById('desktop-tools-content');
  const toggle = document.getElementById('toggle_sitemenu');

  toggle.click();
  assert.equal(menu.hidden, false);
  document.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  assert.equal(menu.hidden, true);
  assert.equal(document.activeElement, toggle);

  toggle.click();
  document.body.click();
  assert.equal(menu.hidden, true);

  toggle.click();
  document.querySelector('#dokuwiki__pagetools a').click();
  assert.equal(menu.hidden, true);

  dom.window.close();
});

test('changes appearance from the desktop tools menu', async () => {
  const { document, dom, setMobile } = await createPage(false);
  const select = document.getElementById('desktop-theme');
  assert.deepEqual(
    [...select.options].map((option) => option.value),
    ['system', 'light', 'dark'],
  );
  select.value = 'dark';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'dark');
  const menu = document.getElementById('desktop-tools-content');
  document.getElementById('toggle_sitemenu').click();
  assert.equal(menu.hidden, false);
  setMobile(true);
  assert.equal(menu.hidden, true);
  setMobile(false);
  assert.equal(select.value, 'dark');
  dom.window.close();
});

test('uses native details disclosure for user tools', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_usertools');
  const disclosure = toggle.closest('details');

  assert.equal(disclosure.open, false);
  toggle.click();
  assert.equal(disclosure.open, true);

  toggle.click();
  assert.equal(disclosure.open, false);

  dom.window.close();
});
