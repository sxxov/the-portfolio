import { Effect } from 'postprocessing';
import asciiFrag from './shaders/ascii.frag.js';
import { unwrap } from '/+std/type/utilities/unwrap.js';
import { CanvasTexture, NearestFilter, Uniform, Vector2 } from 'three';

export class AsciiEffect extends Effect {
	static defaultCharSet = ' .:-=+*#%@';

	constructor(
		/**
		 * @type {{
		 * 	charSet?: Record<number, string> & { length: number };
		 * 	fontFamily?: string;
		 * 	fontSize?: number;
		 * 	fontColor?: string;
		 * 	gap?: number;
		 * 	quality?: number;
		 * }}
		 */ {
			charSet = AsciiEffect.defaultCharSet,
			fontFamily = 'monospace',
			fontSize = 16,
			fontColor = 'white',
			gap = 0.5,
			quality = 32,
		} = {},
	) {
		super(AsciiEffect.name, asciiFrag);

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d', {
			alpha: true,
			willReadFrequently: true,
		});
		if (!ctx)
			throw new Error(
				`Failed to create 2D canvas context for ${AsciiEffect.name}.`,
			);

		const font = `${fontSize * quality}px ${fontFamily}`;

		const gapSize = { width: gap * quality, height: gap * quality };

		// measure the last character to determine size
		ctx.font = font;
		const charSize = Array.from({ length: charSet.length }).reduce(
			(size, _, i) => {
				const char = unwrap(charSet[i]);
				const metric = ctx.measureText(char);

				return {
					width: Math.max(
						size.width,
						Math.ceil(
							metric.actualBoundingBoxLeft +
								metric.actualBoundingBoxRight,
						),
					),
					height: Math.max(
						size.height,
						Math.ceil(
							metric.actualBoundingBoxAscent +
								metric.actualBoundingBoxDescent,
						),
					),
				};
			},
			{ width: 0, height: 0 },
		);
		const charSpriteSize = {
			width: charSize.width + gapSize.width * 2,
			height: charSize.height + gapSize.height * 2,
		};
		const cellSize = {
			width: charSpriteSize.width / quality,
			height: charSpriteSize.height / quality,
		};

		// set canvas size to cell size
		[canvas.width, canvas.height] = [
			charSpriteSize.width,
			charSpriteSize.height,
		];

		const charSprites = Array.from({ length: charSet.length }, (_, i) => {
			const char = unwrap(charSet[i]);

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = fontColor;
			ctx.textBaseline = 'top';
			ctx.font = font;
			ctx.fillText(char, gapSize.width, gapSize.height);

			const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const texture = new CanvasTexture(data);
			texture.minFilter = NearestFilter;
			texture.magFilter = NearestFilter;

			return texture;
		});
		this.charSprites = charSprites;

		this.defines.set('charCount', `${charSet.length}`);
		this.defines.set(
			'colorBySpriteIndex(index, uv)',
			`${Array.from(
				{ length: charSet.length },
				(_, i) => `index == ${i} ? texture(charSprites[${i}], uv) :`,
			).join(' ')} vec4(0.)`,
		);
		this.uniforms.set('charSprites', new Uniform(charSprites));
		this.uniforms.set(
			'charSize',
			new Uniform(new Vector2(charSize.width, charSize.height)),
		);
		this.uniforms.set(
			'charSpriteSize',
			new Uniform(
				new Vector2(charSpriteSize.width, charSpriteSize.height),
			),
		);
		this.uniforms.set(
			'cellSize',
			new Uniform(new Vector2(cellSize.width, cellSize.height)),
		);
		this.uniforms.set('gap', new Uniform(gap));
	}
}
