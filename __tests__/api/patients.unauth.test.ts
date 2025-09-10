import { createMocks } from 'node-mocks-http';
import { GET as PatientsGet } from '@/app/api/patients/route';

// Basic smoke test to ensure unauthorized requests are rejected
describe('GET /api/patients', () => {
  it('returns 401 when not authenticated', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    // The handler expects a NextRequest, but node-mocks-http works for basic auth tests
    // We rely on withAuth calling getServerSession which will return null in test env
    const response = (await PatientsGet(req as any)) as Response;
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
  });
});

