import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

const defaultStatus = {
  currentComponent: null,
  dirtyComponents: [],
};

export interface BlockerStatus {
  currentComponent: string | null;
  dirtyComponents: string[];
}

export const blockerStatusAtom = atom<BlockerStatus>(defaultStatus);

export function useNavigationBlocker(isDirty: boolean, identifier: string, callBack?: () => void) {
  const [, editBlockerStatus] = useAtom(blockerStatusAtom);

  useEffect(() => {
    return () => callBack?.();
  }, []);

  useEffect(() => {
    if (typeof isDirty === 'boolean') {
      editBlockerStatus((prev) => ({
        currentComponent: identifier,
        dirtyComponents: isDirty ? [...prev.dirtyComponents, identifier] : prev.dirtyComponents,
      }));
    }

    return () => {
      editBlockerStatus((prev) => ({
        ...defaultStatus,
        dirtyComponents: prev.dirtyComponents.filter((comp) => comp !== identifier),
      }));
    };
  }, [isDirty]);
}
