import { sql } from '@backend/db.js';

export const participantRoleCodeIds = sql.fragment`(('InvestointiKohdeKayttajaRooli', '01')::app.code_id, ('InvestointiKohdeKayttajaRooli', '02')::app.code_id)`;
