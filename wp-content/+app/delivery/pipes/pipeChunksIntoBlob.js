export function pipeChunksIntoBlob(/** @type {Uint8Array[]} */ chunks) {
	return new Blob(/** @type {Uint8Array<ArrayBuffer>[]} */ (chunks));
}
