<?php

use function bare\utilities\url\get_uri;

add_action('wp_print_styles', function () {
?>
	<link rel="preload" href="<?= get_uri(__DIR__ . '/m.woff2') ?>" as="font" type="font/woff2" crossorigin>
	<link rel="stylesheet" href="<?= get_uri(__DIR__ . '/m.css') ?>">
<?php
});
