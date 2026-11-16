// TRPC api tests for SAP identifier requests and the finance office permission
import { expect } from '@playwright/test';
import { clearData, getAuditEvents, getMailEvents } from '@utils/db.js';
import { test } from '@utils/fixtures.js';
import { DEV_USER, TEST_USER, type UserSessionObject } from '@utils/users.js';

import type { User } from '@shared/schema/user.js';

import { testInvestmentProject, testProjectObject } from './projectObjectData.js';

// SAP mock: ids ending with _404 are not found, others are generated from the numeric part
const SAP_PROJECT_ID = 'A1111_11000';
const SAP_WBS_ID = 'A1111_110000';
const UNKNOWN_SAP_PROJECT_ID = 'A1111_404';

const projectRequest = (projectId: string) => ({
  projectId,
  responsiblePerson: DEV_USER,
  startDate: '2021-01-01',
  endDate: '2022-06-30',
  serviceClasses: ['4601', '4701'],
});

const projectObjectRequest = (projectId: string, projectObjectId: string) => ({
  projectId,
  projectObjectId,
  startDate: '2021-02-01',
  endDate: '2021-12-31',
  environmentalInvestmentReason: '414',
  responsiblePerson: DEV_USER,
  costCenterId: '111850',
  projectObjectClass: '10',
});

