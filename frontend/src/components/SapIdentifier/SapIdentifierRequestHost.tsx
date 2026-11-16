import { useAtom } from 'jotai';

import { pendingSapIdentifierRequestAtom } from '@frontend/stores/sapIdentifier';

import { SapIdentifierRequestDialog } from './SapIdentifierRequestDialog';

/** Opens the request dialog queued by a form's "Ilmoita samalla" checkbox. */
export function SapIdentifierRequestHost() {
  const [target, setTarget] = useAtom(pendingSapIdentifierRequestAtom);
  if (!target) return null;
  return <SapIdentifierRequestDialog open target={target} onClose={() => setTarget(null)} />;
}
