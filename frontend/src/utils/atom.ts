import { Atom, SetStateAction, WritableAtom, useAtomValue, useSetAtom } from 'jotai';

/**
 * Unwraps the given object of atoms into an object of current atom values.
 * @param obj Object of atoms
 * @returns Object of atom values
 */
export function unwrapAtomValues<Obj extends Record<string, unknown>>(obj: {
  [key in keyof Obj]: Atom<Obj[key]>;
}) {
  return Object.keys(obj).reduce(
    (previous, key) => ({ ...previous, [key]: useAtomValue(obj[key]) }),
    {} as { [key in keyof Obj]: Obj[key] }
  );
}

/**
 * Unwraps the given object of atoms into an object of atom value setter functions.
 * @param obj Object of atoms
 * @returns Object of atom setter functions
 */
export function unwrapAtomSetters<Obj extends Record<string, unknown>>(obj: {
  [key in keyof Obj]: WritableAtom<Obj[key], SetStateAction<Obj[key]>>;
}) {
  return Object.keys(obj).reduce(
    (previous, key) => ({ ...previous, [key]: useSetAtom(obj[key]) }),
    {} as { [key in keyof Obj]: (a: Obj[key]) => void }
  );
}
