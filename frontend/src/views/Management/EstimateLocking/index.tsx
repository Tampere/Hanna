import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import GavelIcon from '@mui/icons-material/Gavel';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { filterAndValidateYears, lockedYearSchema } from '@shared/schema/lockedYears.js';

export function EstimateLocking() {
  const [yearToUnlock, setYearToUnlock] = useState<string>('');
  const [lockedYears, setLockedYears] = useState<number[]>([]);
  const [deletedYears, setDeletedYears] = useState<number[]>([]);
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  const notify = useNotifications();
  const tr = useTranslations();

  const {
    data: lockedDetailsData,
    isLoading: isLockedDetailsLoading,
    isError: isLockedDetailsError,
    refetch: refetchLockedDetails,
  } = trpc.lockedYears.getDetails.useQuery();

  const {
    data: unlockedYearsData,
    isLoading: isUnlockedYearsLoading,
    isError: isUnlockedYearsError,
    refetch: refetchOpenYears,
  } = trpc.lockedYears.getOpenYears.useQuery();

  const {
    data: initialLockedYearsData,
    isLoading: LockedYearsIsLoading,
    isError: LockedYearsIsError,
    refetch: LockedYearsRefetch,
  } = trpc.lockedYears.get.useQuery();

  const lockYearMutation = trpc.lockedYears.lockYear.useMutation({
    onSuccess: () => {
      LockedYearsRefetch();
      refetchLockedDetails();
      setShowLockConfirm(false);
      notify({
        severity: 'success',
        title: tr('management.tabs.lockYearSuccess'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('management.tabs.lockYearFailed'),
        duration: 5000,
      });
    },
  });

  const openYearMutation = trpc.lockedYears.openYear.useMutation({
    onSuccess: () => {
      LockedYearsRefetch();
      refetchOpenYears();
      setYearToUnlock('');
      notify({
        severity: 'success',
        title: tr('management.tabs.openYearSuccess'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('management.tabs.openYearFailed'),
        duration: 5000,
      });
    },
  });

  const closeYearMutation = trpc.lockedYears.closeYear.useMutation({
    onSuccess: () => {
      LockedYearsRefetch();
      refetchOpenYears();
      notify({
        severity: 'success',
        title: tr('management.tabs.closeYearSuccess'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('management.tabs.closeYearFailed'),
        duration: 5000,
      });
    },
  });
  useEffect(() => {
    if (initialLockedYearsData) {
      setLockedYears(initialLockedYearsData);
    }
  }, [initialLockedYearsData]);

  // Lockable year = first year (starting from schema min 2000) that has never been locked,
  // but no later than next calendar year.
  const lockedEverYears = new Set(lockedDetailsData?.map((d) => d.year) ?? []);
  const maxLockableYear = new Date().getFullYear() + 1;
  const lockableYear = (() => {
    let year = 2000;
    while (lockedEverYears.has(year) && year < maxLockableYear) year++;
    return year;
  })();

  if (LockedYearsIsLoading) {
    return <h1>Loading locked years...</h1>;
  }

  if (LockedYearsIsError) {
    return <h1>Error loading locked years.</h1>;
  }
  return (
    <Box sx={{ maxWidth: 840, margin: '2em auto', width: '100%' }}>
      <Typography variant="h3" gutterBottom>
        {tr('management.tabs.locking')}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {tr('management.tabs.EstimateLockingDescription')}
      </Typography>

      {lockedDetailsData?.some((d) => d.year === new Date().getFullYear()) && (
        <Typography variant="body1" gutterBottom marginTop={1}>
          {tr(
            'management.tabs.currentYearLockDescription',
            lockedDetailsData?.find((d) => d.year === new Date().getFullYear())?.lockedBy,
            lockedDetailsData
              ?.find((d) => d.year === new Date().getFullYear())
              ?.lockedAt?.toLocaleString('fi-FI', { dateStyle: 'short', timeStyle: 'short' }),
          )}
        </Typography>
      )}

      <Box sx={{ marginBottom: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            columnGap: 2,
            rowGap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button
            endIcon={<GavelIcon />}
            variant="contained"
            disabled={lockedYears.includes(lockableYear)}
            onClick={() => setShowLockConfirm(true)}
          >{`${tr('management.tabs.LockEstimatesForYear')} ${lockableYear}`}</Button>
          {lockedDetailsData?.some((d) => d.year === lockableYear) ? (
            // This message should be inline with button group
            <Typography variant="body1" component="span">
              {tr(
                'management.tabs.lockedYearDescription',
                lockableYear,
                lockedDetailsData?.find((d) => d.year === lockableYear)?.lockedBy,
                lockedDetailsData
                  ?.find((d) => d.year === lockableYear)
                  ?.lockedAt?.toLocaleString('fi-FI', { dateStyle: 'short', timeStyle: 'short' }),
              )}
            </Typography>
          ) : (
            <Typography variant="body1" component="span">
              {tr('management.tabs.nextYearNotLocked')}
            </Typography>
          )}
        </Box>
        <Dialog open={showLockConfirm} onClose={() => setShowLockConfirm(false)}>
          <DialogTitle>{tr('management.tabs.lockConfirmTitle', lockableYear)}</DialogTitle>
          <DialogContent>{tr('management.tabs.lockConfirmContent', lockableYear)}</DialogContent>
          <DialogActions>
            <Button onClick={() => setShowLockConfirm(false)}>{tr('cancel')}</Button>
            <Button
              variant="contained"
              onClick={() => lockYearMutation.mutate({ year: lockableYear })}
            >
              {tr('management.tabs.lockConfirmButton')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      <Typography variant="h4" gutterBottom marginTop={4}>
        {tr('management.tabs.EstimateUnlockingHeader')}
      </Typography>

      <Typography variant="body1" gutterBottom>
        {tr('management.tabs.EstimateUnlockingDescription')}
      </Typography>

      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            columnGap: 2,
            rowGap: 1,
            flexWrap: 'wrap',
            marginBottom: 2,
          }}
        >
          <FormControl size="small">
            <ButtonGroup>
              <Select
                id="year-select"
                value={yearToUnlock}
                onChange={(e) => setYearToUnlock(e.target.value)}
                displayEmpty
                sx={{ minWidth: 120 }}
              >
                {!yearToUnlock && (
                  <MenuItem value="">{tr('management.tabs.chooseYearsToUnlock')}</MenuItem>
                )}
                {[...lockedYears, ...deletedYears].map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
              <Button
                variant="contained"
                disabled={!yearToUnlock}
                onClick={() => openYearMutation.mutate({ year: Number(yearToUnlock) })}
              >
                {tr('management.tabs.unlock')}
              </Button>
            </ButtonGroup>
          </FormControl>
          {(!unlockedYearsData || unlockedYearsData.length === 0) && (
            // This message should be inline with button group
            <Typography variant="body1" color="success.main" component="span">
              {tr('management.tabs.noOpenYears')}
            </Typography>
          )}
          {unlockedYearsData && unlockedYearsData?.length > 0
            ? unlockedYearsData?.map((year) => (
                <Button
                  key={year}
                  variant="outlined"
                  color="success"
                  sx={{
                    marginLeft: 1,
                    '& .lock-closed': { display: 'none' },
                    '& .lock-open': { display: 'inline-flex' },
                    '&:hover': {
                      variant: 'contained',
                      backgroundColor: 'primary.main',
                      borderColor: 'primary.main',
                      color: 'white',
                      '& .lock-closed': { display: 'inline-flex' },
                      '& .lock-open': { display: 'none' },
                    },
                  }}
                  endIcon={
                    <>
                      <LockOpenIcon className="lock-open" />
                      <LockIcon className="lock-closed" />
                    </>
                  }
                  onClick={() => closeYearMutation.mutate({ year })}
                >
                  {year}
                </Button>
              ))
            : null}
        </Box>
      </Box>
    </Box>
  );
}
