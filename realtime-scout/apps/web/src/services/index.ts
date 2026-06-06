import api from './api';

export const authApi = {
  register: (data: { username: string; password: string; nickname?: string }) =>
    api.post('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const taskApi = {
  create: (data: any) => api.post('/tasks', data),
  getNearby: (lng: number, lat: number, radius?: number) =>
    api.get('/tasks/nearby', { params: { lng, lat, radius } }),
  getById: (id: number) => api.get(`/tasks/${id}`),
  accept: (id: number, lng?: number, lat?: number) => api.post(`/tasks/${id}/accept`, { lng, lat }),
  cancel: (id: number) => api.post(`/tasks/${id}/cancel`),
  giveUp: (id: number) => api.post(`/tasks/${id}/giveup`),
  confirm: (id: number) => api.post(`/tasks/${id}/confirm`),
  reject: (id: number, reason?: string) => api.post(`/tasks/${id}/reject`, { reason }),
  submit: (id: number, formData: FormData) =>
    api.post(`/tasks/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMyPublished: () => api.get('/tasks/my/published'),
  getMyAccepted: () => api.get('/tasks/my/accepted'),
};

export const walletApi = {
  getBalance: () => api.get('/wallet/balance'),
  topup: (amount: number) => api.post('/wallet/topup', { amount }),
  getTransactions: (page?: number) => api.get('/wallet/transactions', { params: { page } }),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const chatApi = {
  getMessages: (taskId: number) => api.get(`/chat/${taskId}/messages`),
  sendMessage: (taskId: number, content: string) => api.post(`/chat/${taskId}/messages`, { content }),
  sendFile: (taskId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/chat/${taskId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};

export const reviewApi = {
  createReview: (taskId: number, data: { score_1: number; score_2: number; score_3: number; comment?: string }) =>
    api.post(`/reviews/tasks/${taskId}`, data),
  getTaskReviews: (taskId: number) => api.get(`/reviews/tasks/${taskId}`),
  getUserReviews: (userId: number) => api.get(`/reviews/users/${userId}`),
  getGivenReviews: () => api.get('/reviews/given'),
};
