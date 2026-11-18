import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';

const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');

test('keeps copy feedback visible and updates its accessible tooltip', async () => {
  const dom = new JSDOM(
    '<div class="dokuwiki"><pre class="code"><span class="keyword">example</span>\nsecond line</pre></div>',
    {
      runScripts: 'outside-only',
    },
  );
  dom.window.eval(script);
  await new Promise((resolve) =>
    dom.window.document.addEventListener('DOMContentLoaded', resolve),
  );
  const code = dom.window.document.querySelector('pre');
  const button = dom.window.document.createElement('button');
  button.className = 'code-copy-btn';
  button.textContent = 'Copy';
  code.append(button);
  await Promise.resolve();
  const content = code.querySelector(':scope > .code-copy-content');
  assert.equal(content.textContent, 'example\nsecond line');
  assert.equal(content.querySelector('.keyword').textContent, 'example');
  assert.equal(button.parentElement, code);
  assert.equal(button.dataset.iconAction, 'copy');
  assert.equal(button.title, 'Copy');
  assert.equal(button.getAttribute('aria-live'), 'polite');
  button.textContent = 'Copied!';
  await Promise.resolve();
  assert.equal(button.dataset.iconAction, 'feedback');
  assert.equal(button.title, 'Copied!');
  button.textContent = 'Copy';
  await Promise.resolve();
  assert.equal(button.dataset.iconAction, 'copy');
  dom.window.close();
});

test('includes the section edit action in its tooltip', async () => {
  const dom = new JSDOM(
    '<div class="dokuwiki"><div class="secedit"><button title="Example">Edit</button></div></div>',
    { runScripts: 'outside-only' },
  );
  dom.window.eval(script);
  await new Promise((resolve) =>
    dom.window.document.addEventListener('DOMContentLoaded', resolve),
  );
  assert.equal(
    dom.window.document.querySelector('button').title,
    'Edit: Example',
  );
  dom.window.close();
});

test('maps DokuWiki toolbar icons to locally bundled SVGs', () => {
  const css = readFileSync(
    new URL('../css/zenlike.css', import.meta.url),
    'utf8',
  );
  const expected = {
    'bold.png': 'bold.svg',
    'italic.png': 'italic.svg',
    'underline.png': 'underline.svg',
    'mono.png': 'code-xml.svg',
    'strike.png': 'strikethrough.svg',
    'hequal.png': 'heading.svg',
    'hminus.png': 'heading.svg',
    'hplus.png': 'heading.svg',
    'h.png': 'heading.svg',
    'h1.png': 'heading-1.svg',
    'h2.png': 'heading-2.svg',
    'h3.png': 'heading-3.svg',
    'h4.png': 'heading-4.svg',
    'h5.png': 'heading-5.svg',
    'link.png': 'link.svg',
    'linkextern.png': 'external-link.svg',
    'ol.png': 'list-ordered.svg',
    'ul.png': 'list.svg',
    'hr.png': 'minus.svg',
    'image.png': 'image.svg',
    'smiley.png': 'smile.svg',
    'chars.png': 'omega.svg',
    'sig.png': 'signature.svg',
  };
  const actual = {};
  for (const rule of css.matchAll(
    /([^{}]+)\{\s*content:\s*url\('images\/toolbar\/([^']+\.svg)'\);\s*\}/g,
  )) {
    for (const selector of rule[1].matchAll(
      /img\[src\$='\/lib\/images\/toolbar\/([^']+)'\]/g,
    )) {
      actual[selector[1]] = rule[2];
    }
  }
  assert.deepEqual(actual, expected);
  for (const icon of new Set([
    ...Object.values(expected),
    'equal.svg',
    'plus.svg',
  ])) {
    assert.match(
      readFileSync(
        new URL(`../images/toolbar/${icon}`, import.meta.url),
        'utf8',
      ),
      /<svg\b/,
      icon,
    );
  }
});

