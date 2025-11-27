import { type InterceptionPredicateFunction } from './InterceptionPredicateFunction.js';

export type InterceptionPredicate<
	O extends object,
	Keys extends string,
> = Partial<Record<Keys, InterceptionPredicateFunction<O>>>;
