import * as offlineModule from '@/lib/offline';
import { apiClient } from '@/lib/api-client';

describe('apiClient.requestJSON offline queue', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch' as any).mockImplementation(() => {
      throw new Error('fetch should not be called when offline');
    });
    jest.spyOn(offlineModule, 'isOnline').mockReturnValue(false as any);
    (offlineModule.offlineDB as any) = { queueAction: jest.fn().mockResolvedValue(undefined) } as any;
  });

  afterEach(() => {
    (global.fetch as any).mockRestore();
    (offlineModule.isOnline as any).mockRestore();
  });

  it('queues POST when offline', async () => {
    const res = await apiClient.requestJSON('/api/test', { method: 'POST', body: { a: 1 } });
    expect(res.queued).toBe(true);
  });
});

