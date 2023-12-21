import { atom, useSetAtom } from 'jotai';
import { useBlocker } from 'react-router-dom';

type Blocker = ReturnType<typeof useBlocker>;

export const blockerAtom = atom<Blocker | null>(null);
const blockerSetterAtom = atom(null, (_get, set, blocker: Blocker) => {
  set(blockerAtom, blocker);
});

export function useNavigationBlocker(condition: boolean) {
  const setBlocker = useSetAtom(blockerSetterAtom);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return condition && currentLocation.pathname !== nextLocation.pathname;
  });

  setBlocker(blocker);
}
