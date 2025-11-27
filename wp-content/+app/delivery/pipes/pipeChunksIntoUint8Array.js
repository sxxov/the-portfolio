export function pipeChunksIntoUint8Array(/** @type {Uint8Array[]} */ chunks) {
	const buffer = new Uint8Array(
		chunks.reduce((len, chunk) => len + chunk.byteLength, 0),
	);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return buffer;
}
