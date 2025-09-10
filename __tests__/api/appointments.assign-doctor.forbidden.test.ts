import { createMocks } from 'node-mocks-http';
import * as nextAuth from 'next-auth';
import { PATCH as AssignDoctor } from '@/app/api/appointments/[id]/assign-doctor/route';

jest.mock('next-auth');

describe('PATCH /api/appointments/[id]/assign-doctor', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 403 when authenticated as disallowed role', async () => {
    (nextAuth.getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'DOCTOR' } });
    const { req } = createMocks({ method: 'PATCH' });
    const res = (await AssignDoctor(req as any, { params: { id: 'apt1' } } as any)) as Response;
    expect(res.status).toBe(403);
  });
});

