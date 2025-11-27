import { TheatreProjectBehavior } from '../data-theatre-project/TheatreProjectBehavior.js';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
import { TaskSignal } from '/+std/signal/TaskSignal.js';
import { val } from '@theatre/core';
/** @import { Values } from "/+std/type/object/Values.js" */
/** @import { ISheet, ISheetObject, types, UnknownShorthandCompoundProps } from "@theatre/core" */
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { Ranged } from "/+std/unit/Ranged.js" */

/**
 * @typedef {InstanceType<
 * 	(typeof TheatreSheetBehavior)['configurator']
 * >['attach']} TheatreSheetAttach
 */

export const TheatreSheetBehavior = behavior(
	'theatre-sheet',
	class {
		'' = t.string;
		sheet = new Signal(/** @type {ISheet | undefined} */ (undefined));
		props = new Signal(
			/** @type {Map<string, UnknownShorthandCompoundProps>} */ (
				new Map()
			),
		);
		objects = new Signal(
			/** @type {Map<string, ISheetObject>} */ (new Map()),
			({ update, trigger }) => {
				const attachedNames = new /** @type {typeof Set<string>} */ (
					Set
				)();

				return subscribe(
					{ props: this.props, sheet: this.sheet },
					({ $props, $sheet }) => {
						if (!$sheet) return;

						const propNames =
							new /** @type {typeof Set<string>} */ (Set)();
						for (const [name, value] of $props) {
							propNames.add(name);

							if (attachedNames.has(name)) continue;
							attachedNames.add(name);

							update((it) => {
								it.set(name, $sheet.object(name, value));
								trigger();
								return it;
							});
						}

						for (const attachedName of attachedNames) {
							if (propNames.has(attachedName)) continue;

							attachedNames.delete(attachedName);
							$sheet.detachObject(attachedName);
						}
					},
				);
			},
		);
		values = new TaskSignal(
			/** @type {Map<string, ReadableSignal<ISheetObject['value']>>} */ (
				new Map()
			),
		);

		seek = (/** @type {Ranged<0 | 1>} */ progress) => {
			const $sheet = this.sheet.get();
			if (!$sheet) return;

			$sheet.sequence.position =
				progress * val($sheet.sequence.pointer.length);
		};

		/** @template {UnknownShorthandCompoundProps} Props */
		attach = (/** @type {string} */ name, /** @type {Props} */ p) => {
			const { props, values } = this;
			const normalizedName = name
				.trim()
				.replace(/(?<=\S)\/(?=\S)/g, ' / ')
				.replace(/\/(?=\S)/g, '/ ')
				.replace(/(?<=\S)\//g, ' /');

			// mini hack part 1: add to props immediately instead of waiting
			// for the store "start" lifecycle below
			add: {
				props.update((it) => {
					it.set(normalizedName, p);
					props.trigger();
					return it;
				});
			}
			// add immediately but only remove on "stop" lifecycle below

			return new Signal(
				// mini hack part 2: in combination with the above `add:` block
				// this only works since `this.props` is synchronous!
				//
				// when `props` is added to, `objects` reconciles a
				// object for it from theatre immediately, which contains
				// the default/initial value
				//
				// this will be `undefined` if `sheet` is not yet available
				/** @type {ISheetObject<Props>['value'] | undefined} */ (
					this.objects.get().get(normalizedName)?.value
				),
				({ set }) => {
					const _ = bin();

					add: {
						props.update((it) => {
							it.set(normalizedName, p);
							props.trigger();
							return it;
						});
					}
					remove: _._ = () => {
						props.update((it) => {
							it.delete(normalizedName);
							props.trigger();
							return it;
						});
					};

					_._ = subscribe({ values }, ({ $values }) => {
						const value = $values.get(normalizedName);
						// console.log(normalizedName, value);
						if (!value) return;

						return subscribe({ value }, ({ $value }) => {
							set(
								/** @type {ISheetObject<Props>['value']} */ (
									$value
								),
							);
						});
					});

					return _;
				},
			).readonly;
		};
	},
	(element, { '': name, objects, values, sheet }, { getContext }) =>
		subscribe(
			{ project: getContext(TheatreProjectBehavior) },
			({ $project }) => {
				// console.log('project', $project);
				if (!$project) return;

				const { project } = $project;
				const _ = bin();

				sheet.in(
					derive({ project, name }, ({ $project, $name }) =>
						$name && $project ? $project.sheet($name) : undefined,
					),
				);

				_._ = subscribe(
					{ objects, values },
					({ $objects, $values }) => {
						// console.log('objects', $objects);
						// console.log('values', $values);
						for (const [name, object] of $objects) {
							let value = $values.get(name);
							if (!value) {
								value = new Signal(object.value, ({ set }) =>
									object.onValuesChange((next) => {
										set(next);
									}),
								);
								$values.set(name, value);
								values.trigger();
							}
						}
					},
				);

				return _;
			},
		),
);
