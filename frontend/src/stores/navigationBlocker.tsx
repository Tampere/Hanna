import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

const defaultStatus = {
  currentComponent: null,
  dirtyComponents: [],
  updating: false,
};

export interface BlockerStatus {
  currentComponent: string | null;
  dirtyComponents: string[];
  updating: boolean;
}

export const blockerStatusAtom = atom<BlockerStatus>(defaultStatus);

export function useNavigationBlocker(
  isDirty: boolean,
  identifier: string,
  unmountCallBack?: () => void,
) {
  const [blockerStatus, setBlockerStatus] = useAtom(blockerStatusAtom);

  useEffect(() => {
    return () => unmountCallBack?.();
  }, []);

  useEffect(() => {
    if (typeof isDirty === 'boolean') {
      setBlockerStatus((prev) => ({
        currentComponent: identifier,
        dirtyComponents: isDirty ? [...prev.dirtyComponents, identifier] : prev.dirtyComponents,
        updating: true,
      }));
    }

    return () => {
      setBlockerStatus((prev) => ({
        ...defaultStatus,
        dirtyComponents: prev.dirtyComponents.filter((comp) => comp !== identifier),
      }));
    };
  }, [isDirty]);

  return {
    isBlocking: blockerStatus.dirtyComponents.includes(identifier) || blockerStatus.updating,
  };
}
