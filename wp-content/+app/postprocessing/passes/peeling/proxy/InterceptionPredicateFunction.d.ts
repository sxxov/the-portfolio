export type InterceptionPredicateFunction<O extends object> = (
	o: O,
	k: string | symbol,
	value: unknown,
	r: {},
) => boolean;
