import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAxiosInstance } = vi.hoisted(() => {
  return {
    mockAxiosInstance: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() }
      },
      defaults: {
        headers: {
          common: {}
        }
      }
    }
  };
});

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance)
    }
  };
});

import { authService, issueService, bookmarkService } from './api';

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authService.login calls correct login endpoint', async () => {
    const mockResponse = { data: { accessToken: 'token123', name: 'User' } };
    mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

    const result = await authService.login('test@example.com', 'password123');

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('issueService.list serializes query parameters correctly', async () => {
    const projectId = 'proj-123';
    const mockIssues = [{ id: 'issue-1', title: 'Error' }];
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockIssues });

    const result = await issueService.list(projectId, {
      status: 'UNRESOLVED',
      severity: 'HIGH',
      search: 'NPE',
    });

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/errors?projectId=proj-123&status=UNRESOLVED&severity=HIGH&search=NPE');
    expect(result).toEqual(mockIssues);
  });

  it('issueService.get calls correct details endpoint', async () => {
    const issueId = 'issue-456';
    const mockIssue = { id: issueId, title: 'Crash' };
    mockAxiosInstance.get.mockResolvedValueOnce({ data: mockIssue });

    const result = await issueService.get(issueId);

    expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/errors/${issueId}`);
    expect(result).toEqual(mockIssue);
  });

  it('issueService.updateStatus calls status update endpoint', async () => {
    const issueId = 'issue-789';
    mockAxiosInstance.put.mockResolvedValueOnce({ data: { id: issueId, status: 'RESOLVED' } });

    await issueService.updateStatus(issueId, 'RESOLVED');

    expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/errors/${issueId}/status`, {
      status: 'RESOLVED',
    });
  });

  it('bookmarkService.bookmark calls correct post bookmark endpoint', async () => {
    const issueId = 'issue-abc';
    mockAxiosInstance.post.mockResolvedValueOnce({});

    await bookmarkService.bookmark(issueId);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/bookmarks/${issueId}`);
  });

  it('bookmarkService.unbookmark calls delete bookmark endpoint', async () => {
    const issueId = 'issue-xyz';
    mockAxiosInstance.delete.mockResolvedValueOnce({});

    await bookmarkService.unbookmark(issueId);

    expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/bookmarks/${issueId}`);
  });
});
