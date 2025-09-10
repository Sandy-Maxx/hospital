import { createMocks } from 'node-mocks-http';
import { GET as AppointmentsGet } from '@/app/api/appointments/route';

describe('GET /api/appointments', () => {
  it('returns 401 when not authenticated', async () => {
    const { req } = createMocks({ method: 'GET', url: '/api/appointments' });
    const res = (await AppointmentsGet(req as any)) as Response;
    expect(res.status).toBe(401);
  });
});

