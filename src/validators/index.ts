import { Types } from 'mongoose';
import { z } from 'zod';

export const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid ObjectId' });

export const idParamSchema = z.object({ id: objectId });

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5).max(20),
});

export const createTeacherSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  specialization: z.string().trim().min(1),
  experience: z.number().int().min(0),
});

const dateInput = z.union([z.string(), z.number()]).pipe(z.coerce.date()).refine(
  (d) => !Number.isNaN(d.getTime()),
  { message: 'Invalid date' },
);

export const createSessionSchema = z
  .object({
    teacherId: objectId,
    startTime: dateInput,
    endTime: dateInput,
  })
  .refine((s) => s.endTime > s.startTime, {
    message: 'endTime must be greater than startTime',
    path: ['endTime'],
  });

export const bookSessionSchema = z.object({ userId: objectId });

export const availableQuerySchema = z.object({
  dateTimestamp: z.coerce
    .number({ invalid_type_error: 'dateTimestamp must be a number (ms since epoch)' })
    .int()
    .nonnegative(),
});
