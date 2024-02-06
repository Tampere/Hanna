import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Add, AddCircle, Clear, Delete, Edit, Save, Undo } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useNotifications } from '@frontend/services/notification';
import { authAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { ProjectTypePath } from '@frontend/types';
import { getRequiredFields } from '@frontend/utils/form';
import { SapWBSSelect } from '@frontend/views/ProjectObject/SapWBSSelect';

import {
  UpsertProjectObject,
  newProjectObjectSchema,
  upsertProjectObjectSchema,
} from '@shared/schema/projectObject';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface Props {
  projectId: string;
  projectType: ProjectTypePath;
  projectObject?: UpsertProjectObject | null;
}

export function ProjectObjectOperativeForm(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!props.projectObject);
  const user = useAtomValue(authAtom);

  const readonlyProps = useMemo(() => {
    if (editing) {
      return {};
    }
    return {
      hiddenLabel: true,
      variant: 'filled',
      InputProps: { readOnly: true },
    } as const;
  }, [editing]);

  const form = useForm<UpsertProjectObject>({
    mode: 'all',
    resolver: zodResolver(
      upsertProjectObjectSchema.superRefine((val, ctx) => {
        if (val.startDate && val.endDate && dayjs(val.endDate) <= dayjs(val.startDate)) {
          ctx.addIssue({
            path: ['startDate'],
            code: z.ZodIssueCode.custom,
            message: tr('projectObject.error.endDateBeforeStartDate'),
          });
          ctx.addIssue({
            path: ['endDate'],
            code: z.ZodIssueCode.custom,
            message: tr('projectObject.error.endDateBeforeStartDate'),
          });
        }
      }),
    ),
    context: {
      requiredFields: getRequiredFields(newProjectObjectSchema),
    },
    defaultValues: props.projectObject ?? {
      projectId: props.projectId,
      objectName: '',
      description: '',
      startDate: '',
      endDate: '',
    },
  });

  useEffect(() => {
    if (props.projectObject) {
      form.reset(props.projectObject);
    }
  }, [props.projectObject]);

  useEffect(() => {
    const sub = form.watch((value, { name, type }) => {
      if (type === 'change' && (name === 'startDate' || name === 'endDate')) {
        form.trigger(['startDate', 'endDate']);
      }
    });
    return () => sub.unsubscribe();
  }, [form.watch]);

  const projectObjectUpsert = trpc.projectObject.upsert.useMutation({
    onSuccess: (data) => {
      // Navigate to new url if we are creating a new project
      if (!props.projectObject && data.id) {
        navigate(`/${props.projectType}/${data.projectId}/kohde/${data.id}`);
      } else {
        queryClient.invalidateQueries({
          queryKey: [['project', 'get'], { input: { id: data.id } }],
        });
        // invalidate projectobject query
        queryClient.invalidateQueries({
          queryKey: [['projectObject', 'get'], { input: { id: data.id } }],
        });

        setEditing(false);
        form.reset(data);
      }
      notify({
        severity: 'success',
        title: tr('newProjectObject.notifyUpsert'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('newProjectObject.notifyUpsertFailed'),
      });
    },
  });

  const onSubmit = (data: UpsertProjectObject) => projectObjectUpsert.mutate(data);

  const operativeTableStyle = css`
    margin-top: 1em;
    th {
      font-weight: bold;
    }
    tr:last-child > td {
      border-bottom-width: 0;
    }
  `;

  type Role = 'Suunnitteluttaja' | 'Rakennuttaja' | 'Tietoturvapäällikkö' | 'Turvallisuuspäällikkö';

  type Person = {
    forename: string;
    surname: string;
  };

  type Operative = {
    id: number;
    role: Role;
    person: Person;
    mandatory: boolean;
  };

  let data: Operative[] = [
    {
      id: 1,
      role: 'Suunnitteluttaja',
      person: { forename: 'Matti', surname: 'Pekkala' },
      mandatory: true,
    },
    {
      id: 2,
      role: 'Rakennuttaja',
      person: { forename: 'Miisa', surname: 'Mattila' },
      mandatory: true,
    },
    {
      id: 3,
      role: 'Turvallisuuspäällikkö',
      person: { forename: 'Tiina', surname: 'Turvallinen' },
      mandatory: false,
    },
    {
      id: 4,
      role: 'Tietoturvapäällikkö',
      person: { forename: 'Timi', surname: 'Turvallinen' },
      mandatory: false,
    },
  ];

  return (
    <>
      <SectionTitle title={tr('projectObject.operativeFormTitle')} />
      <TableContainer css={operativeTableStyle}>
        <Table size="small">
          <TableBody>
            {data.map((operative) => (
              <TableRow key={operative.id} hover>
                <TableCell component="th" scope="row">
                  {operative.role}:
                </TableCell>
                <TableCell>
                  {operative.person.surname}, {operative.person.forename}
                </TableCell>
                <TableCell sx={{ width: '40px' }}>
                  {!operative.mandatory && (
                    <IconButton size="small" sx={{ padding: 0 }}>
                      <Clear fontSize="inherit" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>
                <Button startIcon={<Add />} variant="text" size="small">
                  {tr('projectObject.operativeFormAddNew')}
                </Button>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
