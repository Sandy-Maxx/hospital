import { createMocks } from 'node-mocks-http';
import * as nextAuth from 'next-auth';
import { POST as BillsPost } from '@/app/api/bills/route';

jest.mock('next-auth');

describe('POST /api/bills', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 403 when authenticated as DOCTOR', async () => {
    (nextAuth.getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'DOCTOR' } });
    const { req } = createMocks({ method: 'POST' });
    const res = (await BillsPost(req as any)) as Response;
    expect(res.status).toBe(403);
  });
});

