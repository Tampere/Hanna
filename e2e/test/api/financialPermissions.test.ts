import { clearProjectPermissions } from '@utils/db.js';
import { expect } from 'playwright/test';
import { test } from 'utils/fixtures.js';

import { ProjectYearBudget } from '@shared/schema/project/index.js';
import { BudgetUpdate as ProjectBudgetUpdate } from '@shared/schema/project/index.js';
import {
  YearBudget as ObjectYearBudget,
  updateBudgetFinancialWriterSchema,
} from '@shared/schema/projectObject/base.js';
import { BudgetUpdate as ProjectObjectBudgetUpdate } from '@shared/schema/projectObject/base.js';

import {
  testInvestmentProject,
  testMaintenanceProject,
  testProjectObject,
} from './projectObjectData.js';

type BudgetFields = (
  | keyof ProjectYearBudget['budgetItems']
  | keyof ObjectYearBudget['budgetItems']
)[];

const allBudgetFields: BudgetFields = [
  'estimate',
  'contractPrice',
  'amount',
  'forecast',
  'kayttosuunnitelmanMuutos',
];

function getProjectBudgetUpdateInput(
  id: string,
  budgetFields: BudgetFields = allBudgetFields,
): ProjectBudgetUpdate {
  return {
    projectId: id,
    budgetItems: [
      budgetFields.reduce((budgetItems, field) => ({ ...budgetItems, [field]: 10000 }), {
        year: 2024,
      } as Record<BudgetFields[number] | 'year', number>),
    ],
  };
}

function getProjectObjectBudgetUpdateInput(
  id: string,
  budgetFields: BudgetFields = allBudgetFields,
): ProjectObjectBudgetUpdate {
  return {
    projectObjectId: id,
    budgetItems: [
      {
        year: 2024,
        ...budgetFields.reduce((budgetItems, field) => ({ ...budgetItems, [field]: 10000 }), {}),
      },
    ],
  };
}

test.describe('Modify investment project financials', () => {
  let investmentProject: Record<string, any>;
  test.beforeAll(async ({ adminSession }) => {
    investmentProject = await adminSession.session.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(adminSession.user),
    });
  });
  test('without permissions', async ({ testSession }) => {
    await expect(
      testSession.session.client.investmentProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(investmentProject.projectId, ['estimate']),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with investmentWrite permission', async ({ modifyPermissions, testSession }) => {
    await modifyPermissions(testSession.user.id, ['investmentProject.write']);

    await expect(
      testSession.session.client.investmentProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(investmentProject.projectId, ['estimate']),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('with maintenanceWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['maintenanceProject.write']);

    await expect(
      testSession.session.client.investmentProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(investmentProject.projectId, ['estimate']),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('with detailplanWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['detailplanProject.write']);

    await expect(
      testSession.session.client.investmentProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(investmentProject.projectId, ['estimate']),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with investmentFinancialWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['investmentFinancials.write']);

    await expect(
      testSession.session.client.investmentProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(investmentProject.projectId),
      ),
    ).rejects.toThrow(/unrecognized_keys/);
    await expect(
      testSession.session.client.investmentProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(investmentProject.projectId, ['estimate']),
      ),
    ).rejects.toThrow('error.insufficientPermissions');
  });
  test('with maintenanceFinancialWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['maintenanceFinancials.write']);

    await expect(
      testSession.session.client.investmentProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(investmentProject.projectId, ['estimate']),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('as an owner', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['investmentProject.write']);
    const testProject = await testSession.session.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(testSession.user),
    });
    expect(
      await testSession.session.client.investmentProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(testProject.projectId, ['estimate']),
      ),
    ).toBeUndefined();
  });
  test('as a writer', async ({ adminSession, testSession }) => {
    await adminSession.session.client.project.updatePermissions.mutate({
      projectId: investmentProject.projectId,
      permissions: [{ userId: testSession.user.id, canWrite: true }],
    });
    expect(
      await testSession.session.client.investmentProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(investmentProject.projectId, ['estimate']),
      ),
    ).toBeUndefined();
    await clearProjectPermissions();
  });
});

