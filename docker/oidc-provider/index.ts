import { Configuration, default as Provider } from 'oidc-provider';
import { createMockAccount, findAccount } from './accounts';
import users from './users.json' with { type: 'json' };

const config: Configuration = {
  clients: [
    {
      client_id: 'oidc_local_dev_client',
      client_secret: 'oidc_local_dev_secret',
      redirect_uris: [process.env.OIDC_REDIRECT_URI ?? 'https://localhost/api/v1/auth/callback'],
    },
  ],
  cookies: {
    keys: ['development_oidc_server_cookie_key'],
  },
  claims: {
    email: ['upn'],
    openid: ['sub'],
    profile: ['name'],
    roles: ['roles']
  },
  features: {
    devInteractions: { enabled: true },
  },
  findAccount: findAccount,
};

function loadUsers() {
  console.log(`Loaded ${users.length} users`);
  users.forEach(createMockAccount);
}

function run() {
  loadUsers();

  const port = process.env.OIDC_PORT ?? 9090;

  const oidc = new Provider(`http://localhost:${port}`, config);
  oidc.proxy = true;

  oidc.on('server_error', (ctx, err) => {
    console.error(err);
  });

  oidc.listen(port, () => {
    console.log(
      `oidc-provider listening on port ${port}, check http://localhost:${port}/.well-known/openid-configuration`
    );
  });
}

run();
