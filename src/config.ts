import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  server: {
    port: number;
  };
  aws: {
    userPoolId: string;
    userPoolRegion: string;
    clientId: string;
    clientSecret: string;
  };
}

export const config: AppConfig = {
  server: {
    port: parseInt(process.env.SERVER_PORT || '3030', 10),
  },
  aws: {
    userPoolId: process.env.AWS_USER_POOL_ID || '',
    userPoolRegion: process.env.AWS_USER_POOL_REGION || '',
    clientId: process.env.AWS_CLIENT_ID || '',
    clientSecret: process.env.AWS_CLIENT_SECRET || '',
  },
};
