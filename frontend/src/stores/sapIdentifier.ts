import { atom } from 'jotai';

import type { SapIdentifierTarget } from '@shared/schema/sapIdentifierRequest';

/**
 * Target whose SAP identifier request dialog should open. Set by the forms'
 * "Ilmoita samalla talousjärjestelmään" checkbox after a successful save; the
 * dialog lives in Layout so it survives the navigation to a newly created item.
 */
export const pendingSapIdentifierRequestAtom = atom<SapIdentifierTarget | null>(null);
