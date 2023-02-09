import { ZodObject, ZodRawShape } from 'zod';

export function getRequiredFields<T extends ZodRawShape>(schema: ZodObject<T>) {
  return new Set(
    Object.keys(schema.shape).filter((key) => {
      const field = schema.shape[key as keyof typeof schema.shape];
      return !field.isOptional() && !field.isNullable();
    })
  );
}
