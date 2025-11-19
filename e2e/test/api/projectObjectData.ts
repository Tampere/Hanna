import { User } from '@shared/schema/user.js';

type ObjectType = 'investment' | 'maintenance';

export const testInvestmentProject = (user: User) => ({
  projectName: 'Test project',
  description: 'Test description',
  owner: user.id,
  startDate: '2021-01-01',
  endDate: '2022-01-01',
  lifecycleState: '01',
  committees: ['01'],
  sapProjectId: null,
  coversMunicipality: false,
  target: '01',
  palmGrouping: '00',
});

export const testMaintenanceProject = (user: User) => ({
  projectName: 'Test project',
  description: 'Test description',
  owner: user.id,
  startDate: '2021-01-01',
  endDate: '2022-01-01',
  lifecycleState: '01',
  contract: 'contract n.1',
  decision: 'decision n.1',
  poNumber: '123456',
  committees: ['01'],
  sapProjectId: null,
  coversMunicipality: false,
});

export const testProjectObject = (
  projectId: string,
  projectCommittees: string[],
  user: User,
  type: ObjectType = 'investment',
) => ({
  projectId,
  description: 'Test description',
  objectName: 'Test project object',
  objectStage: '01',
  lifecycleState: '01',
  objectType: '01',
  objectCategory: ['01'],
  objectUsage: ['01'],
  committee: projectCommittees[0],
  suunnitteluttajaUser: user.id,
  rakennuttajaUser: user.id,
  startDate: '2021-01-01',
  endDate: '2022-01-01',
  sapWBSId: null,
  landownership: null,
  locationOnProperty: null,
  height: null,
  objectUserRoles: [],
  palmGrouping: '00',
});

export const testProjectObject2 = (
  projectId: string,
  projectCommittees: string[],
  user: User,
  type: ObjectType = 'investment',
) => ({
  projectId,
  description: 'Test description 2',
  objectName: 'Test project object 2',
  committee: projectCommittees[0],
  lifecycleState: '01',
  objectCategory: ['01'],
  objectUsage: ['01'],
  suunnitteluttajaUser: user.id,
  rakennuttajaUser: user.id,
  startDate: '2021-02-01',
  endDate: '2022-01-01',
  sapWBSId: null,
  objectUserRoles: [],
  ...(type === 'investment'
    ? {
        landownership: null,
        locationOnProperty: null,
        height: null,
        objectType: '01',
        objectStage: '01',
        palmGrouping: '00',
      }
    : { contract: 'contract n.1', procurementMethod: '01', poNumber: '123456' }),
});

export const testProjectObject3 = (
  projectId: string,
  projectCommittees: string[],
  user: User,
  type: ObjectType = 'investment',
) => ({
  projectId,
  description: 'Test description 3',
  objectName: 'Test project object 3',
  committee: projectCommittees[0],
  lifecycleState: '01',
  objectCategory: ['01'],
  objectUsage: ['01'],
  suunnitteluttajaUser: user.id,
  rakennuttajaUser: user.id,
  startDate: '2021-03-01',
  endDate: '2022-01-01',
  sapWBSId: null,
  objectUserRoles: [],
  palmGrouping: '00',
  ...(type === 'investment'
    ? {
        landownership: null,
        locationOnProperty: null,
        height: null,
        objectType: '01',
        objectStage: '01',
      }
    : { contract: 'contract n.1', procurementMethod: '01', poNumber: '123456' }),
});

export const invalidDateProjectObject = (
  projectId: string,
  projectCommittees: string[],
  user: User,
  type: ObjectType = 'investment',
) => ({
  projectId: projectId,
  description: 'Test description',
  objectName: 'Test project object',
  committee: projectCommittees[0],
  lifecycleState: '01',
  objectCategory: ['01'],
  objectUsage: ['01'],
  suunnitteluttajaUser: user.id,
  rakennuttajaUser: user.id,
  startDate: '2022-01-01',
  endDate: '2021-01-01',
  sapWBSId: null,
  objectUserRoles: [],
  ...(type === 'investment'
    ? {
        landownership: null,
        locationOnProperty: null,
        height: null,
        objectType: '01',
        objectStage: '01',
        palmGrouping: '00',
      }
    : { contract: 'contract n.1', procurementMethod: '01', poNumber: '123456' }),
});
