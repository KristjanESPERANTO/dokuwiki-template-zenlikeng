<?php
/**
 * Template Functions
 *
 * This file provides template specific custom functions that are
 * not provided by the DokuWiki core. Helpers use an underscore prefix
 * to avoid conflicts with future core functions.
 */

// must be run from within DokuWiki
if (!defined('DOKU_INC')) die();

function _tpl_filter_menu_instructions($instructions, $canRead) {
    $result = [];
    $position = 0;
    while ($position < count($instructions)) {
        $type = $instructions[$position][0];
        if ($type === 'listu_open' || $type === 'listo_open') {
            $result = array_merge($result, _tpl_filter_menu_list($instructions, $position, $canRead));
        } elseif ($type === 'internallink' && !$canRead($instructions[$position][1][0])) {
            $position++;
        } else {
            $result[] = $instructions[$position++];
        }
    }
    return $result;
}

function _tpl_filter_menu_list($instructions, &$position, $canRead) {
    $open = $instructions[$position++];
    $closeType = $open[0] === 'listu_open' ? 'listu_close' : 'listo_close';
    $items = [];
    while ($position < count($instructions) && $instructions[$position][0] !== $closeType) {
        if ($instructions[$position][0] !== 'listitem_open') {
            $items[] = $instructions[$position++];
            continue;
        }
        $item = [$instructions[$position++]];
        $allowed = true;
        $hasLink = false;
        $hasChildren = false;
        $hasVisibleChildren = false;
        while ($position < count($instructions) && $instructions[$position][0] !== 'listitem_close') {
            $instruction = $instructions[$position];
            if ($instruction[0] === 'listu_open' || $instruction[0] === 'listo_open') {
                $hasChildren = true;
                $children = _tpl_filter_menu_list($instructions, $position, $canRead);
                $hasVisibleChildren = $hasVisibleChildren || (bool) $children;
                $item = array_merge($item, $children);
            } else {
                if ($instruction[0] === 'internallink') {
                    $hasLink = true;
                    $allowed = $allowed && $canRead($instruction[1][0]);
                } elseif (in_array($instruction[0], ['externallink', 'interwikilink', 'emaillink'], true)) {
                    $hasLink = true;
                }
                $item[] = $instruction;
                $position++;
            }
        }
        if ($position < count($instructions)) $item[] = $instructions[$position++];
        if ($allowed && (!$hasChildren || $hasVisibleChildren || $hasLink)) {
            $items = array_merge($items, $item);
        }
    }
    $close = $instructions[$position++] ?? null;
    if (!$items || !$close) return [];
    return array_merge([$open], $items, [$close]);
}

function _tpl_navigation() {
    global $ID, $TOC;

    $pageId = tpl_getConf('menuid');
    if (!$pageId || auth_quickaclcheck($pageId) < AUTH_READ) return;
    $file = wikiFN($pageId);
    if (!file_exists($file)) return;

    $oldId = $ID;
    $oldToc = $TOC;
    $ID = $pageId;
    try {
        $instructions = p_cached_instructions($file, false, $pageId);
        if (!$instructions) return;
        $resolver = new \dokuwiki\File\PageResolver($pageId);
        $instructions = _tpl_filter_menu_instructions($instructions, static function ($target) use ($resolver, $pageId) {
            $target = explode('?', $target, 2)[0];
            if ($target === '') $target = $pageId;
            $target = explode('#', $resolver->resolveId($target, '', true), 2)[0];
            return auth_quickaclcheck($target) >= AUTH_READ;
        });
        echo p_render('xhtml', $instructions, $info);
    } finally {
        $ID = $oldId;
        $TOC = $oldToc;
    }
}

function _tpl_metaheaders() {
    global $EVENT_HANDLER;

    $scriptVersion = hash_file('sha256', __DIR__ . '/script.js');
    $EVENT_HANDLER->register_hook('TPL_METAHEADER_OUTPUT', 'BEFORE', null, static function ($event) use ($scriptVersion) {
        foreach ($event->data['script'] as &$script) {
            if (isset($script['src']) && str_starts_with($script['src'], DOKU_BASE . 'lib/exe/js.php?')) {
                $script['src'] .= '&zenlike=' . $scriptVersion;
            }
        }
    });
    tpl_metaheaders();
}

/**
 * Print the inline script that sets the JS flag and the theme before first paint
 */
