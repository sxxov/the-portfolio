import { pipeChunksIntoText } from './pipeChunksIntoText.js';

/** @returns {unknown} */
export function pipeChunksIntoJson(/** @type {Uint8Array[]} */ chunks) {
	try { return JSON.parse(pipeChunksIntoText(chunks)); } catch {}
}