function renderHeader(conf = {}) {
  const php = String.raw`
    class Item {
      public function __construct(private $type) {}
      public function getType() { return $this->type; }
      public function asHtmlLink($prefix) { return '<a href="#' . $this->type . '">' . $this->type . '</a>'; }
    }
    $conf = ['title' => 'Wiki', 'tagline' => '', 'breadcrumbs' => false, 'youarehere' => false];
    $lang = ['tools' => 'Tools', 'btn_search' => 'Search', 'skip_to_content' => 'Skip'];
    $options = json_decode($argv[2], true) + ['menuid' => 'menu'];
    function tpl_getConf($key) { global $options; return $options[$key] ?? ''; }
    function tpl_getLang($key) { return ['main_navigation' => 'Menu', 'appearance' => 'Appearance', 'theme_system' => 'System', 'theme_light' => 'Light', 'theme_dark' => 'Dark'][$key] ?? ''; }
    function _tpl_header_picture() { echo '<div id="headerpic"></div>'; }
    function _tpl_tool_menus() {
      return [
        ['id' => 'dokuwiki__pagetools', 'label' => 'Page Tools', 'items' => [new Item('edit'), new Item('revert')]],
        ['id' => 'zenlike__sitetools', 'label' => 'Site Tools', 'items' => [new Item('recent')]],
      ];
    }
    function hsc($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
    function tpl_searchform() { echo '<form id="dw__search"></form>'; }
    function tpl_include_page($id) { echo '<ul><li><a href="#custom">Custom navigation</a></li></ul>'; }
    include $argv[1];
  `;
  return execFileSync(
    'php',
    [
      '-r',
      php,
      new URL('../header.html', import.meta.url).pathname,
      JSON.stringify(conf),
    ],
    { encoding: 'utf8' },
  );
}