test.describe('SAP identifier requests', () => {
  test.afterAll(async ({ resetCachedSessions }) => {
    await resetCachedSessions();
    await clearData();
  });

  /** Investment project owned by DEV_USER, created by admin, with one project object. */
  async function createProjectWithObject(
    adminSession: Pick<UserSessionObject, 'client'>,
    devUser: User,
  ) {
    const project = await adminSession.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(devUser),
    });
    const projectObject = await adminSession.client.investmentProjectObject.upsert.mutate(
      testProjectObject(project.projectId, project.committees, devUser),
    );
    return { project, projectObjectId: projectObject.projectObjectId };
  }

  test('owner can request a SAP project id, others cannot', async ({
    adminSession,
    devSession,
    testSession,
  }) => {
    const { project } = await createProjectWithObject(adminSession, devSession.user);

    await expect(
      testSession.client.sapIdentifier.requestForProject.mutate(projectRequest(project.projectId)),
    ).rejects.toThrowError('error.insufficientPermissions');

    await devSession.client.sapIdentifier.requestForProject.mutate(
      projectRequest(project.projectId),
    );

    const status = await devSession.client.sapIdentifier.getStatus.query({
      projectId: project.projectId,
    });
    expect(status.identifier).toBeNull();
    expect(status.openRequest?.requestedBy.id).toBe(DEV_USER);

    // Dates are written to the project; responsible person is request-only
    const updated = await devSession.client.investmentProject.get.query({
      projectId: project.projectId,
    });
    expect(updated.endDate).toBe('2022-06-30');
    expect(updated.owner).toBe(DEV_USER);

    // Only one open request at a time
    await expect(
      devSession.client.sapIdentifier.requestForProject.mutate(projectRequest(project.projectId)),
    ).rejects.toThrowError('sapIdentifier.error.requestAlreadyOpen');

    const auditEvents = await getAuditEvents('sapIdentifier.requestProjectSapId');
    expect(auditEvents.some((event) => event.eventData.projectId === project.projectId)).toBe(true);

    // Mail is sent through the queue
    await expect
      .poll(async () => (await getMailEvents(project.projectId)).map((m) => m.templateName), {
        timeout: 15000,
      })
      .toContain('sap-code-request');
    const [mail] = await getMailEvents(project.projectId);
    expect(mail.html).toContain(`/talous/sap-tunnus/${project.projectId}`);
  });

  test('request runs the normal date validation', async ({ adminSession, devSession }) => {
    const { project } = await createProjectWithObject(adminSession, devSession.user);

    // Project object runs 2021-01-01 - 2022-01-01, so the project cannot end before that
    await expect(
      devSession.client.sapIdentifier.requestForProject.mutate({
        ...projectRequest(project.projectId),
        endDate: '2021-06-30',
      }),
    ).rejects.toThrowError('project.error.objectNotIncluded');
  });

  test('project object request requires the parent SAP project id', async ({
    adminSession,
    devSession,
  }) => {
    const { project, projectObjectId } = await createProjectWithObject(
      adminSession,
      devSession.user,
    );

    await expect(
      devSession.client.sapIdentifier.requestForProjectObject.mutate(
        projectObjectRequest(project.projectId, projectObjectId),
      ),
    ).rejects.toThrowError('sapIdentifier.error.parentProjectSapIdMissing');

    await adminSession.client.sapIdentifier.setIdentifier.mutate({
      projectId: project.projectId,
      identifier: SAP_PROJECT_ID,
    });

    await devSession.client.sapIdentifier.requestForProjectObject.mutate(
      projectObjectRequest(project.projectId, projectObjectId),
    );
    const status = await devSession.client.sapIdentifier.getStatus.query({
      projectId: project.projectId,
      projectObjectId,
    });
    expect(status.parentProjectSapId).toBe(SAP_PROJECT_ID);
    expect(status.openRequest).not.toBeNull();
  });

  test('only finance office can set identifiers', async ({
    adminSession,
    devSession,
    testSession,
    modifyPermissions,
  }) => {
    const { project, projectObjectId } = await createProjectWithObject(
      adminSession,
      devSession.user,
    );
    await devSession.client.sapIdentifier.requestForProject.mutate(
      projectRequest(project.projectId),
    );

    // Owner without the permission cannot set it through the finance endpoint
    await expect(
      devSession.client.sapIdentifier.setIdentifier.mutate({
        projectId: project.projectId,
        identifier: SAP_PROJECT_ID,
      }),
    ).rejects.toThrowError('error.insufficientPermissions');
    await expect(
      testSession.client.sapIdentifier.getFinanceView.query({ projectId: project.projectId }),
    ).rejects.toThrowError('error.insufficientPermissions');

    await modifyPermissions(TEST_USER, ['financeOffice.write']);

    const view = await testSession.client.sapIdentifier.getFinanceView.query({
      projectId: project.projectId,
    });
    expect(view.title).toBe('Test project');
    expect(view.openRequest).not.toBeNull();

    // Unknown id is saved with a warning
    const unknown = await testSession.client.sapIdentifier.setIdentifier.mutate({
      projectId: project.projectId,
      identifier: UNKNOWN_SAP_PROJECT_ID,
    });
    expect(unknown).toEqual({ identifier: UNKNOWN_SAP_PROJECT_ID, warning: 'sapProjectNotFound' });

    const known = await testSession.client.sapIdentifier.setIdentifier.mutate({
      projectId: project.projectId,
      identifier: SAP_PROJECT_ID,
    });
    expect(known).toEqual({ identifier: SAP_PROJECT_ID, warning: null });

    // Setting the identifier completes the request
    const status = await testSession.client.sapIdentifier.getStatus.query({
      projectId: project.projectId,
    });
    expect(status).toMatchObject({ identifier: SAP_PROJECT_ID, openRequest: null });

    // WBS: found and not found
    const wbs = await testSession.client.sapIdentifier.setIdentifier.mutate({
      projectId: project.projectId,
      projectObjectId,
      identifier: SAP_WBS_ID,
    });
    expect(wbs.warning).toBeNull();
    const unknownWbs = await testSession.client.sapIdentifier.setIdentifier.mutate({
      projectId: project.projectId,
      projectObjectId,
      identifier: 'A1111_999999',
    });
    expect(unknownWbs.warning).toBe('sapWbsNotFound');

    // Project id cannot change while a WBS is selected
    await expect(
      testSession.client.sapIdentifier.setIdentifier.mutate({
        projectId: project.projectId,
        identifier: 'A1111_22000',
      }),
    ).rejects.toThrowError('project.error.existingProjectObjectWBS');

    const auditEvents = await getAuditEvents('sapIdentifier.setProjectSapId');
    expect(auditEvents.filter((e) => e.eventData.projectId === project.projectId)).toHaveLength(2);
  });

  test('finance office user cannot edit the project otherwise', async ({
    adminSession,
    devSession,
    testSession,
    modifyPermissions,
  }) => {
    const { project } = await createProjectWithObject(adminSession, devSession.user);
    await modifyPermissions(TEST_USER, ['financeOffice.write']);

    await expect(
      testSession.client.investmentProject.upsert.mutate({
        project: { ...testInvestmentProject(devSession.user), projectId: project.projectId },
      }),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('setting the id through the project form completes the request', async ({
    adminSession,
    devSession,
  }) => {
    const { project } = await createProjectWithObject(adminSession, devSession.user);
    await devSession.client.sapIdentifier.requestForProject.mutate(
      projectRequest(project.projectId),
    );

    const current = await devSession.client.investmentProject.get.query({
      projectId: project.projectId,
    });
    await devSession.client.investmentProject.upsert.mutate({
      project: { ...current, sapProjectId: SAP_PROJECT_ID },
    });

    const status = await devSession.client.sapIdentifier.getStatus.query({
      projectId: project.projectId,
    });
    expect(status).toMatchObject({ identifier: SAP_PROJECT_ID, openRequest: null });
  });
});
