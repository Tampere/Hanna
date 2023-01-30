import { TRPCError } from '@trpc/server';
import { nonEmptyString } from 'tre-hanna-shared/src/schema/common';
import { z } from 'zod';

import { getPool, sql } from '@backend/db';
import { TRPC } from '@backend/router';

import {
  UpsertTask,
  dbTaskSchema,
  getTaskParams,
  taskIdSchema,
  upsertTaskSchema,
} from '@shared/schema/task';

import { codeIdFragment } from './code';

const taskFragment = sql.fragment`
  SELECT
    project_object_id AS "projectObjectId",
    id,
    task_name AS "taskName",
    description AS "description",
    (lifecycle_state).id AS "lifecycleState",
    (task_type).id AS "taskType",
    start_date AS "startDate",
    end_date AS "endDate"
  FROM app.task
  WHERE deleted = false
`;

async function upsertTask(task: UpsertTask, userId: string) {
  const data = {
    project_object_id: task.projectObjectId,
    task_name: task.taskName,
    description: task.description,
    lifecycle_state: codeIdFragment('TehtävänElinkaarentila', task.lifecycleState),
    task_type: codeIdFragment('TehtäväTyyppi', task.taskType),
    start_date: task.startDate,
    end_date: task.endDate,
    updated_by: userId,
  };

  const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
  const values = Object.values(data);

  if (task.id) {
    return getPool().one(sql.type(taskIdSchema)`
      UPDATE app.task
      SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
      WHERE id = ${task.id}
      RETURNING id
    `);
  } else {
    return getPool().one(sql.type(taskIdSchema)`
    INSERT INTO app.task (${sql.join(identifiers, sql.fragment`,`)})
    VALUES (${sql.join(values, sql.fragment`,`)})
    RETURNING id
    `);
  }
}

async function getTask(id: string) {
  return await getPool().one(sql.type(dbTaskSchema)`
    ${taskFragment}
    AND id = ${id}
  `);
}

async function deleteTask(id: string) {
  const task = await getPool().any(sql.untyped`
    UPDATE app.task
    SET
      deleted = true
    WHERE
      id = ${id}
  `);
  if (!task) {
    throw new TRPCError({
      code: 'NOT_FOUND',
    });
  }
  return task;
}

export const createTaskRouter = (t: TRPC) =>
  t.router({
    upsert: t.procedure.input(upsertTaskSchema).mutation(async ({ input, ctx }) => {
      const result = await upsertTask(input, ctx.user.id);
      return getTask(result.id);
    }),

    get: t.procedure.input(getTaskParams).query(async ({ input }) => {
      return getTask(input.id);
    }),

    getByProjectObjectId: t.procedure
      .input(z.object({ projectObjectId: nonEmptyString }))
      .query(async ({ input }) => {
        return getPool().any(sql.type(dbTaskSchema)`
          ${taskFragment}
          AND project_object_id = ${input.projectObjectId}
        `);
      }),

    delete: t.procedure.input(taskIdSchema).mutation(async ({ input }) => {
      return deleteTask(input.id);
    }),
  });
