import axios from 'axios';
import { 
  User, Project, Issue, Comment, EventLog, 
  AIAnalysis, ScrapedFix, IssueStatus, IssueSeverity, IssueDifficulty 
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/login' || originalRequest.url === '/auth/refresh') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new Event('authExpired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string): Promise<{ accessToken: string; refreshToken: string; name: string; email: string; role: 'ADMIN' | 'DEVELOPER'; userId: string }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email: string, name: string, role: string): Promise<any> => {
    const response = await api.post('/auth/register', { email, name, role, password: 'DefaultPassword123!' });
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const projectService = {
  list: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },
  create: async (name: string): Promise<Project> => {
    const response = await api.post('/projects', { name });
    return response.data;
  }
};

export const issueService = {
  list: async (
    projectId: string,
    filters: {
      status?: IssueStatus | '';
      severity?: IssueSeverity | '';
      difficulty?: IssueDifficulty | '';
      search?: string;
      sortBy?: string;
    }
  ): Promise<Issue[]> => {
    const params = new URLSearchParams({ projectId });
    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const response = await api.get(`/errors?${params.toString()}`);
    return response.data;
  },

  search: async (
    projectId: string,
    query: string,
    filters: {
      status?: IssueStatus | '';
      severity?: IssueSeverity | '';
      difficulty?: IssueDifficulty | '';
      languageId?: string;
      frameworkId?: string;
      categoryId?: string;
      tagIds?: string[];
      sortBy?: string;
    }
  ): Promise<{
    issues: Issue[];
    suggestions: string[];
    autocomplete: string[];
  }> => {
    const params = new URLSearchParams({ projectId });
    if (query) params.append('query', query);
    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.languageId) params.append('language', filters.languageId);
    if (filters.frameworkId) params.append('framework', filters.frameworkId);
    if (filters.categoryId) params.append('category', filters.categoryId);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.tagIds && filters.tagIds.length > 0) {
      filters.tagIds.forEach(tag => params.append('tags', tag));
    }

    const response = await api.get(`/search?${params.toString()}`);
    return response.data;
  },

  get: async (id: string): Promise<Issue> => {
    const response = await api.get(`/errors/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: IssueStatus): Promise<Issue> => {
    const response = await api.put(`/errors/${id}/status`, { status });
    return response.data;
  },

  assign: async (id: string, userId: string): Promise<Issue> => {
    const response = await api.put(`/errors/${id}/assign`, { userId });
    return response.data;
  },

  getEvents: async (id: string): Promise<EventLog[]> => {
    const response = await api.get(`/issues/${id}/events`);
    return response.data;
  },

  getComments: async (id: string): Promise<Comment[]> => {
    const response = await api.get(`/issues/${id}/comments`);
    return response.data;
  },

  addComment: async (id: string, content: string): Promise<Comment> => {
    const response = await api.post(`/issues/${id}/comments`, { content });
    return response.data;
  },

  getAIDiagnosis: async (id: string, additionalContext?: string): Promise<AIAnalysis> => {
    const url = additionalContext 
      ? `/issues/${id}/ai-diagnose?additionalContext=${encodeURIComponent(additionalContext)}` 
      : `/issues/${id}/ai-diagnose`;
    const response = await api.post(url);
    return response.data;
  },

  getScrapedFixes: async (id: string): Promise<ScrapedFix[]> => {
    const response = await api.get(`/issues/${id}/scraped-fixes`);
    return response.data;
  }
};

export const bookmarkService = {
  bookmark: async (issueId: string): Promise<void> => {
    await api.post(`/bookmarks/${issueId}`);
  },
  unbookmark: async (issueId: string): Promise<void> => {
    await api.delete(`/bookmarks/${issueId}`);
  },
  listIds: async (): Promise<string[]> => {
    const response = await api.get('/bookmarks');
    return response.data;
  }
};

export const notificationService = {
  list: async (): Promise<any[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  }
};

export const adminService = {
  listUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  updateUserRole: async (userId: string, role: string): Promise<User> => {
    const response = await api.put(`/admin/users/${userId}/role?role=${role}`);
    return response.data;
  }
};

export const taxonomyService = {
  getLanguages: async (): Promise<Array<{ id: string; name: string; slug: string }>> => {
    const response = await api.get('/taxonomy/languages');
    return response.data;
  },
  getFrameworks: async (): Promise<Array<{ id: string; name: string; slug: string }>> => {
    const response = await api.get('/taxonomy/frameworks');
    return response.data;
  },
  getCategories: async (): Promise<Array<{ id: string; name: string; slug: string }>> => {
    const response = await api.get('/taxonomy/categories');
    return response.data;
  },
  getTags: async (): Promise<Array<{ id: string; name: string; slug: string }>> => {
    const response = await api.get('/taxonomy/tags');
    return response.data;
  }
};

export default api;
