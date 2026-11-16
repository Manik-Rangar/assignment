import { TeacherModel } from '../models/teacher.model';
import { ApiError } from '../utils/ApiError';

interface CreateTeacherInput {
  fullName: string;
  email: string;
  specialization: string;
  experience: number;
}

export const createTeacher = async (input: CreateTeacherInput) => {
  const exists = await TeacherModel.exists({ email: input.email.toLowerCase() });
  if (exists) throw ApiError.conflict('A teacher with this email already exists');
  return TeacherModel.create(input);
};
