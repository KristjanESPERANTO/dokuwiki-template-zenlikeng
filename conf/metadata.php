<?php
/*
 * configuration metadata
 *
 */

$meta['discussionPage']      = array('string');
$meta['userPage']            = array('string');
$meta['hideTools']           = array('onoff');
$meta['menuid']              = array('string');
$meta['showHeaderPicture']   = array('onoff');
$meta['headerPicture']       = array('string');
$meta['pageBackground']      = array('multichoice', '_choices' => array('texture', 'color', 'image'));
$meta['pageBackgroundImage'] = array('string');
$meta['pageBackgroundSize']  = array('multichoice', '_choices' => array('fill', 'tile'));