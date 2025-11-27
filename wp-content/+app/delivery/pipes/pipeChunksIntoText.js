import { pipeChunksIntoUint8Array } from './pipeChunksIntoUint8Array.js';

export function pipeChunksIntoText(/** @type {Uint8Array[]} */ chunks) {
	const buffer = pipeChunksIntoUint8Array(chunks);
	return new TextDecoder().decode(buffer);
}
