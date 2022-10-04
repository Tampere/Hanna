import { Issuer } from 'openid-client';

import { env } from './env';
import { logger } from './logging';

export async function getClient() {
  logger.info('Discovering OpenID Connect provider');
  const { Client } = await Issuer.discover(env.oidc.discovery_url);
  logger.info('Creating OpenID Connect client');
  return new Client({
    client_id: env.oidc.client_id,
    client_secret: env.oidc.client_secret,
    redirect_uris: [env.oidc.redirect_uri],
    token_endpoint_auth_method: 'client_secret_post',
    response_types: ['code'],
  });
}