test.describe('Modify maintenance project financials', () => {
  let maintenanceProject: Record<string, any>;
  test.beforeAll(async ({ adminSession }) => {
    maintenanceProject = await adminSession.session.client.maintenanceProject.upsert.mutate({
      project: testMaintenanceProject(adminSession.user),
    });
  });
  test('without permissions', async ({ testSession }) => {
    await expect(
      testSession.session.client.maintenanceProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(maintenanceProject.projectId, ['estimate']),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with investmentWrite permission', async ({ modifyPermissions, testSession }) => {
    await modifyPermissions(testSession.user.id, ['investmentProject.write']);

    await expect(
      testSession.session.client.maintenanceProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(maintenanceProject.projectId, ['estimate']),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('with maintenanceWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['maintenanceProject.write']);

    await expect(
      testSession.session.client.maintenanceProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(maintenanceProject.projectId, ['estimate']),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('with detailplanWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['detailplanProject.write']);

    await expect(
      testSession.session.client.maintenanceProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(maintenanceProject.projectId, ['estimate']),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with maintenanceFinancialWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['maintenanceFinancials.write']);

    // Only estimate is allowed to be updated
    expect(
      testSession.session.client.maintenanceProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(maintenanceProject.projectId),
      ),
    ).rejects.toThrow(/unrecognized_keys/);

    await expect(
      testSession.session.client.maintenanceProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(maintenanceProject.projectId, ['estimate']),
      ),
    ).rejects.toThrow('error.insufficientPermissions');
  });
  test('with investmentFinancialsWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['investmentFinancials.write']);

    await expect(
      testSession.session.client.maintenanceProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(maintenanceProject.projectId, ['estimate']),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('as an owner', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['maintenanceProject.write']);
    const maintenanceProject = await testSession.session.client.maintenanceProject.upsert.mutate({
      project: testMaintenanceProject(testSession.user),
    });
    expect(
      await testSession.session.client.maintenanceProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(maintenanceProject.projectId, ['estimate']),
      ),
    ).toBeUndefined();
  });
  test('as a writer', async ({ adminSession, testSession }) => {
    await adminSession.session.client.project.updatePermissions.mutate({
      projectId: maintenanceProject.projectId,
      permissions: [{ userId: testSession.user.id, canWrite: true }],
    });
    expect(
      await testSession.session.client.maintenanceProject.updateBudget.mutate(
        getProjectBudgetUpdateInput(maintenanceProject.projectId, ['estimate']),
      ),
    ).toBeUndefined();
    await clearProjectPermissions();
  });
});

test.describe('Modify investment project object financials', () => {
  let investmentProject: Record<string, any>;
  let investmentProjectObject: Record<string, any>;
  test.beforeAll(async ({ adminSession }) => {
    investmentProject = await adminSession.session.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(adminSession.user),
    });

    investmentProjectObject =
      await adminSession.session.client.investmentProjectObject.upsert.mutate(
        testProjectObject(investmentProject.projectId, adminSession.user),
      );
  });
  test('without permissions', async ({ testSession }) => {
    await expect(
      testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(investmentProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with investmentWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['investmentProject.write']);
    await expect(
      testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(investmentProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with maintenanceWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['maintenanceProject.write']);
    await expect(
      testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(investmentProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with detailplanWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['detailplanProject.write']);
    await expect(
      testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(investmentProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with investmentFinancialWrite permission', async ({ modifyPermissions, testSession }) => {
    await modifyPermissions(testSession.user.id, ['investmentFinancials.write']);
    // Only amount and kayttoSuunnitelmanMuutos are allowed to be updated

    await expect(
      testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(investmentProjectObject.projectObjectId),
      ),
    ).rejects.toThrow('error.insufficientPermissions');

    expect(
      await testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(investmentProjectObject.projectObjectId, [
          'amount',
          'kayttosuunnitelmanMuutos',
        ]),
      ),
    ).toBeUndefined();
  });
  test('with maintenanceFinancialWrite permission', async ({ modifyPermissions, testSession }) => {
    await modifyPermissions(testSession.user.id, ['maintenanceFinancials.write']);
    // Only amount and kayttoSuunnitelmanMuutos are allowed to be updated

    await expect(
      testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(investmentProjectObject.projectObjectId),
      ),
    ).rejects.toThrow('error.insufficientPermissions');

    await expect(
      testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(investmentProjectObject.projectObjectId, [
          'amount',
          'kayttosuunnitelmanMuutos',
        ]),
      ),
    ).rejects.toThrow('error.insufficientPermissions');
  });
  test('as an owner', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['investmentProject.write']);
    const testProject = await testSession.session.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(testSession.user),
    });
    const testInvestmentProjectObject =
      await testSession.session.client.investmentProjectObject.upsert.mutate(
        testProjectObject(testProject.projectId, testSession.user),
      );

    await expect(
      testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(testInvestmentProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');

    expect(
      await testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(testInvestmentProjectObject.projectObjectId, [
          'estimate',
          'contractPrice',
          'forecast',
        ]),
      ),
    ).toBeUndefined();
  });
  test('as a writer', async ({ adminSession, testSession }) => {
    await adminSession.session.client.project.updatePermissions.mutate({
      projectId: investmentProject.projectId,
      permissions: [{ userId: testSession.user.id, canWrite: true }],
    });

    await expect(
      testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(investmentProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');

    expect(
      await testSession.session.client.investmentProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(investmentProjectObject.projectObjectId, [
          'estimate',
          'contractPrice',
          'forecast',
        ]),
      ),
    ).toBeUndefined();

    await clearProjectPermissions();
  });
});

