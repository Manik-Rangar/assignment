import { Types } from 'mongoose';
import { UserModel } from '../models/user.model';
import { SessionModel, SessionStatus } from '../models/session.model';
import { ApiError } from '../utils/ApiError';

interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string;
}

export const createUser = async (input: CreateUserInput) => {
  const exists = await UserModel.exists({ email: input.email.toLowerCase() });
  if (exists) throw ApiError.conflict('A user with this email already exists');
  return UserModel.create(input);
};

/** API 6 — user's sessions split into upcoming & completed via aggregation pipeline. */
export const getUserSessions = async (userId: string) => {
  const userExists = await UserModel.exists({ _id: userId });
  if (!userExists) throw ApiError.notFound('User not found');

  const [result] = await SessionModel.aggregate<{
    upcomingSessions: unknown[];
    completedSessions: unknown[];
  }>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: { $in: [SessionStatus.BOOKED, SessionStatus.COMPLETED] },
      },
    },
    {
      $lookup: {
        from: 'teachers',
        localField: 'teacherId',
        foreignField: '_id',
        as: 'teacher',
        pipeline: [{ $project: { fullName: 1, email: 1, specialization: 1, experience: 1 } }],
      },
    },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    {
      $facet: {
        upcomingSessions: [
          { $match: { status: SessionStatus.BOOKED } },
          { $sort: { startTime: 1 } },
        ],
        completedSessions: [
          { $match: { status: SessionStatus.COMPLETED } },
          { $sort: { completedAt: -1 } },
        ],
      },
    },
  ]);

  return {
    upcomingSessions: result?.upcomingSessions ?? [],
    completedSessions: result?.completedSessions ?? [],
  };
};
