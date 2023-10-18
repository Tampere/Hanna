import axios from 'axios';
import { sql } from 'slonik';

import { getPool } from '@backend/db';
import { env } from '@backend/env';
import { logger } from '@backend/logging';

const API_TIMEOUT_MS = 15000;
const BASE_URL = 'https://geodata.tampere.fi/geoserver/maankaytto/ows';
const LAYER_NAME = 'maankaytto:AK_KAAVATYOT_FULL_TABLE';

const WFS_PARAMS = {
  service: 'WFS',
  version: '1.0.0',
  request: 'GetFeature',
  outputFormat: 'application/json',
  srsName: 'EPSG:3067',
};

function authHeaders(username: string, password: string) {
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${auth}`;
}

async function getDetailPlanGeometries() {
  const wfsParams = { ...WFS_PARAMS, typeName: LAYER_NAME };
  const headers = { Authorization: authHeaders(env.geodata.username, env.geodata.password) };
  try {
    const resp = await axios.get(BASE_URL, { params: wfsParams, timeout: API_TIMEOUT_MS, headers });
    return resp.data;
  } catch (error) {
    logger.error('Failed to fetch detail plan geometries', { error });
    throw error;
  }
}

export async function updateDetailplanGeometries() {
  logger.info('Writing detail plan geometries to PostGIS...');
  const geometries = await getDetailPlanGeometries();
  logger.info(`Got ${geometries.features.length} features`);
  const pool = getPool();

  let numOfProjectUpdates = 0;
  await pool.transaction(async (connection) => {
    await connection.any(sql.unsafe`
      CREATE TEMPORARY TABLE IF NOT EXISTS detail_plan_geometries (
        id VARCHAR(255) PRIMARY KEY,
        geometry GEOMETRY
      );
    `);
    for (const feature of geometries.features) {
      const { id, geometry, properties } = feature;
      const geomDetailPlanId = properties['KAAVAN_NUMERO'];
      if (!geometry) {
        logger.warn(`Skipping feature without geometry: ${id}`);
        continue;
      }

      const res = await connection.query(sql.unsafe`
        UPDATE app.project
        SET geom = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 3067)
        FROM app.project_detailplan as pd
        WHERE pd.detailplan_id = ${geomDetailPlanId} AND pd.id = app.project.id
        RETURNING app.project.id;
      `);

      if (res.rowCount > 0) {
        numOfProjectUpdates += 1;
      }
    }
  });
  logger.info(`Updated ${numOfProjectUpdates} detailplan project geometries`);
}
