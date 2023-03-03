import EmailTemplate from 'email-templates';
import { createTransport } from 'nodemailer';
import SMTPPool from 'nodemailer/lib/smtp-pool';
import { resolve } from 'path';

import { env } from '@backend/env';

interface Template<Name extends string, Parameters extends Record<string, any>> {
  template: {
    name: Name;
    parameters: Parameters;
  };
}

export type Mail = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
} & Template<
  'new-detail-plan-project',
  {
    planNumber: number;
    projectName: string;
    author: string;
    zone: string;
    lotNumber: string;
    addresses: string;
    signatureFrom: string;
  }
>;

const transport = createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.secure,
  pool: true,
  maxConnections: env.email.maxConnections,
  tls: {
    ciphers: 'SSLv3',
  },
  auth:
    env.email.auth.method === 'oauth'
      ? {
          clientId: env.email.auth.clientId,
          clientSecret: env.email.auth.clientSecret,
          refreshToken: env.email.auth.refreshToken,
        }
      : env.email.auth.method === 'login'
      ? {
          username: env.email.auth.username,
          password: env.email.auth.password,
        }
      : {},
} as SMTPPool.Options);

export async function sendMail(mail: Mail) {
  const email = new EmailTemplate({
    views: {
      root: resolve(__dirname, '../../..', 'email-templates'),
    },
    message: {
      from: `${env.email.senderName} <${env.email.senderAddress}>`,
    },
    transport,
    send: true,
  });

  await email.send({
    template: mail.template.name,
    message: {
      to: mail.to,
      cc: mail.cc,
      bcc: mail.bcc,
    },
    locals: mail.template.parameters,
  });
}
