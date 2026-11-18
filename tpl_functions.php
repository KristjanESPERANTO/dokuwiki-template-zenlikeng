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
 * Print the header picture element, using the configured picture URL if there is one
 */
function _tpl_header_picture() {
    if (!tpl_getConf('showHeaderPicture')) return;

    $url = preg_replace('/[\x00-\x1f\x7f]/', '', trim((string) tpl_getConf('headerPicture')));
    $style = $url === ''
        ? ''
        : ' style="' . hsc('background-image: url("' . addcslashes($url, '\\"') . '")') . '"';
    echo '<div id="headerpic"' . $style . '></div>';
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
