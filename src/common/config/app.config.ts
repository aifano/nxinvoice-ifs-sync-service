import dotenv from 'dotenv';

dotenv.config();

export const AppConfig = {
  port: process.env.PORT || 13000,
  jwtSecret: process.env.JWT_SECRET || ""
};
