import { TranslationKey } from './language';

export interface FieldError {
  type: 'custom' | 'projectDate';
  message: TranslationKey;
}

export type FormErrors<T> = {
  errors: {
    [key in keyof T]?: FieldError | { type?: string };
  };
} | null;

export function fieldError(
  message: TranslationKey,
  type: 'custom' | 'projectDate' = 'custom',
): FieldError {
  return {
    type,
    message,
  };
}

export function mergeErrors<T>(errors: FormErrors<T>[]) {
  return errors.reduce(
    (errorsResult, errorObject) => {
      return {
        errors: {
          ...errorsResult.errors,
          ...(errorObject?.errors ?? {}),
        },
      };
    },
    { errors: {} },
  );
}

export function hasErrors<T>(checkResult: FormErrors<T>) {
  return checkResult?.errors && Object.keys(checkResult.errors).length > 0;
}
