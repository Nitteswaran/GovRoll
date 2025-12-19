import serverless from 'serverless-http';
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

export const handler = serverless(app);
