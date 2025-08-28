import dotenv from 'dotenv';

dotenv.config();

export const AppConfig = {
  port: process.env.PORT || 13000,
  jwtSecret: process.env.JWT_SECRET || "",
  database: {
    url: process.env.POSTGRES_PRISMA_URL,
    directUrl: process.env.POSTGRES_URL_NON_POOLING
  }
};
