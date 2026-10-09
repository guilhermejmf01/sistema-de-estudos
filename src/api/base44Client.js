import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const base44 = {
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  appBaseUrl,
  auth: {
    getUser: async () => ({ id: '1', email: 'user@example.com' }),
    me: async () => ({ id: '1', email: 'user@example.com' }),
    login: async (email, password) => ({ id: '1', email }),
    register: async (data) => ({ id: '1', ...data }),
    loginWithProvider: (provider, returnTo) => {
      window.location.href = returnTo || '/';
    },
    logout: async () => {},
  },
  entities: {},
};

export default base44;