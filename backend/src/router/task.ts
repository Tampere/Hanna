import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { codeIdFragment } from '@backend/components/code';
import { getPool, sql } from '@backend/db';
import { TRPC } from '@backend/router';
import { getPermissionContext as getPOPermissionCtx } from '@backend/router/projectObject';

import { nonEmptyString } from '@shared/schema/common';
import {
  BudgetUpdate,
  UpsertTask,
  dbTaskSchema,
  getTaskParams,
  taskIdSchema,
  updateBudgetSchema,
  upsertTaskSchema,
  yearBudgetSchema,
} from '@shared/schema/task';
import { User } from '@shared/schema/user';
import {
  ProjectAccessChecker,
  ProjectPermissionContext,
  hasWritePermission,
  isTaskIdInput,
  ownsProject,
  permissionContextSchema,
} from '@shared/schema/userPermissions';

const taskFragment = sql.fragment`
  SELECT
    project_object_id AS "projectObjectId",
    id AS "taskId",
    task_name AS "taskName",
    description AS "description",
    contractor_id AS "contractorId",
    (lifecycle_state).id AS "lifecycleState",
    (task_type).id AS "taskType",
    start_date AS "startDate",
    end_date AS "endDate"
  FROM app.task
  WHERE deleted = false
`;

async function upsertTask(task: UpsertTask, userId: User['id']) {
  const data = {
    project_object_id: task.projectObjectId,
    task_name: task.taskName,
    description: task.description,
    contractor_id: task.contractorId,
    lifecycle_state: codeIdFragment('TehtävänElinkaarentila', task.lifecycleState),
    task_type: codeIdFragment('TehtäväTyyppi', task.taskType),
    start_date: task.startDate,
    end_date: task.endDate,
    updated_by: userId,
  };

  const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
  const values = Object.values(data);

  return getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'task.upsert',
      eventData: task,
      eventUser: userId,
    });
    if (task.taskId) {
      return tx.one(sql.type(taskIdSchema)`
        UPDATE app.task
        SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
        WHERE id = ${task.taskId}
        RETURNING id AS "taskId"
      `);
    } else {
      return tx.one(sql.type(taskIdSchema)`
        INSERT INTO app.task (${sql.join(identifiers, sql.fragment`,`)})
        VALUES (${sql.join(values, sql.fragment`,`)})
        RETURNING id AS "taskId"
      `);
    }
  });
}

async function getTask(taskId: string) {
  return await getPool().one(sql.type(dbTaskSchema)`
    ${taskFragment}
    AND id = ${taskId}
  `);
}

async function deleteTask(taskId: string, userId: User['id']) {
  return getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'task.delete',
      eventData: { taskId },
      eventUser: userId,
    });
    const task = await tx.any(sql.untyped`
      UPDATE app.task
      SET
        deleted = true
      WHERE
        id = ${taskId}
    `);
    if (!task) {
      throw new TRPCError({
        code: 'NOT_FOUND',
      });
    }
    return task;
  });
}

async function getTaskBudget(taskId: string) {
  return getPool().any(sql.type(yearBudgetSchema)`
    SELECT
      "year",
      jsonb_build_object(
        'amount', amount
      ) AS "budgetItems"
    FROM app.budget
    WHERE task_id = ${taskId}
    ORDER BY year ASC
  `);
}

export async function updateTaskBudget(
  tx: DatabaseTransactionConnection,
  taskId: string,
  budgetItems: BudgetUpdate['budgetItems'],
  userId: User['id'],
) {
  await addAuditEvent(tx, {
    eventType: 'task.updateBudget',
    eventData: { taskId, budgetItems },
    eventUser: userId,
  });

  // Delete old entries
  await tx.any(sql.untyped`
    DELETE FROM app.budget
    WHERE task_id = ${taskId}
  `);

  // Insert new entries
  await Promise.all(
    budgetItems.map(async (item) => {
      await tx.any(sql.untyped`
        INSERT INTO app.budget (task_id, "year", amount)
        VALUES (${taskId}, ${item.year}, ${item.amount})
      `);
    }),
  );
}

/**
 * Permissions inherit from the project to the task.
 */
async function getPermissionContext(taskId: string): Promise<ProjectPermissionContext> {
  const permissionCtx = await getPool().maybeOne(sql.type(permissionContextSchema)`
    SELECT
      project.id AS id,
      "owner",
      coalesce(array_agg(project_permission.user_id) FILTER (WHERE can_write = true), '{}') AS "writeUsers"
    FROM app.project
    INNER JOIN app.project_object ON project.id = project_object.project_id
    INNER JOIN app.task ON project_object.id = task.project_object_id
    LEFT JOIN app.project_permission ON project.id = project_permission.project_id
    WHERE task.id = ${taskId}
    GROUP BY project.id, "owner"
  `);
  if (!permissionCtx) {
    throw new Error('Could not get permission context');
  }
  return permissionCtx;
}
/**
 * This function creates a middleware to check if a user has access to a project.
 * It takes two parameters: a TRPC instance and a function to check if a user has access to a project.
 * The function 'canAccess' should take a user and a permission context as parameters and return a boolean.
 * The middleware function returned by this function will throw a TRPCError with a 'BAD_REQUEST' code
 * if the input is not a project ID or if the user does not have access to the project.
 * If the user has access to the project, the middleware function will call the next middleware in the stack.
 *
 * @param {TRPC} t - The TRPC instance used to create the middleware.
 * @param {ProjectAccessChecker} canAccess - A function that checks if a user has access to a project.
 * @returns {Function} A middleware function that checks if a user has access to a project.
 */

export const createAccessMiddleware = (t: TRPC) => (canAccess: ProjectAccessChecker) =>
  t.middleware(async (opts) => {
    const { ctx, input, next } = opts;
    if (!isTaskIdInput(input)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.invalidInput',
      });
    }
    const permissionCtx = await getPermissionContext(input.taskId);
    if (!canAccess(ctx.user, permissionCtx)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.insufficientPermissions',
      });
    }
    return next();
  });

export const createTaskRouter = (t: TRPC) => {
  const withAccess = createAccessMiddleware(t);

  return t.router({
    get: t.procedure.input(getTaskParams).query(async ({ input }) => {
      return getTask(input.taskId);
    }),

    getByProjectObjectId: t.procedure
      .input(z.object({ projectObjectId: nonEmptyString }))
      .query(async ({ input }) => {
        return getPool().any(sql.type(dbTaskSchema)`
          ${taskFragment}
          AND project_object_id = ${input.projectObjectId}
        `);
      }),

    getBudget: t.procedure.input(taskIdSchema).query(async ({ input }) => {
      return await getTaskBudget(input.taskId);
    }),

    // Mutations requiring ownership / write permissions

    upsert: t.procedure.input(upsertTaskSchema).mutation(async ({ input, ctx }) => {
      let permissionCtx;
      if (!input.taskId && input.projectObjectId) {
        permissionCtx = await getPOPermissionCtx(input.projectObjectId);
      } else if (input.taskId) {
        permissionCtx = await getPermissionContext(input.taskId);
      } else {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.invalidInput' });
      }
      if (!hasWritePermission(ctx.user, permissionCtx) && !ownsProject(ctx.user, permissionCtx)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
      } else {
        return await upsertTask(input, ctx.user.id);
      }
    }),

    updateBudget: t.procedure
      .input(updateBudgetSchema.required())
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return await updateTaskBudget(tx, input.taskId, input.budgetItems, ctx.user.id);
        });
      }),

    delete: t.procedure
      .input(taskIdSchema)
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        return deleteTask(input.taskId, ctx.user.id);
      }),
  });
};
