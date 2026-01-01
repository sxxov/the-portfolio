<?php

namespace app\tracking;

add_action('wp_head', function () {
?>
	<!-- Google tag (gtag.js) -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-HCCSQRMLE0"></script>
	<script>
		window.dataLayer = window.dataLayer || [];

		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());

		gtag('config', 'G-HCCSQRMLE0');
	</script>
<?php
}, 100);
