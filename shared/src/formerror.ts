export interface FieldError {
  type: string;
  message?: string;
}

export type FormErrors<T> = {
  errors: {
    [key in keyof T]?: FieldError;
  };
} | null;

export function fieldError(message: string) {
  return {
    type: 'custom',
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
    { errors: {} }
  );
}

export function hasErrors<T>(checkResult: FormErrors<T>) {
  return checkResult?.errors && Object.keys(checkResult.errors).length > 0;
}
