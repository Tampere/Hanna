import axios from 'axios';
import https from 'https';
import path from 'path';
import { BasicAuthSecurity, Client, createClientAsync } from 'soap';

import { env } from '@backend/env';
import { logger } from '@backend/logging';

let client: Client | null = null;

export async function createWSClient() {
  logger.info('Initializing SAP Web Service client...');
  logger.info(`SAP endpoint: ${env.sapWebService.endpoint}`);

  client = await createClientAsync(path.join(__dirname, 'project_info.wsdl'), {
    request: axios.create({
      httpsAgent: new https.Agent({
        // FIXME: for poc test only until DNS resolves to correct address and name can be used with valid cert
        rejectUnauthorized: false,
      }),
    }),
  });
  client.setSecurity(
    new BasicAuthSecurity(env.sapWebService.basicAuthPass, env.sapWebService.basicAuthUser)
  );
  client.setEndpoint(env.sapWebService.endpoint);
  logger.info('SAP Web Service client initialized');
}

export function getClient() {
  if (client) {
    return client;
  } else {
    throw Error('SAP client is not initialized');
  }
}
