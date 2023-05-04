import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';

import { useTranslations } from '@frontend/stores/lang';

import { DetailPlanNotificationMailEvent } from '@shared/schema/project/detailplan';

interface Props {
  events: readonly DetailPlanNotificationMailEvent[];
}

export function NotificationHistory({ events }: Props) {
  const tr = useTranslations();
  return !events.length ? (
    <Typography sx={{ mt: 4 }}>{tr('detailplanProject.notificationHistoryEmpty')}</Typography>
  ) : (
    <Accordion sx={{ mt: 4 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography>{tr('detailplanProject.notificationHistory')}</Typography>
        <Chip size="small" variant="outlined" sx={{ ml: 2 }} label={events.length} />
      </AccordionSummary>
      <AccordionDetails>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{tr('detailplanProject.notificationHistory.sentAt')}</TableCell>
              <TableCell>{tr('detailplanProject.notificationHistory.sentBy')}</TableCell>
              <TableCell>{tr('detailplanProject.notificationHistory.templateName')}</TableCell>
              <TableCell>{tr('detailplanProject.notificationHistory.recipients')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{dayjs(event.sentAt).format(tr('datetime.format'))}</TableCell>
                <TableCell>{event.sentBy}</TableCell>
                <TableCell>
                  {tr(`detailplanProject.notificationTemplate.${event.templateName}`)}
                </TableCell>
                <TableCell>{event.to.join(' ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
}
