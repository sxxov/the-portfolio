export type GeneratorValue<T extends (...args: unknown[]) => Generator> =
	ReturnType<T> extends Generator<infer U> ? U : never;
