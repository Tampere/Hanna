import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { DbProject, ProjectRelation, Relation } from '@shared/schema/project';

import { RelationsContainer } from './RelationsContainer';

interface Props {
  project: DbProject;
}

export function ProjectRelations({ project }: Props) {
  const tr = useTranslations();
  const notify = useNotifications();

  const relations = trpc.project.getRelations.useQuery(
    { id: project?.id },
    { enabled: Boolean(project?.id), queryKey: ['project.getRelations', { id: project?.id }] }
  );

  /** It should probably be forbidden to add a second relation between this project and projects it is already related to */
  const currentlyRelatedProjects = [
    ...(relations.data?.relations.children?.map((child) => child.projectId) ?? []),
    ...(relations.data?.relations.parents?.map((parent) => parent.projectId) ?? []),
    ...(relations.data?.relations.related?.map((relative) => relative.projectId) ?? []),
  ];

  const relationsUpdate = trpc.project.updateRelations.useMutation({
    onSuccess: () => {
      relations.refetch();
      notify({
        severity: 'success',
        title: tr('projectRelations.notifyAddedRelation'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'success',
        title: tr('projectRelations.notifyAddedRelationFailure'),
        duration: 5000,
      });
    },
  });

  const deleteRelation = trpc.project.remoteRelation.useMutation({
    onSuccess: () => {
      relations.refetch();
      notify({
        severity: 'success',
        title: tr('projectRelations.relationRemoved'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'success',
        title: tr('projectRelations.relationRemovalFailed'),
        duration: 5000,
      });
    },
  });

  function addProjectRelation(
    relationType: Relation,
    subjectProjectId: string,
    objectProjectId: string
  ) {
    relationsUpdate.mutate({
      subjectProjectId: subjectProjectId,
      objectProjectId: objectProjectId,
      relation: relationType,
    });
  }

  function removeProjectRelation(
    relationType: Relation,
    subjectProjectId: string,
    objectProjectId: string
  ) {
    deleteRelation.mutate({
      subjectProjectId: subjectProjectId,
      objectProjectId: objectProjectId,
      relation: relationType,
    });
  }

  return (
    <div>
      {/* Parent relations*/}
      <RelationsContainer
        title={tr('projectRelations.parentRelations').toLocaleUpperCase()}
        addRelationText={tr('projectRelations.addParentRelation')}
        noRelationsText={tr('projectRelations.noParentRelations')}
        onRemoveProjectRelation={(relationType, objectProjectId) =>
          removeProjectRelation(relationType, project.id, objectProjectId)
        }
        onAddProjectRelation={(relationType, objectProjectId) =>
          addProjectRelation(relationType, project.id, objectProjectId)
        }
        relations={relations.data?.relations.parents as ProjectRelation[]}
        unrelatableProjectIds={[...currentlyRelatedProjects, project?.id]}
        relationType={'parent'}
      />
      {/* Child relations */}
      <RelationsContainer
        title={tr('projectRelations.childRelations').toLocaleUpperCase()}
        addRelationText={tr('projectRelations.addChildRelation')}
        noRelationsText={tr('projectRelations.noChildRelations')}
        onRemoveProjectRelation={(relationType, objectProjectId) =>
          removeProjectRelation(relationType, project.id, objectProjectId)
        }
        onAddProjectRelation={(relationType, objectProjectId) =>
          addProjectRelation(relationType, project.id, objectProjectId)
        }
        relations={relations.data?.relations.children as ProjectRelation[]}
        unrelatableProjectIds={[...currentlyRelatedProjects, project?.id]}
        relationType={'child'}
      />
      {/* Related relations */}
      <RelationsContainer
        title={tr('projectRelations.relatedRelations').toLocaleUpperCase()}
        addRelationText={tr('projectRelations.addRelatedRelation')}
        noRelationsText={tr('projectRelations.noRelatedRelations')}
        onRemoveProjectRelation={(relationType, objectProjectId) =>
          removeProjectRelation(relationType, project.id, objectProjectId)
        }
        onAddProjectRelation={(relationType, objectProjectId) =>
          addProjectRelation(relationType, project.id, objectProjectId)
        }
        relations={relations.data?.relations.related as ProjectRelation[]}
        unrelatableProjectIds={[...currentlyRelatedProjects, project?.id]}
        relationType={'related'}
      />
    </div>
  );
}
