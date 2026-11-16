import { TeacherModel } from '../models/teacher.model';
import { UserModel } from '../models/user.model';
import { SessionModel, SessionStatus } from '../models/session.model';
import { ApiError } from '../utils/ApiError';

const DAY_MS = 24 * 60 * 60 * 1000;

interface CreateSessionInput {
  teacherId: string;
  startTime: Date;
  endTime: Date;
}

export const createSession = async (input: CreateSessionInput) => {
  if (input.endTime <= input.startTime) {
    throw ApiError.badRequest('endTime must be greater than startTime');
  }
  const teacherExists = await TeacherModel.exists({ _id: input.teacherId });
  if (!teacherExists) throw ApiError.notFound('Teacher not found');

  return SessionModel.create({ ...input, status: SessionStatus.AVAILABLE });
};

/**
 * API 3 — AVAILABLE sessions starting on the (UTC) calendar day containing `dateTimestamp`,
 * implemented with the aggregation pipeline.
 */
export const getAvailableSessions = async (dateTimestamp: number) => {
  const dayStart = new Date(Math.floor(dateTimestamp / DAY_MS) * DAY_MS);
  const dayEnd = new Date(dayStart.getTime() + DAY_MS);

  return SessionModel.aggregate([
    {
      $match: {
        status: SessionStatus.AVAILABLE,
        startTime: { $gte: dayStart, $lt: dayEnd },
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
    { $unwind: '$teacher' },
    { $sort: { startTime: 1 } },
    {
      $project: {
        teacherId: 1,
        teacher: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);
};

/** API 4 — atomically books an AVAILABLE session so concurrent requests can't double-book. */
export const bookSession = async (sessionId: string, userId: string) => {
  const [userExists, session] = await Promise.all([
    UserModel.exists({ _id: userId }),
    SessionModel.findById(sessionId).select('status').lean(),
  ]);
  if (!userExists) throw ApiError.notFound('User not found');
  if (!session) throw ApiError.notFound('Session not found');

  const booked = await SessionModel.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.AVAILABLE },
    { $set: { status: SessionStatus.BOOKED, userId } },
    { new: true },
  );

  if (!booked) {
    // Re-read to report the accurate state (it may have changed since the first read).
    const current = await SessionModel.findById(sessionId).select('status').lean();
    const status = current?.status ?? session.status;
    throw ApiError.conflict(
      status === SessionStatus.BOOKED
        ? 'Session is already booked'
        : `Only AVAILABLE sessions can be booked (current status: ${status})`,
    );
  }
  return booked;
};

/** API 5 — marks a BOOKED session as COMPLETED. */
export const completeSession = async (sessionId: string) => {
  const completed = await SessionModel.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.BOOKED },
    { $set: { status: SessionStatus.COMPLETED, completedAt: new Date() } },
    { new: true },
  );
  if (completed) return completed;

  const session = await SessionModel.findById(sessionId).select('status').lean();
  if (!session) throw ApiError.notFound('Session not found');
  throw ApiError.conflict(
    `Only BOOKED sessions can be marked as completed (current status: ${session.status})`,
  );
};
