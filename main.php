<?php
/**
 * DokuWiki Starter Template
 *
 * @link     http://dokuwiki.org/template:starter
 * @author   Anika Henke <anika@selfthinker.org>
 * @license  GPL 2 (http://www.gnu.org/licenses/gpl.html)
 */

if (!defined('DOKU_INC')) die(); /* must be run from within DokuWiki */
@require_once(dirname(__FILE__).'/tpl_functions.php'); /* include hook for template functions */

$showTools = !tpl_getConf('hideTools') || ( tpl_getConf('hideTools') && !empty($_SERVER['REMOTE_USER']) );
$showSidebar = page_findnearest($conf['sidebar']) && ($ACT=='show');
?><!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="<?php echo $conf['lang'] ?>"
  lang="<?php echo $conf['lang'] ?>" dir="<?php echo $lang['direction'] ?>" class="no-js">
<head>
    <meta charset="UTF-8" />
    <title><?php tpl_pagetitle() ?> [<?php echo strip_tags($conf['title']) ?>]</title>
    <script>(function(H){H.className=H.className.replace(/\bno-js\b/,'js')})(document.documentElement)</script>
    <?php tpl_metaheaders() ?>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <?php echo tpl_favicon(array('favicon', 'mobile')) ?>
    <?php tpl_includeFile('meta.html') ?>
</head>

<body>
    <?php /* the "dokuwiki__top" id is needed somewhere at the top, because that's where the "back to top" button/link links to */ ?>
    <?php /* classes mode_<action> are added to make it possible to e.g. style a page differently if it's in edit mode,
         see http://www.dokuwiki.org/devel:action_modes for a list of action modes */ ?>
    <?php /* .dokuwiki should always be in one of the surrounding elements (e.g. plugins and templates depend on it) */ ?>
    <div id="dokuwiki__site"><div id="dokuwiki__top"
        class="dokuwiki site mode_<?php echo $ACT ?> <?php echo ($showSidebar) ? 'hasSidebar' : '' ?>">
        <?php html_msgarea() /* occasional error and info messages on top of the page */ ?>
        <?php tpl_includeFile('header.html') ?>

        <div class="wrapper">

            <!-- ********** ASIDE ********** -->
            <?php if ($showSidebar): ?>
                <div id="dokuwiki__aside"><div class="pad include">
                    <?php tpl_includeFile('sidebarheader.html') ?>
                    <?php tpl_include_page($conf['sidebar'], 1, 1) /* includes the nearest sidebar page */ ?>
                    <?php tpl_includeFile('sidebarfooter.html') ?>
                    <div class="clearer"></div>
                </div></div><!-- /aside -->
            <?php endif; ?>

            <!-- ********** CONTENT ********** -->
            <div id="dokuwiki__content"><div class="pad">
                <?php tpl_flush() /* flush the output buffer */ ?>
                <?php tpl_includeFile('pageheader.html') ?>

                <div class="page">
                    <!-- wikipage start -->
                    <?php tpl_content() /* the main content */ ?>
                    <!-- wikipage stop -->
                    <div class="clearer"></div>
                </div>

                <?php tpl_flush() ?>
                <?php tpl_includeFile('pagefooter.html') ?>
            </div></div><!-- /content -->

            <div class="clearer"></div>
            <hr class="a11y" />

            <!-- PAGE ACTIONS -->
            <?php if ($showTools): ?>
                <div id="dokuwiki__pagetools">
                    <h3 class="a11y"><?php echo $lang['page_tools'] ?></h3>
                    <ul>
                        <?php
                            echo (new \dokuwiki\Menu\PageMenu())->getListItems('action ');
                            _tpl_action('discussion', 1, 'li');
                        ?>
                    </ul>
                </div>
            <?php endif; ?>
        </div><!-- /wrapper -->

        <!-- ********** FOOTER ********** -->
        <div id="dokuwiki__footer"><div class="pad">
            <div class="doc"><?php tpl_pageinfo() /* 'Last modified' etc */ ?></div>
            <?php tpl_license('button') /* content license, parameters: img=*badge|button|0, imgonly=*0|1, return=*0|1 */ ?>
        </div></div><!-- /footer -->

        <?php tpl_includeFile('footer.html') ?>
    </div></div><!-- /site -->

    <div class="no"><?php tpl_indexerWebBug() /* provide DokuWiki housekeeping, required in all templates */ ?></div>
</body>
</html>
