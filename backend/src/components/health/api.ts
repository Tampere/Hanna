/**
 * Format inspired by:
 * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check
 */
import axios from 'axios';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { sql } from 'slonik';
import { z } from 'zod';

import { getPool } from '@backend/db';
import { env } from '@backend/env';
import { logger } from '@backend/logging';

interface ComponentCheckResult {
  status: 'pass' | 'fail';
  time: Date;
}

async function checkDB(): Promise<ComponentCheckResult> {
  const checkTime = new Date();
  try {
    const pingResult = await getPool().oneFirst(sql.type(z.string())`SELECT 'pong'`);
    return {
      status: pingResult === 'pong' ? 'pass' : 'fail',
      time: checkTime,
    };
  } catch (error) {
    logger.error(error);
    return {
      status: 'fail',
      time: checkTime,
    };
  }
}

async function checkOIDC(): Promise<ComponentCheckResult> {
  const checkTime = new Date();
  try {
    const configUrl = `${env.oidc.discovery_url}/.well-known/openid-configuration`;
    const response = await axios.get(configUrl);
    return {
      status: response.status === 200 ? 'pass' : 'fail',
      time: checkTime,
    };
  } catch (error) {
    logger.error(error);
    return {
      status: 'fail',
      time: checkTime,
    };
  }
}

export default function (fastify: FastifyInstance, _opts: FastifyPluginOptions, done: () => void) {
  fastify.get('/health', async function (_request, reply) {
    const checks = {
      'appDatabase:ping': await checkDB(),
      'oidcProvider:ping': await checkOIDC(),
    };

    const allPassed = Object.values(checks).every((check) => check.status === 'pass');

    return reply.code(allPassed ? 200 : 500).send({
      status: allPassed ? 'pass' : 'fail',
      description: 'status of the service',
      checks,
    });
  });

  done();
}
