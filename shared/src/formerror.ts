import { TranslationKey } from './language/index.js';

export interface FieldError {
  type: 'custom';
  message: TranslationKey;
}

export type FormErrors<T> = {
  errors: {
    [key in keyof T]?: FieldError | { type?: string };
  };
} | null;

export function fieldError(message: TranslationKey): FieldError {
  return {
    type: 'custom',
    message,
  };
}

export function stringifyFieldErrors<T>(errorObject: FormErrors<T>) {
  if (!errorObject?.errors) return '';
  return JSON.stringify(
    Object.values<
      | FieldError
      | {
          type?: string;
        }
      | undefined
    >(errorObject.errors)
      .map((fieldError) => (fieldError && 'message' in fieldError ? fieldError.message : ''))
      .join(', '),
  );
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
