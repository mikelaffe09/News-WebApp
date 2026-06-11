import { Calendar, X } from 'lucide-react';
import { ArticleFormState } from '../../articleTypes';
import { formatScheduledDate } from '../../../../utils/date';

interface Props {
  form: ArticleFormState;
  onClearSchedule: () => void;
}

export default function ScheduledNotice({ form, onClearSchedule }: Props) {
  if (form.status !== 'scheduled' || !form.scheduled_at) return null;

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2 text-sm text-purple-700">
      <Calendar size={15} />
      <span>Scheduled to publish on <strong>{formatScheduledDate(form.scheduled_at)}</strong></span>
      <button onClick={onClearSchedule}
        className="ml-auto text-purple-500 hover:text-purple-800 transition-colors"><X size={15} /></button>
    </div>
  );
}
