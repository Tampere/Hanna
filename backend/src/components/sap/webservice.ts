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

  const axiosClient = axios.create({
    transformRequest: [],
    httpsAgent: new https.Agent({
      // FIXME: for poc test only until DNS resolves to correct address and name can be used with valid cert
      rejectUnauthorized: false,
    }),
  });

  axiosClient.interceptors.request.use((request) => {
    logger.debug({
      requestData: request.data,
      requestPath: request.url,
      requestMethod: request.method,
    });
    return request;
  });

  axiosClient.interceptors.response.use((response) => {
    logger.debug({ responseData: response.data, responseStatus: response.status });
    return response;
  });

  client = await createClientAsync(path.join(process.cwd(), 'resources/project_info.wsdl'), {
    request: axiosClient,
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
