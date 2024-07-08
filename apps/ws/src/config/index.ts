import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import { json, str, port } from 'envalid';
import { getContextPath, NovuComponentEnum } from '@novu/shared';
import { readdirSync } from 'fs';

dotenv.config();

let path;

switch (process.env.NODE_ENV) {
  case 'production':
    path = `${__dirname}/../.env.production`;
    break;
  case 'test':
    path = `${__dirname}/../.env.test`;
    break;
  case 'ci':
    path = `${__dirname}/../.env.ci`;
    break;
  case 'local':
    path = `${__dirname}/../.env`;
    break;
  case 'dev':
    path = `${__dirname}/../.env.development`;
    break;
  default:
    path = `${__dirname}/../.env`;
}

// NOTE: In this implementation, we ignore the above, and just use a .env file right here in the ./src/config dir.
// The .env file is copied to this dir as part of the build command.
path = "./src/config/.env"

// console.log("DIRNAME:", __dirname)
// console.log("readdirSync('.')", readdirSync("."))
const { error } = dotenv.config({ path });

if (error && !process.env.LAMBDA_TASK_ROOT) throw error;

envalid.cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['dev', 'test', 'production', 'ci', 'local'],
    default: 'local',
  }),
  PORT: port(),
  REDIS_HOST: str(),
  REDIS_PORT: port(),
  REDIS_TLS: json({
    default: undefined,
  }),
  JWT_SECRET: str(),
});

export const CONTEXT_PATH = getContextPath(NovuComponentEnum.WS);
