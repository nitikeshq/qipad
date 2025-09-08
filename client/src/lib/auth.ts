import { apiRequest } from './queryClient';

export const authAPI = {
  register: async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    userType: 'business_owner' | 'investor' | 'individual';
    passwordHash: string;
    referralCode?: string;
  }) => {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    return response.json();
  },

  googleAuth: async (googleData: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: 'business_owner' | 'investor' | 'individual';
  }) => {
    const response = await apiRequest('POST', '/api/auth/google', googleData);
    return response.json();
  }
};
