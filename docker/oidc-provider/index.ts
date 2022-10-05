import { Configuration, Provider } from 'oidc-provider';
import { readFileSync } from 'fs';
import { createMockAccount, findAccount } from './accounts';

const config: Configuration = {
  clients: [
    {
      client_id: 'oidc_local_dev_client',
      client_secret: 'oidc_local_dev_secret',
      redirect_uris: ['https://localhost/api/v1/auth/callback'],
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

  const oidc = new Provider('http://localhost:9090', config);
  oidc.proxy = true;

  oidc.listen(9090, () => {
    console.log(
      'oidc-provider listening on port 9090, check http://localhost:9090/.well-known/openid-configuration'
    );
  });
}

run();
