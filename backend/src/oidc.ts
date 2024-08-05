import { Issuer } from 'openid-client';

import { retry } from '@shared/utils';

import { env } from './env';
import { logger } from './logging';

export async function getClient() {
  logger.info('Discovering OpenID Connect provider');
  const { Client } = await retry(() => Issuer.discover(env.oidc.discovery_url), {
    retries: 10,
    timeout: 5000,
    retryDelay: 5000,
    onRetry: ({ delay, error }) => {
      logger.warn(`OIDC discovery failed, retrying in ${delay} ms. ${error}`);
    },
  });
  logger.info('Creating OpenID Connect client');
  return new Client({
    client_id: env.oidc.client_id,
    client_secret: env.oidc.client_secret,
    redirect_uris: [env.oidc.redirect_uri],
    token_endpoint_auth_method: 'client_secret_post',
    response_types: ['code'],
  });
}
