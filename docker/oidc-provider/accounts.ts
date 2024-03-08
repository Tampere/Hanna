import { Account, AccountClaims } from 'oidc-provider';

const accounts: Record<string, MockAccount> = {};

interface UserProfile {
  name: string;
  upn: string;
  roles: string[];
}

type Claims = AccountClaims & UserProfile;

class MockAccount implements Account {
  accountId: string;
  profile: UserProfile;
  [key: string]: any;

  constructor(id: string, profile: UserProfile) {
    this.accountId = id;
    this.profile = profile;
    accounts[id] = this;
  }

  claims(): Claims {
    console.log(`Returning claims for ${this.accountId}, roles: ${this.profile.roles}`);
    return {
      sub: this.accountId,
      upn: this.profile.upn,
      name: this.profile.name,
      roles: this.profile.roles,
    };
  }
}

export function createMockAccount(claims: Claims) {
  const { sub: id, ...profile } = claims;
  return new MockAccount(id, profile);
}

export function findAccount(ctx: any, id: string) {
  console.log(`Looking for account for id: ${id}`);
  if (accounts[id]) {
    return accounts[id];
  } else {
    throw new Error(`Account with ID ${id} not found`);
  }
}
