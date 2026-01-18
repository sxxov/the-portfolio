import { PjaxBehavior } from './PjaxBehavior.js';
import { attachBehavior } from '/+std/behavioral/behavior.js';
import { isInEditor } from '/+std/wordpress/isInEditor.js';

if (!isInEditor()) attachBehavior(document.body, PjaxBehavior);
