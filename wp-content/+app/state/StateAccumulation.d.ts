export type StateAccumulation<T extends StateAccumulationArgument[]> =
	StateAccumulator<T>;

type StateAccumulationArgument = {
	step: string;
	requisite?: any;
};

type StateAccumulationPass<PassRequisite> = {
	pass: PassRequisite extends Record<any, any> ?
		(requisite: PassRequisite) => void
	:	() => void;
};

type StateAccumulationResult<
	Step extends string,
	Pass extends boolean,
	PassRequisite,
	AccumulatedRequisite extends Record<string, any>,
> = {
	step: Step;
} & (boolean extends Pass ? Partial<StateAccumulationPass<PassRequisite>>
: true extends Pass ? StateAccumulationPass<PassRequisite>
: {}) &
	AccumulatedRequisite;

type StateAccumulator<
	T extends any[],
	AccumulatedRequisite extends Record<string, any> = {},
> =
	T extends (
		[infer Argument extends StateAccumulationArgument, ...infer Rest]
	) ?
		| StateAccumulationResult<
				Argument['step'],
				string extends Argument['step'] ? true | false
				: Rest extends [] ? false
				: true,
				string extends Argument['step'] ? any : Argument['requisite'],
				AccumulatedRequisite
		  >
		| StateAccumulator<Rest, AccumulatedRequisite & Argument['requisite']>
	:	never;
