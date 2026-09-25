'use client';

import { useState } from 'react';
import { createTicketSchema } from '@/shared/validations/ticket';
import type { CreateTicketInput } from '@/shared/types';

interface UseTicketFormParams {
  initialValues?: Partial<CreateTicketInput>;
  onSubmit: (data: CreateTicketInput) => Promise<void>;
}

export function useTicketForm({ initialValues, onSubmit }: UseTicketFormParams) {
  const [values, setValues] = useState<CreateTicketInput>({
    title: '',
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTicketInput, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = <K extends keyof CreateTicketInput>(field: K, value: CreateTicketInput[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = createTicketSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateTicketInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof CreateTicketInput;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(result.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { values, errors, handleChange, handleSubmit, isSubmitting };
}
