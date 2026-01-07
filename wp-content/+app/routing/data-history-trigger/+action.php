<?php

namespace app\routing\data_history_trigger;

add_action('wp_footer', function () {
?>
	<script>
		// hydrate history trigger buttons
		(() => {
			if (
				!('navigation' in window) ||
				!window.navigation ||
				typeof window.navigation !== 'object' ||
				!('canGoBack' in window.navigation) ||
				!('canGoForward' in window.navigation)
			) return;

			const backHistoryTriggers =
				document.querySelectorAll('[data-history-trigger="back"]');
			const forwardHistoryTriggers =
				document.querySelectorAll('[data-history-trigger="forward"]');
			const {
				canGoBack,
				canGoForward
			} = window.navigation;
			for (const trigger of backHistoryTriggers)
				trigger.disabled = !canGoBack;
			for (const trigger of forwardHistoryTriggers)
				trigger.disabled = !canGoForward;
		})();
	</script>
<?php
});
