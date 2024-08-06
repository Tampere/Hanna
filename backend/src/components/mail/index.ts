import EmailTemplate from 'email-templates';
import { SendMailOptions, createTransport } from 'nodemailer';
import SMTPPool from 'nodemailer/lib/smtp-pool';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { getPool, sql } from '@backend/db.js';
import { env } from '@backend/env.js';

import { DbDetailplanProject } from '@shared/schema/project/detailplan.js';
import { User } from '@shared/schema/user.js';
import { coerceArray } from '@shared/utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  'new-detailplan-project' | 'update-detailplan-project',
  DbDetailplanProject & {
    projectPageUrl: string;
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

function getTemplateLocals(mail: Pick<Mail, 'template'>) {
  return { ...mail.template.parameters, production: env.nodeEnv === 'production' };
}

export async function sendMail(mail: Mail, metadata?: { userId: User['id']; projectId?: string }) {
  const email = new EmailTemplate({
    preview: false,
    views: {
      root: resolve(__dirname, '../../..', 'email-templates'),
    },
    message: {
      from: `${env.email.senderName} <${env.email.senderAddress}>`,
    },
    transport,
    send: true,
  });

  const { originalMessage } = (await email.send({
    template: mail.template.name,
    message: {
      to: mail.to,
      cc: mail.cc,
      bcc: mail.bcc,
    },
    locals: getTemplateLocals(mail),
  })) as {
    originalMessage: SendMailOptions;
  };

  await addMailEvent({
    data: originalMessage,
    templateName: mail.template.name,
    projectId: metadata?.projectId,
    userId: metadata?.userId,
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

  return await email.renderAll(mail.template.name, getTemplateLocals(mail));
}

function addressesToStringArray(addresses: SendMailOptions['to']) {
  // Force addresses to string array - coerce into an array and transform Address objects into strings
  return coerceArray(addresses).map((address) =>
    typeof address === 'string' ? address : `${address.name} <${address.address}>`,
  );
}

async function addMailEvent(event: {
  data: SendMailOptions;
  templateName: string;
  userId?: User['id'];
  projectId?: string;
}) {
  await getPool().any(sql.untyped`
    INSERT INTO app.mail_event (sent_by, template_name, "to", cc, bcc, subject, html, project_id)
    VALUES (
      ${event.userId ?? null},
      ${event.templateName},
      ${sql.array(addressesToStringArray(event.data.to), 'text')},
      ${sql.array(addressesToStringArray(event.data.cc), 'text')},
      ${sql.array(addressesToStringArray(event.data.bcc), 'text')},
      ${event.data.subject ?? null},
      ${event.data.html?.toString() ?? null},
      ${event.projectId ?? null})
  `);
}
