import { useTicketForm } from '@/client/hooks/useTicketForm';
import { Button } from '@/client/components/Button';
import { PRIORITY_LABEL } from '@/client/components/Badge';
import type { CreateTicketInput } from '@/shared/types';

interface TicketFormProps {
  initialValues?: Partial<CreateTicketInput>;
  onSubmit: (data: CreateTicketInput) => Promise<void>;
  submitLabel: string;
}

const PRIORITY_OPTIONS: NonNullable<CreateTicketInput['priority']>[] = ['LOW', 'MEDIUM', 'HIGH'];

export const TicketForm = ({ initialValues, onSubmit, submitLabel }: TicketFormProps) => {
  const { values, errors, handleChange, handleSubmit, isSubmitting } = useTicketForm({
    initialValues,
    onSubmit,
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="form-field">
        <label htmlFor="title" className="form-label">
          제목
        </label>
        <input
          id="title"
          type="text"
          value={values.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="form-input"
        />
        {errors.title && <p className="form-error">{errors.title}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="description" className="form-label">
          설명
        </label>
        <textarea
          id="description"
          value={values.description ?? ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="form-input"
        />
        {errors.description && <p className="form-error">{errors.description}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="priority" className="form-label">
          우선순위
        </label>
        <select
          id="priority"
          value={values.priority ?? 'MEDIUM'}
          onChange={(e) => handleChange('priority', e.target.value as CreateTicketInput['priority'])}
          className="form-input"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {PRIORITY_LABEL[option]}
            </option>
          ))}
        </select>
        {errors.priority && <p className="form-error">{errors.priority}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="plannedStartDate" className="form-label">
          시작예정일
        </label>
        <input
          id="plannedStartDate"
          type="date"
          value={values.plannedStartDate ?? ''}
          onChange={(e) => handleChange('plannedStartDate', e.target.value || undefined)}
          className="form-input"
        />
        {errors.plannedStartDate && <p className="form-error">{errors.plannedStartDate}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="dueDate" className="form-label">
          종료예정일
        </label>
        <input
          id="dueDate"
          type="date"
          value={values.dueDate ?? ''}
          onChange={(e) => handleChange('dueDate', e.target.value || undefined)}
          className="form-input"
        />
        {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
      </div>

      <Button type="submit" isLoading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
};
