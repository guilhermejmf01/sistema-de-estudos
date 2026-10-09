import { appParams } from '@/lib/app-params';

const mockUser = {
  id: 'usr_mock_123',
  email: 'guilhermejmf01@gmail.com',
  name: 'Guilherme',
  role: 'admin',
};

export const base44 = {
  appId: appParams.appId,
  token: 'mock-valid-token-123',
  functionsVersion: appParams.functionsVersion,
  serverUrl: '',
  appBaseUrl: appParams.appBaseUrl,
  auth: {
    getUser: async () => mockUser,
    me: async () => mockUser,
    getToken: () => 'mock-valid-token-123',
    setToken: () => {},
    login: async () => {
      localStorage.setItem('token', 'mock-valid-token-123');
      localStorage.setItem('base44_access_token', 'mock-valid-token-123');
      return mockUser;
    },
    loginViaEmailPassword: async () => {
      localStorage.setItem('token', 'mock-valid-token-123');
      localStorage.setItem('base44_access_token', 'mock-valid-token-123');
      return mockUser;
    },
    register: async () => {
      localStorage.setItem('token', 'mock-valid-token-123');
      localStorage.setItem('base44_access_token', 'mock-valid-token-123');
      return mockUser;
    },
    loginWithProvider: () => {
      localStorage.setItem('token', 'mock-valid-token-123');
      localStorage.setItem('base44_access_token', 'mock-valid-token-123');
      return mockUser;
    },
    logout: async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('base44_access_token');
    },
  },
  entities: {},
};

export default base44;
