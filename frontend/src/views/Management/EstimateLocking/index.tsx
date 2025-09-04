import { Autocomplete, Box, Button, Chip, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { filterAndValidateYears, lockedYearSchema } from '@shared/schema/lockedYears.js';

export function EstimateLocking() {
  const [newLockedYears, setNewLockedYears] = useState<number[]>([]);
  const [lockedYears, setLockedYears] = useState<number[]>([]);
  const [deletedYears, setDeletedYears] = useState<number[]>([]);

  const notify = useNotifications();
  const tr = useTranslations();
  const mutateLockedYears = trpc.lockedYears.setLockedYears.useMutation();
  const {
    data: initialLockedYearsData,
    isLoading,
    isError,
    refetch,
  } = trpc.lockedYears.get.useQuery();
  useEffect(() => {
    if (initialLockedYearsData) {
      setLockedYears(initialLockedYearsData);
    }
  }, [initialLockedYearsData]);

  const handleDeleteYear = (yearToDelete: number) => {
    setLockedYears(lockedYears.filter((year) => year !== yearToDelete));
    setDeletedYears([...deletedYears, yearToDelete]);
  };

  const handleCancelYear = (yearToCancel: number) => {
    setDeletedYears(deletedYears.filter((year) => year !== yearToCancel));
    setLockedYears([...lockedYears, yearToCancel]);
  };

  const handleYearChange = (_event: any, newValue: (string | number)[]) => {
    //const numericYears = newValue.map((year) => Number(year)).filter((year) => !isNaN(year));

    setNewLockedYears(filterAndValidateYears(newValue));
  };

  if (isLoading) {
    return <h1>Loading locked years...</h1>;
  }

  if (isError) {
    return <h1>Error loading locked years.</h1>;
  }
  return (
    <Box sx={{ maxWidth: 840, margin: '2em auto', width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        {tr('management.tabs.locking')}
      </Typography>
      <Autocomplete
        multiple
        id="tags-outlined"
        freeSolo={true}
        value={newLockedYears.sort((a, b) => b - a)}
        onChange={handleYearChange}
        options={Array.from({ length: 101 }, (_, i) => 2000 + i).filter(
          (year) => !lockedYears.includes(year) && !deletedYears.includes(year),
        )}
        getOptionLabel={(option) => option.toString()}
        filterSelectedOptions
        sx={{ width: '100%' }}
        renderInput={(params) => <TextField {...params} />}
      />
      {lockedYears.length + deletedYears.length > 0 && (
        <Box display="flex" rowGap={1} columnGap={1} flexWrap="wrap" marginTop={2}>
          {[
            ...lockedYears.map((year) => ({ status: 'locked', year: year })),
            ...deletedYears.map((year) => ({ status: 'deleted', year: year })),
          ]
            .sort((a, b) => a.year - b.year)
            .map(({ status, year }) => (
              <Chip
                key={year}
                label={year}
                color={status === 'deleted' ? 'error' : 'primary'}
                onDelete={status === 'locked' ? () => handleDeleteYear(year) : undefined}
                onClick={status === 'deleted' ? () => handleCancelYear(year) : undefined}
              />
            ))}
        </Box>
      )}
      {newLockedYears.length + deletedYears.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1em' }}>
          <Button
            onClick={async () => {
              setLockedYears([...lockedYears, ...deletedYears]);
              setDeletedYears([]);
              setNewLockedYears([]);
            }}
          >
            {tr('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              const parsed = filterAndValidateYears([...newLockedYears, ...lockedYears]);

              try {
                await mutateLockedYears.mutateAsync(parsed);
                setNewLockedYears([]);
                setDeletedYears([]);
                refetch();
                notify({
                  severity: 'success',
                  title: tr('EstimateLocking.saveSuccess'),
                  duration: 5000,
                });
              } catch (error) {
                notify({
                  severity: 'error',
                  title: tr('EstimateLocking.saveFailed'),
                  duration: 5000,
                });
              }
            }}
          >
            {tr('save')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