function _tpl_init_theme() {
    echo <<<'HTML'
<script>
    (function (root) {
        var theme;
        try { theme = localStorage.getItem('zenlike-theme'); } catch (e) {}
        root.className = root.className.replace(/\bno-js\b/, 'js');
        root.dataset.theme = theme === 'dark' ||
            (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
            ? 'dark' : 'light';
    })(document.documentElement);
</script>
HTML;
}

/**
 * Build a quoted CSS url() value from a configured URL, empty if there is none
 */
function _tpl_css_url($url) {
    $url = preg_replace('/[\x00-\x1f\x7f]/', '', trim((string) $url));
    return $url === '' ? '' : 'url("' . addcslashes($url, '\\"') . '")';
}

/**
 * Print the header picture element, using the configured picture URL if there is one
 */
function _tpl_header_picture() {
    if (!tpl_getConf('showHeaderPicture')) return;

    $image = _tpl_css_url(tpl_getConf('headerPicture'));
    $style = $image === '' ? '' : ' style="' . hsc('background-image: ' . $image) . '"';
    echo '<div id="headerpic"' . $style . '></div>';
}

/**
 * Return the html element attributes that select the background around the page
 *
 * The texture is the default and needs no attributes.
 */
function _tpl_page_background_attrs() {
    $mode = tpl_getConf('pageBackground');
    if ($mode === 'color') return ' data-page-bg="color"';

    $url = trim((string) tpl_getConf('pageBackgroundImage'));
    if ($mode !== 'image' || $url === '') return '';

    // A custom property resolves relative URLs against the stylesheet, not the page.
    if (!preg_match('~^(?:[a-z][a-z0-9+.-]*:|/)~i', $url)) $url = DOKU_BASE . $url;
    $size = tpl_getConf('pageBackgroundSize') === 'tile' ? ' data-page-size="tile"' : '';
    return ' data-page-bg="image"' . $size . ' style="' . hsc('--zenlike-page-image: ' . _tpl_css_url($url)) . '"';
}

/**
 * Collect the page, site and user tool menus shown in the tools panel
 *
 * @return array[] non-empty menus with their element id, label and items
 */
function _tpl_tool_menus() {
    global $conf, $lang, $ID;

    $context = \dokuwiki\Menu\Item\AbstractItem::CTX_ALL;
    $groups = [
        'page' => [],
        'site' => (new \dokuwiki\Menu\SiteMenu($context))->getItems(),
        'user' => [],
    ];
    if (!tpl_getConf('hideTools') || !empty($_SERVER['REMOTE_USER'])) {
        $groups['page'] = array_filter(
            (new \dokuwiki\Menu\PageMenu($context))->getItems(),
            static fn($item) => $item->getType() !== 'top'
        );
        $discussionPage = tpl_getConf('discussionPage');
        if ($discussionPage) {
            $discussionNs = str_replace('@ID@', '', $discussionPage);
            $groups['page'][] = strpos($ID, $discussionNs) !== false
                ? _tpl_page_item('discussion', str_replace($discussionNs, '', $ID), tpl_getLang('back_to_article'), DOKU_INC . 'lib/images/menu/12-back_arrow-left.svg')
                : _tpl_page_item('discussion', str_replace('@ID@', $ID, $discussionPage), tpl_getLang('discussion'), __DIR__ . '/images/discussion.svg');
        }
        if ($conf['useacl']) {
            $groups['user'] = (new \dokuwiki\Menu\UserMenu($context))->getItems();
            if (tpl_getConf('userPage') && !empty($_SERVER['REMOTE_USER'])) {
                $groups['user'][] = _tpl_page_item('userpage', str_replace('@USER@', $_SERVER['REMOTE_USER'], tpl_getConf('userPage')), tpl_getLang('userpage'), DOKU_INC . 'lib/images/interwiki/user.svg');
            }
        }
    }

    $menus = [];
    foreach (array_filter($groups) as $group => $items) {
        $menus[] = [
            // DokuWiki's scripts find page actions by this ID.
            'id' => $group === 'page' ? 'dokuwiki__pagetools' : "zenlike__{$group}tools",
            'label' => $lang[$group . '_tools'],
            'items' => array_values($items),
        ];
    }
    return $menus;
}

/**
 * Create a menu item linking to a wiki page, rendered like DokuWiki's own items
 */
function _tpl_page_item($type, $pageId, $label, $svg) {
    global $ID;

    $pageId = (new \dokuwiki\File\PageResolver($ID))->resolveId($pageId);
    return new class ($type, $pageId, $label, $svg) extends \dokuwiki\Menu\Item\AbstractItem {
        public function __construct($type, $pageId, $label, $svg) {
            $this->type = $type;
            parent::__construct();
            $this->id = $pageId;
            $this->params = [];
            $this->label = $label;
            $this->svg = $svg;
            $this->nofollow = false;
        }
    };
}
