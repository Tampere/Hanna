import { Account } from 'oidc-provider';

const accounts: Record<string, MockAccount> = {};

interface UserProfile {
  email: string;
  email_verified: boolean;
}

class MockAccount implements Account {
  accountId: string;
  profile: UserProfile;
  [key: string]: any;

  constructor(id: string, profile: UserProfile) {
    this.accountId = id;
    this.profile = profile;
    accounts[id] = this;
  }

  claims() {
    console.log(`Returning claims for ${this.accountId}`);
    if (this.profile) {
      return {
        sub: this.accountId,
        email: this.profile.email,
        email_verified: this.profile.email_verified,
      };
    } else {
      return {
        sub: this.accountId,
      };
    }
  }
}

export function createMockAccount(email: string) {
  const id = email;
  const profile = {
    email: email,
    email_verified: true,
  };
  return new MockAccount(id, profile);
}

export function findAccount(ctx: any, id: string) {
  console.log(`Looking for account for id: ${id}`);
  if (accounts[id]) {
    return accounts[id];
  }
}
