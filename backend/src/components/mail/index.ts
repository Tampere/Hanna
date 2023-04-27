import EmailTemplate from 'email-templates';
import { createTransport } from 'nodemailer';
import SMTPPool from 'nodemailer/lib/smtp-pool';
import { resolve } from 'path';

import { env } from '@backend/env';

import { DbDetailplanProject } from '@shared/schema/project/detailplan';

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
  'new-detailplan-project',
  DbDetailplanProject & {
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
          type: 'OAuth2',
          user: env.email.senderAddress,
          clientId: env.email.auth.clientId,
          clientSecret: env.email.auth.clientSecret,
          refreshToken: env.email.auth.refreshToken,
          accessUrl: env.email.auth.accessUrl,
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

export async function previewMail(mail: Pick<Mail, 'template'>) {
  const email = new EmailTemplate({
    views: {
      root: resolve(__dirname, '../../..', 'email-templates'),
    },
    message: {
      from: `${env.email.senderName} <${env.email.senderAddress}>`,
    },
    transport,
    send: false,
  });

  return await email.renderAll(mail.template.name, mail.template.parameters);
}
