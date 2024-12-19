import { Add } from '@mui/icons-material';
import { Box, Chip, Skeleton, css } from '@mui/material';
import { SetStateAction } from 'jotai';
import diff from 'microdiff';

import { trpc } from '@frontend/client';
import { MultiFunctionChip } from '@frontend/components/MultiFunctionChip';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { FilterType, UserSavedSearchFilter } from '@shared/schema/userSavedSearchFilters';

type Props<T extends FilterType> = {
  filterType: T;
  selectedFilters: UserSavedSearchFilter[T];
  handleFilterSelect: (filters?: UserSavedSearchFilter[T] | null) => void;
  selectedSavedFilterState: { id: string | null; isEditing: boolean };
  setSelectedSavedFilterState: React.Dispatch<
    SetStateAction<{ id: string | null; isEditing: boolean }>
  >;
};

export function SavedSearchFilters<T extends FilterType>({
  filterType,
  selectedFilters,
  handleFilterSelect,
  selectedSavedFilterState,
  setSelectedSavedFilterState,
}: Props<T>) {
  const notify = useNotifications();
  const tr = useTranslations();

  const savedFilters = trpc.user.getSavedSearchFilters.useQuery({ filterType });

  function filterNameIsValid(filterName: string) {
    return savedFilters.data?.every((filter) => filter.filterName !== filterName.trim()) ?? true;
  }

  const saveFiltersMutation = trpc.user.upsertSavedSearchFilters.useMutation({
    onSuccess: () => {
      notify({ title: tr('savedSearchFilters.filterSaved'), severity: 'success', duration: 5000 });
      savedFilters.refetch();
    },
    onError: () => {
      notify({
        title: tr('savedSearchFilters.filterSaveFailed'),
        severity: 'error',
        duration: 5000,
      });
    },
  });
  const deleteFiltersMutation = trpc.user.deleteSavedSearchFilter.useMutation({
    onSuccess: () => {
      notify({ title: tr('savedSearchFilters.filterDelete'), severity: 'success', duration: 5000 });
      savedFilters.refetch();
    },
    onError: () => {
      notify({
        title: tr('savedSearchFilters.filterDeleteFailed'),
        severity: 'error',
        duration: 5000,
      });
    },
  });

  const canCreateNewFilter = selectedSavedFilterState.id !== 'new';

  function filterIsChanged(filter: UserSavedSearchFilter) {
    if (filter.filterId !== selectedSavedFilterState.id) return true;
    return diff(filter?.[filterType] ?? {}, selectedFilters ?? {}).length === 0;
  }

  return (
    <Box
      css={css`
        ::-webkit-scrollbar {
          height: 5px;
          background-color: #e4e4e4;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #c4c4c4;
          border-radius: 2.5px;
        }
        padding-bottom: 16px;
        margin-right: auto;
        overflow-x: auto;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: flex 0.3s linear;
      `}
    >
      {savedFilters.isLoading ? (
        <Skeleton>
          <Chip
            css={css`
              width: 120px;
              height: 30px;
              border-radius: 15px;
            `}
          />
        </Skeleton>
      ) : (
        savedFilters.data?.map((filter) => (
          <MultiFunctionChip
            isValidInput={filterNameIsValid}
            isEditing={
              selectedSavedFilterState.id === filter.filterId && selectedSavedFilterState.isEditing
            }
            setIsEditing={(isEditing) =>
              isEditing
                ? setSelectedSavedFilterState((prev) => ({ ...prev, isEditing: true }))
                : setSelectedSavedFilterState((prev) => ({ ...prev, isEditing: false }))
            }
            onCancel={() => {
              setSelectedSavedFilterState({ id: null, isEditing: false });
              handleFilterSelect(null);
            }}
            handleChipClick={() => {
              if (selectedSavedFilterState.id !== filter.filterId) {
                handleFilterSelect(filter[filterType]);
                setSelectedSavedFilterState({ id: filter.filterId, isEditing: false });
              } else {
                handleFilterSelect(null);
                setSelectedSavedFilterState({ id: null, isEditing: false });
              }
            }}
            isSelected={filter.filterId === selectedSavedFilterState.id}
            enabledEditFunctions={['delete', 'refresh', 'rename']}
            onDelete={() => {
              deleteFiltersMutation.mutate({ filterId: filter.filterId });
            }}
            isValid={filterIsChanged(filter)}
            key={filter.filterId}
            textContent={filter.filterName}
            onInputSave={(newInput) => {
              saveFiltersMutation.mutate({
                filterId: filter.filterId,
                filterName: newInput,
                [filterType]: selectedFilters,
              });
              setSelectedSavedFilterState((prev) => ({ ...prev, isEditing: false }));
            }}
          />
        ))
      )}

      {selectedSavedFilterState.id === 'new' && (
        <Box
          css={css`
            display: flex;
          `}
        >
          <MultiFunctionChip
            isValidInput={filterNameIsValid}
            isEditing={selectedSavedFilterState.isEditing}
            setIsEditing={(isEditing) =>
              isEditing
                ? setSelectedSavedFilterState((prev) => ({ ...prev, isEditing: true }))
                : setSelectedSavedFilterState((prev) => ({ ...prev, isEditing: false }))
            }
            isSelected={true}
            onDelete={() => setSelectedSavedFilterState({ id: null, isEditing: false })}
            enabledEditFunctions={['delete']}
            onCancel={() => setSelectedSavedFilterState({ id: null, isEditing: false })}
            onInputSave={(newInput) => {
              saveFiltersMutation.mutate({
                filterName: newInput,
                [filterType]: selectedFilters,
              });
              setSelectedSavedFilterState({ id: null, isEditing: false });
            }}
          />
        </Box>
      )}

      {canCreateNewFilter && (
        <Chip
          css={css`
            font-size: 12px;
            height: 30px;
            background-color: white;
            border: 1px solid #c4c4c4;
            @keyframes appear {
              0% {
                opacity: 0;
              }
              50% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }
            animation: appear 0.5s ease-out;
          `}
          onClick={() => {
            setSelectedSavedFilterState({ id: 'new', isEditing: true });
          }}
          size="small"
          icon={<Add color="primary" />}
          label={tr('savedSearchFilters.new')}
        />
      )}
    </Box>
  );
}
