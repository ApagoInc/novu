import './config';
// import 'newrelic';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { RedisIoAdapter } from './shared/framework/redis.adapter';

import { AppModule } from './app.module';
import { CONTEXT_PATH } from './config';
import helmet from 'helmet';
import { BullMqService } from '@novu/application-generic';
import { version } from '../package.json';
import { getErrorInterceptor, Logger } from '@novu/application-generic';
import { readFileSync } from 'fs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: `v${version}`,
  });
}

export async function bootstrap() {
  BullMqService.haveProInstalled();

  const runAsHttp = process.env.RUN_ON_HTTP === 'true';

  // TODO - The API uses identical https cert setup code - factor this out at some point, to a library function or something?
  const httpsCerts =
    !runAsHttp && process.env.HTTPS_CERT_PATH && process.env.HTTPS_KEY_PATH
      ? {
          cert: readFileSync(process.env.HTTPS_CERT_PATH),
          key: readFileSync(process.env.HTTPS_KEY_PATH),
        }
      : undefined;
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    ...(httpsCerts ? { httpsOptions: { cert: httpsCerts.cert, key: httpsCerts.key } } : {}),
  });

  if (httpsCerts?.cert && httpsCerts.key) {
    console.log('Successfully read https cert and key files');
    // TODO - comment out
    console.log('https:', process.env.HTTPS_CERT_PATH, ';', process.env.HTTPS_KEY_PATH);
  } else {
    if (runAsHttp) {
      console.log('Running websocket server on HTTP, not HTTPS');
    } else {
      // console.log(
      //   'WARNING - Failed to obtain https cert and key. Please provide absolute filepaths to the https cert and key files, as the values for the following .env variables for the websocket server: HTTPS_CERT_PATH, HTTPS_KEY_PATH. \n (If instead intending to run the websocket server on HTTP, set RUN_ON_HTTP=true in .env.)'
      // );
      throw new Error(
        'ERROR - Failed to obtain https cert and key. Please provide absolute filepaths to the https cert and key files, as the values for the following .env variables for the websocket server: HTTPS_CERT_PATH, HTTPS_KEY_PATH. \n (If instead intending to run the websocket server on HTTP, set RUN_ON_HTTP=true in .env.)'
      );
    }
  }

  const redisIoAdapter = new RedisIoAdapter(app);

  app.useLogger(app.get(Logger));
  app.flushLogs();

  app.useGlobalInterceptors(getErrorInterceptor());

  console.log('WEBSOCKET: bootstrap - running.');
  // console.log('WEBSOCKET: value of CONTEXT_PATH:', CONTEXT_PATH);
  // // Maybe set a global prefix?
  // const CUSTOM_CONTEXT_PATH = '/ws';
  // console.log('WEBSOCKET: value of CUSTOM_CONTEXT_PATH:', CUSTOM_CONTEXT_PATH);
  // app.setGlobalPrefix(CUSTOM_CONTEXT_PATH);

  app.setGlobalPrefix(CONTEXT_PATH);

  app.use(helmet());

  app.enableCors({
    origin: '*',
    preflightContinue: false,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(process.env.PORT as string);

  // try {
  //   const appUrl = await app.getUrl();
  //   // console.log('WEBSOCKET, appUrl - after app.listen():', appUrl);
  // } catch (err) {
  //   console.log('WEBSOCKET: error getting appUrl', err);
  //   // It is running on http://[::1]:3002
  // }
}
