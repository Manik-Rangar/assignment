import { env } from '../config/env';

const objectId = { type: 'string', example: '665f1c2e8b3e4a0012345678', pattern: '^[a-fA-F0-9]{24}$' };
const errorRef = { $ref: '#/components/schemas/Error' };
const err = (description: string) => ({
  description,
  content: { 'application/json': { schema: errorRef } },
});
const ok = (description: string, schema: object) => ({
  description,
  content: { 'application/json': { schema } },
});
const idParam = (name: string) => ({
  name: 'id',
  in: 'path',
  required: true,
  description: `${name} ObjectId`,
  schema: objectId,
});
const jsonBody = (schemaRef: string) => ({
  required: true,
  content: { 'application/json': { schema: { $ref: schemaRef } } },
});
const wrap = (data: object) => ({
  type: 'object',
  properties: { success: { type: 'boolean', example: true }, data },
});

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Session Booking API',
    version: '1.0.0',
    description:
      'Backend for a platform where users book sessions with teachers. Teachers create available sessions, users book them, and completed sessions appear in the user history.',
  },
  servers: [{ url: `http://localhost:${env.port}`, description: 'Local' }],
  tags: [{ name: 'Users' }, { name: 'Teachers' }, { name: 'Sessions' }],
  paths: {
    '/users': {
      post: {
        tags: ['Users'],
        summary: 'API 1 – Create user (email must be unique)',
        requestBody: jsonBody('#/components/schemas/CreateUserInput'),
        responses: {
          201: ok('User created', wrap({ $ref: '#/components/schemas/User' })),
          400: err('Validation failed'),
          409: err('Email already exists'),
        },
      },
    },
    '/users/{id}/sessions': {
      get: {
        tags: ['Users'],
        summary: 'API 6 – User sessions split into upcoming & completed (aggregation pipeline)',
        parameters: [idParam('User')],
        responses: {
          200: ok(
            'User sessions',
            wrap({
              type: 'object',
              properties: {
                upcomingSessions: { type: 'array', items: { $ref: '#/components/schemas/SessionWithTeacher' } },
                completedSessions: { type: 'array', items: { $ref: '#/components/schemas/SessionWithTeacher' } },
              },
            }),
          ),
          400: err('Invalid id'),
          404: err('User not found'),
        },
      },
    },
    '/teachers': {
      post: {
        tags: ['Teachers'],
        summary: 'Create teacher (helper endpoint so sessions can be created)',
        requestBody: jsonBody('#/components/schemas/CreateTeacherInput'),
        responses: {
          201: ok('Teacher created', wrap({ $ref: '#/components/schemas/Teacher' })),
          400: err('Validation failed'),
          409: err('Email already exists'),
        },
      },
    },
    '/sessions': {
      post: {
        tags: ['Sessions'],
        summary: 'API 2 – Create session (status defaults to AVAILABLE)',
        requestBody: jsonBody('#/components/schemas/CreateSessionInput'),
        responses: {
          201: ok('Session created', wrap({ $ref: '#/components/schemas/Session' })),
          400: err('Validation failed / endTime not greater than startTime'),
          404: err('Teacher not found'),
        },
      },
    },
    '/sessions/available': {
      get: {
        tags: ['Sessions'],
        summary: 'API 3 – AVAILABLE sessions for a date (aggregation pipeline)',
        description:
          'Returns AVAILABLE sessions whose startTime falls on the UTC calendar day containing `dateTimestamp`.',
        parameters: [
          {
            name: 'dateTimestamp',
            in: 'query',
            required: true,
            description: 'Unix timestamp in milliseconds',
            schema: { type: 'integer', example: 1767225600000 },
          },
        ],
        responses: {
          200: ok('Available sessions', {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              count: { type: 'integer', example: 1 },
              data: { type: 'array', items: { $ref: '#/components/schemas/SessionWithTeacher' } },
            },
          }),
          400: err('Invalid / missing dateTimestamp'),
        },
      },
    },
    '/sessions/{id}/book': {
      post: {
        tags: ['Sessions'],
        summary: 'API 4 – Book session',
        parameters: [idParam('Session')],
        requestBody: jsonBody('#/components/schemas/BookSessionInput'),
        responses: {
          200: ok('Session booked', wrap({ $ref: '#/components/schemas/Session' })),
          400: err('Invalid id / body'),
          404: err('User or session not found'),
          409: err('Session already booked or not AVAILABLE'),
        },
      },
    },
    '/sessions/{id}/complete': {
      patch: {
        tags: ['Sessions'],
        summary: 'API 5 – Mark session complete',
        parameters: [idParam('Session')],
        responses: {
          200: ok('Session completed', wrap({ $ref: '#/components/schemas/Session' })),
          400: err('Invalid id'),
          404: err('Session not found'),
          409: err('Session is not BOOKED'),
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          details: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
        },
      },
      CreateUserInput: {
        type: 'object',
        required: ['fullName', 'email', 'phone'],
        properties: {
          fullName: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          phone: { type: 'string', example: '+919876543210' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: objectId,
          fullName: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateTeacherInput: {
        type: 'object',
        required: ['fullName', 'email', 'specialization', 'experience'],
        properties: {
          fullName: { type: 'string', example: 'John Smith' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          specialization: { type: 'string', example: 'Mathematics' },
          experience: { type: 'integer', minimum: 0, example: 5, description: 'Years of experience' },
        },
      },
      Teacher: {
        type: 'object',
        properties: {
          _id: objectId,
          fullName: { type: 'string' },
          email: { type: 'string' },
          specialization: { type: 'string' },
          experience: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateSessionInput: {
        type: 'object',
        required: ['teacherId', 'startTime', 'endTime'],
        properties: {
          teacherId: objectId,
          startTime: { type: 'string', format: 'date-time', example: '2026-01-01T10:00:00.000Z', description: 'ISO date or ms timestamp' },
          endTime: { type: 'string', format: 'date-time', example: '2026-01-01T11:00:00.000Z', description: 'Must be greater than startTime' },
        },
      },
      BookSessionInput: {
        type: 'object',
        required: ['userId'],
        properties: { userId: objectId },
      },
      Session: {
        type: 'object',
        properties: {
          _id: objectId,
          teacherId: objectId,
          userId: { ...objectId, nullable: true },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['AVAILABLE', 'BOOKED', 'COMPLETED'] },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      SessionWithTeacher: {
        allOf: [
          { $ref: '#/components/schemas/Session' },
          {
            type: 'object',
            properties: {
              teacher: {
                type: 'object',
                properties: {
                  _id: objectId,
                  fullName: { type: 'string' },
                  email: { type: 'string' },
                  specialization: { type: 'string' },
                  experience: { type: 'integer' },
                },
              },
            },
          },
        ],
      },
    },
  },
};
