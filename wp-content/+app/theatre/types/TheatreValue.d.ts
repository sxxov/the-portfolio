import { type ISheetObject } from '@theatre/core';
import { type TheatreSchema } from './TheatreSchema.js';

export type TheatreValue<T extends TheatreSchema> = {
	[K in keyof T]: ISheetObject<Required<T>>['value'][K];
};