test.describe('Modify maintenance project object financials', () => {
  let maintenanceProject: Record<string, any>;
  let maintenanceProjectObject: Record<string, any>;
  test.beforeAll(async ({ adminSession }) => {
    maintenanceProject = await adminSession.session.client.maintenanceProject.upsert.mutate({
      project: testMaintenanceProject(adminSession.user),
    });

    maintenanceProjectObject =
      await adminSession.session.client.maintenanceProjectObject.upsert.mutate(
        testProjectObject(maintenanceProject.projectId, adminSession.user),
      );
  });
  test('without permissions', async ({ testSession }) => {
    await expect(
      testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with investmentWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['investmentProject.write']);
    await expect(
      testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with maintenanceWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['maintenanceProject.write']);
    await expect(
      testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with detailplanWrite permission', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['detailplanProject.write']);
    await expect(
      testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');
  });
  test('with investmentFinancialWrite permission', async ({ modifyPermissions, testSession }) => {
    await modifyPermissions(testSession.user.id, ['investmentFinancials.write']);
    // Only amount and kayttoSuunnitelmanMuutos are allowed to be updated

    await expect(
      testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceProjectObject.projectObjectId),
      ),
    ).rejects.toThrow('error.insufficientPermissions');

    await expect(
      testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceProjectObject.projectObjectId, [
          'amount',
          'kayttosuunnitelmanMuutos',
        ]),
      ),
    ).rejects.toThrow('error.insufficientPermissions');
  });
  test('with maintenanceFinancialWrite permission', async ({ modifyPermissions, testSession }) => {
    await modifyPermissions(testSession.user.id, ['maintenanceFinancials.write']);
    // Only amount and kayttoSuunnitelmanMuutos are allowed to be updated

    await expect(
      testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceProjectObject.projectObjectId),
      ),
    ).rejects.toThrow('error.insufficientPermissions');

    expect(
      await testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceProjectObject.projectObjectId, [
          'amount',
          'kayttosuunnitelmanMuutos',
        ]),
      ),
    ).toBeUndefined();
  });
  test('as an owner', async ({ testSession, modifyPermissions }) => {
    await modifyPermissions(testSession.user.id, ['maintenanceProject.write']);
    const maintenanceTestProject =
      await testSession.session.client.maintenanceProject.upsert.mutate({
        project: testMaintenanceProject(testSession.user),
      });
    const maintenanceTestProjectObject =
      await testSession.session.client.maintenanceProjectObject.upsert.mutate(
        testProjectObject(maintenanceTestProject.projectId, testSession.user),
      );

    await expect(
      testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceTestProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');

    expect(
      await testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceTestProjectObject.projectObjectId, [
          'estimate',
          'contractPrice',
          'forecast',
        ]),
      ),
    ).toBeUndefined();
  });
  test('as a writer', async ({ adminSession, testSession }) => {
    await adminSession.session.client.project.updatePermissions.mutate({
      projectId: maintenanceProject.projectId,
      permissions: [{ userId: testSession.user.id, canWrite: true }],
    });

    await expect(
      testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceProjectObject.projectObjectId),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');

    expect(
      await testSession.session.client.maintenanceProjectObject.updateBudget.mutate(
        getProjectObjectBudgetUpdateInput(maintenanceProjectObject.projectObjectId, [
          'estimate',
          'contractPrice',
          'forecast',
        ]),
      ),
    ).toBeUndefined();

    await clearProjectPermissions();
  });
});

test.describe('Modify worktable financials', () => {
  let investmentProject: Record<string, any>;
  let investmentProjectObject: Record<string, any>;
  test.beforeAll(async ({ adminSession }) => {
    investmentProject = await adminSession.session.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(adminSession.user),
    });
    investmentProjectObject =
      await adminSession.session.client.investmentProjectObject.upsert.mutate(
        testProjectObject(investmentProject.projectId, adminSession.user),
      );
  });
  test('with investmentFinancialWrite permission', async ({ modifyPermissions, testSession }) => {
    await modifyPermissions(testSession.user.id, ['investmentFinancials.write']);

    await expect(
      testSession.session.client.workTable.update.mutate({
        [investmentProjectObject.projectObjectId]: {
          budgetYear: 2024,
          budget: 10000,
          actual: 10000,
          forecast: 10000,
          kayttosuunnitelmanMuutos: 10000,
        },
      }),
    ).rejects.toThrow('error.insufficientPermissions');

    expect(
      await testSession.session.client.workTable.update.mutate({
        [investmentProjectObject.projectObjectId]: {
          budgetYear: 2024,
          budget: 10000,
          kayttosuunnitelmanMuutos: 10000,
        },
      }),
    ).toHaveLength(1);
  });
  // TODO: Worktable update endpoint still allows project owner or writer to update all fields
});
