import { Configuration, Provider } from 'oidc-provider';
import { readFileSync } from 'fs';
import { createMockAccount, findAccount } from './accounts';

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
    email: ['email', 'email_verified'],
    openid: ['sub'],
  },
  features: {
    devInteractions: { enabled: true },
  },
  findAccount: findAccount,
};

function loadUsers() {
  console.log('Reading users from users.json');
  const userData = readFileSync('./users.json', 'utf8');
  const users = JSON.parse(userData);
  console.log(`Loaded ${users.length} users`);
  users.forEach((user: any) => {
    createMockAccount(user.email);
  });
}

function run() {
  loadUsers();

  const port = process.env.OIDC_PORT ?? 9090;

  const oidc = new Provider(`http://localhost:${port}`, config);
  oidc.proxy = true;

  oidc.listen(port, () => {
    console.log(
      `oidc-provider listening on port ${port}, check http://localhost:${port}/.well-known/openid-configuration`
    );
  });
}

run();