test('renders navigation, tools and theme options in their final locations', () => {
  const html = renderHeader();
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const header = document.getElementById('zenlikeheader');
  const toggle = document.getElementById('toggle_sitemenu');
  const tools = document.getElementById('zenlike__tools');

  assert.equal(toggle.hasAttribute('hidden'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(toggle.getAttribute('aria-controls'), 'zenlike__menucontent');
  assert.deepEqual(
    [...toggle.querySelectorAll('.a11y')].map((label) => label.textContent),
    ['Menu', 'Tools'],
  );
  assert.equal(
    header.querySelector('#header-tools > #search > form').id,
    'dw__search',
  );
  assert.ok(header.querySelector('#menu #custommenu a[href="#custom"]'));
  assert.equal(tools.parentElement.id, 'zenlike__menucontent');
  assert.deepEqual(
    [...tools.querySelectorAll('nav')].map((nav) => [
      nav.id,
      nav.getAttribute('aria-label'),
      [...nav.querySelectorAll('li')].map((item) => item.className),
    ]),
    [
      ['dokuwiki__pagetools', 'Page Tools', ['action edit', 'action revert']],
      ['zenlike__sitetools', 'Site Tools', ['action recent']],
    ],
  );
  assert.deepEqual(
    [...document.querySelectorAll('select')].map((select) => [
      select.id,
      [...select.options].map(({ value, textContent }) => [
        value,
        textContent.trim(),
      ]),
    ]),
    [
      [
        'zenlike-theme',
        [
          ['system', 'System'],
          ['light', 'Light'],
          ['dark', 'Dark'],
        ],
      ],
    ],
  );
  assert.equal(document.querySelector('[hidden]'), null);
  dom.window.close();
});

function headerPicture(conf) {
  const php = String.raw`
    define('DOKU_INC', '/');
    function tpl_getConf($key) { global $options; return $options[$key] ?? ''; }
    function hsc($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
    $options = json_decode($argv[2], true);
    require $argv[1];
    _tpl_header_picture();
  `;
  const html = execFileSync(
    'php',
    [
      '-r',
      php,
      new URL('../tpl_functions.php', import.meta.url).pathname,
      JSON.stringify({ showHeaderPicture: '1', ...conf }),
    ],
    { encoding: 'utf8' },
  );
  return new JSDOM(html).window.document.getElementById('headerpic');
}

test('renders the header picture only when it is enabled', () => {
  assert.equal(headerPicture({ showHeaderPicture: '0' }), null);
  assert.equal(headerPicture({ showHeaderPicture: '' }), null);
  assert.ok(headerPicture());
});

test('uses the bundled header picture unless a URL is configured', () => {
  assert.equal(headerPicture().hasAttribute('style'), false);
  assert.equal(
    headerPicture({ headerPicture: '  \n' }).hasAttribute('style'),
    false,
  );
  assert.equal(
    headerPicture({
      headerPicture: ' https://example.com/header.jpg ',
    }).getAttribute('style'),
    'background-image: url("https://example.com/header.jpg")',
  );
});

test('keeps a configured header picture URL inside its CSS string', () => {
  assert.equal(
    headerPicture({
      headerPicture: 'x");background:red;}body{y:url("',
    }).getAttribute('style'),
    'background-image: url("x\\");background:red;}body{y:url(\\"")',
  );
  assert.equal(
    headerPicture({ headerPicture: 'a\\b\nc.jpg' }).getAttribute('style'),
    'background-image: url("a\\\\bc.jpg")',
  );
});

function toolMenus({
  id = 'wiki:welcome',
  user = '',
  hideTools = false,
  useacl = true,
} = {}) {
  const php = String.raw`
    namespace dokuwiki\Menu\Item {
      abstract class AbstractItem {
        public const CTX_ALL = 3;
        protected $type = '';
        protected $id = '';
        protected $params = [];
        protected $label = '';
        protected $svg = '';
        protected $nofollow = true;
        public function __construct() { global $ID; $this->id = $ID; $this->params['do'] = $this->type; }
        public function getType() { return $this->type; }
        public function describe() { return [$this->type, $this->id, $this->label, basename($this->svg), $this->params, $this->nofollow]; }
      }
      class Core extends AbstractItem {
        public function __construct($type, public $context) { $this->type = $type; }
      }
    }
    namespace dokuwiki\Menu {
      use dokuwiki\Menu\Item\Core;
      class PageMenu { public function __construct(private $context) {} public function getItems() { return [new Core('edit', $this->context), new Core('top', $this->context)]; } }
      class SiteMenu { public function __construct(private $context) {} public function getItems() { return [new Core('recent', $this->context)]; } }
      class UserMenu { public function __construct(private $context) {} public function getItems() { return [new Core('login', $this->context)]; } }
    }
    namespace dokuwiki\File {
      class PageResolver {
        public function __construct($context) {}
        public function resolveId($id) { return str_ends_with($id, ':') ? $id . 'start' : $id; }
      }
    }
    namespace {
      define('DOKU_INC', '/doku/');
      [$file, $options] = [$argv[1], json_decode($argv[2], true)];
      $ID = $options['id'];
      $conf = ['useacl' => $options['useacl']];
      $lang = ['page_tools' => 'Page Tools', 'site_tools' => 'Site Tools', 'user_tools' => 'User Tools'];
      if ($options['user']) $_SERVER['REMOTE_USER'] = $options['user'];
      function tpl_getConf($key) {
        global $options;
        return ['discussionPage' => 'discussion:@ID@', 'userPage' => 'user:@USER@:', 'hideTools' => $options['hideTools']][$key];
      }
      function tpl_getLang($key) { return 'lang:' . $key; }
      require $file;
      $menus = [];
      foreach (_tpl_tool_menus() as $menu) {
        $menus[$menu['id']] = [$menu['label'], array_map(fn($item) => $item->describe(), $menu['items'])];
      }
      echo json_encode($menus);
    }
  `;
  return JSON.parse(
    execFileSync(
      'php',
      [
        '-r',
        php,
        new URL('../tpl_functions.php', import.meta.url).pathname,
        JSON.stringify({ id, user, hideTools, useacl }),
      ],
      { encoding: 'utf8' },
    ),
  );
}

test('collects page, site and user tools with discussion and user page links', () => {
  const discussion = [
    'discussion',
    'discussion:wiki:welcome',
    'lang:discussion',
    'discussion.svg',
    [],
    false,
  ];

  assert.deepEqual(toolMenus(), {
    dokuwiki__pagetools: [
      'Page Tools',
      [['edit', '', '', '', [], true], discussion],
    ],
    zenlike__sitetools: ['Site Tools', [['recent', '', '', '', [], true]]],
    zenlike__usertools: ['User Tools', [['login', '', '', '', [], true]]],
  });
  assert.deepEqual(toolMenus({ user: 'demo' }).zenlike__usertools[1], [
    ['login', '', '', '', [], true],
    ['userpage', 'user:demo:start', 'lang:userpage', 'user.svg', [], false],
  ]);
  assert.deepEqual(
    toolMenus({ id: 'discussion:wiki:welcome' }).dokuwiki__pagetools[1][1],
    [
      'discussion',
      'wiki:welcome',
      'lang:back_to_article',
      '12-back_arrow-left.svg',
      [],
      false,
    ],
  );
  assert.deepEqual(Object.keys(toolMenus({ hideTools: true })), [
    'zenlike__sitetools',
  ]);
  assert.deepEqual(Object.keys(toolMenus({ hideTools: true, user: 'demo' })), [
    'dokuwiki__pagetools',
    'zenlike__sitetools',
    'zenlike__usertools',
  ]);
  assert.deepEqual(Object.keys(toolMenus({ useacl: false })), [
    'dokuwiki__pagetools',
    'zenlike__sitetools',
  ]);
});

test('versions only the DokuWiki JavaScript bundle with the template script hash', () => {
  const php = String.raw`
    define('DOKU_INC', '/');
    define('DOKU_BASE', '/wiki/');
    class Handler {
      public $callback;
      public function register_hook($event, $phase, $object, $callback) { $this->callback = $callback; }
    }
    $EVENT_HANDLER = new Handler();
    function tpl_metaheaders() {
      global $EVENT_HANDLER;
      $event = (object) ['data' => ['script' => [
        ['src' => '/wiki/lib/exe/js.php?t=zenlikeng&tseed=123'],
        ['src' => '/wiki/lib/exe/jquery.php?tseed=123'],
        ['_data' => 'inline']
      ]]];
      ($EVENT_HANDLER->callback)($event);
      echo json_encode($event->data['script']);
    }
    require $argv[1];
    _tpl_metaheaders();
  `;
  const result = JSON.parse(
    execFileSync(
      'php',
      ['-r', php, new URL('../tpl_functions.php', import.meta.url).pathname],
      { encoding: 'utf8' },
    ),
  );
  const version = createHash('sha256').update(script).digest('hex');
  assert.equal(
    result[0].src,
    `/wiki/lib/exe/js.php?t=zenlikeng&tseed=123&zenlike=${version}`,
  );
  assert.equal(result[1].src, '/wiki/lib/exe/jquery.php?tseed=123');
  assert.equal(result[2]._data, 'inline');
});

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
      <header id="zenlikeheader">
        <div class="headings">
          <button id="toggle_sitemenu" aria-controls="zenlike__menucontent" aria-expanded="false"></button>
          <div id="header-tools"><div id="search"><form><input class="edit" placeholder="Search"><button type="submit">Search</button></form></div></div>
        </div>
        <div id="menu">
          <div id="zenlike__menucontent">
            <nav id="zenlike__navigation"><a href="#page">Page</a></nav>
            <div id="zenlike__tools">
              <nav id="dokuwiki__pagetools"><ul><li class="action edit"><a href="#edit">Edit this page</a></li></ul></nav>
              <nav id="zenlike__sitetools"><ul><li class="action recent"><a href="#recent">Recent Changes</a></li></ul></nav>
              <div class="zenlike-appearance"><label for="zenlike-theme">Appearance</label><select id="zenlike-theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div>
            </div>
          </div>
        </div>
      </header>
      <button id="toggle_sidebar" aria-controls="dokuwiki__aside" aria-expanded="false">Sidebar</button>
      <nav id="dokuwiki__aside"><a href="#sidebar">Sidebar link</a></nav>
      <main id="dokuwiki__content"><div class="page"></div><nav id="zenlike__back-to-top" hidden><ul><li class="action top"><a href="#dokuwiki__top">Back to top</a></li></ul></nav></main>
      <div class="diffoptions">
        <form>
          <select name="difftype">
            <option value="sidebyside" ${initialDiffMode === 'sidebyside' ? 'selected' : ''}>Side by Side</option>
            <option value="inline" ${initialDiffMode === 'inline' ? 'selected' : ''}>Inline</option>
          </select>
          <button type="submit">Go</button>
        </form>
      </div>
    </body></html>`,
    { runScripts: 'outside-only', url: pageUrl },
  );
  const { document } = dom.window;
  const initialMarkup = document.body.innerHTML;
  let contentHeight = 0;
  const resizeObservers = [];
  Object.defineProperty(
    document.querySelector('#dokuwiki__content .page'),
    'offsetHeight',
    {
      get: () => contentHeight,
    },
  );
  dom.window.ResizeObserver = class {
    constructor(callback) {
      resizeObservers.push(callback);
    }
    observe() {}
  };
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
    initialMarkup,
    getDiffSubmissions: () => diffSubmissions,
    setContentHeight(height) {
      contentHeight = height;
      for (const callback of resizeObservers) callback();
    },
    setViewportHeight(height) {
      dom.window.innerHeight = height;
      dom.window.dispatchEvent(new dom.window.Event('resize'));
    },
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

test('shows back to top only for content over two viewport heights', async () => {
  const { document, dom, setContentHeight, setViewportHeight } =
    await createPage();
  const backToTop = document.getElementById('zenlike__back-to-top');
  setViewportHeight(800);
  setContentHeight(1600);
  assert.equal(backToTop.hidden, true);
  setContentHeight(1601);
  assert.equal(backToTop.hidden, false);
  setViewportHeight(900);
  assert.equal(backToTop.hidden, true);
  setContentHeight(2000);
  assert.equal(backToTop.hidden, false);
  dom.window.close();
});

test('leaves the server-rendered markup unchanged on initialization', async () => {
  for (const mobile of [true, false]) {
    const { document, dom, initialMarkup } = await createPage(mobile);
    assert.equal(document.body.innerHTML, initialMarkup);
    dom.window.close();
  }
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

test('toggles the sidebar state and collapses it on Escape on mobile', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_sidebar');
  const escape = () =>
    document.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Escape' }),
    );

  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');

  escape();
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, toggle);

  toggle.click();
  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  dom.window.close();
});

test('ignores Escape for the always visible desktop sidebar', async () => {
  const { document, dom } = await createPage(false);
  const toggle = document.getElementById('toggle_sidebar');
  toggle.setAttribute('aria-expanded', 'true');

  document.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Escape' }),
  );

  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  dom.window.close();
});

test('follows system appearance and stores explicit theme choices', async () => {
  const { document, dom, setSystemDark } = await createPage(false, true);
  const root = document.documentElement;
  const theme = document.getElementById('zenlike-theme');

  assert.equal(root.getAttribute('data-theme'), 'dark');
  assert.equal(theme.value, 'system');

  theme.value = 'light';
  theme.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(root.getAttribute('data-theme'), 'light');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'light');

  theme.value = 'dark';
  theme.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(root.getAttribute('data-theme'), 'dark');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'dark');

  theme.value = 'system';
  theme.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  setSystemDark(false);
  assert.equal(root.getAttribute('data-theme'), 'light');
  assert.equal(dom.window.localStorage.getItem('zenlike-theme'), 'system');

  dom.window.close();
});

test('restores a saved theme preference and ignores unknown values', async () => {
  const saved = await createPage(false, false, 'dark');
  assert.equal(saved.document.documentElement.dataset.theme, 'dark');
  assert.equal(saved.document.getElementById('zenlike-theme').value, 'dark');
  saved.dom.window.close();

  const unknown = await createPage(false, true, 'sepia');
  assert.equal(unknown.document.documentElement.dataset.theme, 'dark');
  assert.equal(
    unknown.document.getElementById('zenlike-theme').value,
    'system',
  );
  unknown.dom.window.close();
});

for (const mobile of [true, false]) {
  const viewport = mobile ? 'mobile' : 'desktop';

  test(`opens and closes the ${viewport} menu with synchronized state`, async () => {
    const { document, dom } = await createPage(mobile);
    const header = document.getElementById('zenlikeheader');
    const toggle = document.getElementById('toggle_sitemenu');

    toggle.click();
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(header.classList.contains('menu-open'), true);

    toggle.click();
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(header.classList.contains('menu-open'), false);
    dom.window.close();
  });

  test(`closes the ${viewport} menu on Escape and restores focus`, async () => {
    const { document, dom } = await createPage(mobile);
    const toggle = document.getElementById('toggle_sitemenu');
    toggle.click();
    document.getElementById('zenlike-theme').focus();

    document.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Escape' }),
    );

    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, toggle);
    dom.window.close();
  });

  test(`closes the ${viewport} menu after following a link`, async () => {
    const { document, dom } = await createPage(mobile);
    const toggle = document.getElementById('toggle_sitemenu');

    for (const selector of ['#zenlike__navigation a', '#zenlike__tools a']) {
      toggle.click();
      document.querySelector(selector).click();
      assert.equal(toggle.getAttribute('aria-expanded'), 'false', selector);
    }
    dom.window.close();
  });
}

test('closes the desktop dropdown on outside clicks only', async () => {
  const { document, dom } = await createPage(false);
  const toggle = document.getElementById('toggle_sitemenu');

  toggle.click();
  document.getElementById('zenlike-theme').click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');

  document.getElementById('dokuwiki__content').click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  dom.window.close();
});

test('keeps the mobile menu open when the page below is clicked', async () => {
  const { document, dom } = await createPage();
  const toggle = document.getElementById('toggle_sitemenu');

  toggle.click();
  document.getElementById('dokuwiki__content').click();

  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  dom.window.close();
});

test('closes the menu when the viewport switches layouts', async () => {
  const { document, dom, setMobile } = await createPage();
  const header = document.getElementById('zenlikeheader');
  const toggle = document.getElementById('toggle_sitemenu');

  toggle.click();
  setMobile(false);

  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(header.classList.contains('menu-open'), false);
  dom.window.close();
});
