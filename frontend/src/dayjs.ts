import dayjs from 'dayjs';
import arraySupport from 'dayjs/plugin/arraySupport';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(arraySupport);
dayjs.extend(relativeTime);
export default dayjs;
