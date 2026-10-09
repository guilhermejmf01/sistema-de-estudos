import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const base44 = {
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  appBaseUrl,
  auth: {
    getUser: async () => null,
    me: async () => null,
    login: async (email, password) => {
      console.log('Login simulado para:', email);
      return { id: '1', email };
    },
    register: async (data) => {
      console.log('Registo simulado para:', data);
      return { id: '1', ...data };
    },
    logout: async () => {},
  },
  entities: {},
};

export default base44;