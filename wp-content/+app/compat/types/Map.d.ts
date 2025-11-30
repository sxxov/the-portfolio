interface MapConstructor {
	// eslint-disable-next-line @typescript-eslint/prefer-function-type
	new <E extends readonly [any, any]>(entries: E[]): Map<E[0], E[1]>;
}
