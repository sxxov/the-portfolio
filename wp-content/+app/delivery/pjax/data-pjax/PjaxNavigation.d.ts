import { type PjaxNavigationCause } from './PjaxNavigationCause.js';

export type PjaxNavigation = {
	from: string;
	to: string;
	document: Document;
	cause: PjaxNavigationCause;
};
