import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const base44 = {
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  appBaseUrl,
  // Implementação mock/stub para evitar erros de invocação caso alguma página chame a API
  auth: {
    getUser: async () => null,
    login: async () => {},
    logout: async () => {},
  },
  entities: {},
};

export default base44;