<?php

namespace app\delivery\pjax\data_pjax;

add_action('body_class', function (array $classes) {
	echo ' data-pjax ';
	return $classes;
}, 10, 1);
