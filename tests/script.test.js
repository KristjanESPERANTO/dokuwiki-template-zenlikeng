import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';

const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');

async function createPage(initiallyMobile = true) {
  const dom = new JSDOM(
    `<!doctype html>
    <html><body>
      <div id="headercontent">
        <button id="toggle_sitemenu" aria-expanded="false" hidden></button>
        <div id="search">
          <form>
            <input class="edit">
            <button type="submit">Search</button>
          </form>
        </div>
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
  let matches = initiallyMobile;
  const listeners = new Set();
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
  dom.window.matchMedia = () => mediaQuery;

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
  };
}

test('initializes the mobile menu and moves search into its panel', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_sitemenu');
  const menu = document.getElementById('zenlike__menucontent');
  const search = document.getElementById('search');
  const input = search.querySelector('input');

  assert.equal(toggle.hidden, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(menu.hidden, true);
  assert.equal(search.parentElement, menu);
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
  const searchHome = document.getElementById('headercontent');
  const sidebarToggle = document.getElementById('toggle_sidebar');
  const sidebar = document.getElementById('dokuwiki__aside');

  setMobile(false);
  assert.equal(toggle.hidden, true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(menu.hidden, false);
  assert.equal(search.parentElement, searchHome);
  assert.equal(sidebarToggle.hidden, true);
  assert.equal(sidebarToggle.getAttribute('aria-expanded'), 'true');
  assert.equal(sidebar.hidden, false);

  setMobile(true);
  assert.equal(toggle.hidden, false);
  assert.equal(menu.hidden, true);
  assert.equal(search.parentElement, menu);
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
