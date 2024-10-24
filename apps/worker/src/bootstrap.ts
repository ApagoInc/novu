import { CONTEXT_PATH } from './config';
// import 'newrelic';
import '@sentry/tracing';
import helmet from 'helmet';
import { INestApplication, Logger, NestInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import * as Sentry from '@sentry/node';
import { BullMqService, INovuWorker, ReadinessService } from '@novu/application-generic';
import { getErrorInterceptor, Logger as PinoLogger } from '@novu/application-generic';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './app/shared/response.interceptor';
import { validateEnv } from './config/env-validator';
import * as packageJson from '../package.json';
import { WorkflowQueueService } from './app/workflow/services/workflow-queue.service';
import { TriggerProcessorQueueService } from './app/workflow/services/trigger-processor-queue.service';

const extendedBodySizeRoutes = ['/v1/events', '/v1/notification-templates', '/v1/layouts'];

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: `v${packageJson.version}`,
    ignoreErrors: ['Non-Error exception captured'],
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
    ],
  });
}

// Validate the ENV variables after launching SENTRY, so missing variables will report to sentry
validateEnv();

const getWorkers = (app: INestApplication): INovuWorker[] => {
  const workflowQueueService = app.get(WorkflowQueueService, { strict: false });
  const triggerQueueService = app.get(TriggerProcessorQueueService, { strict: false });

  return [workflowQueueService, triggerQueueService];
};

const prepareAppInfra = async (app: INestApplication): Promise<void> => {
  const readinessService = app.get(ReadinessService);
  const workers = getWorkers(app);

  await readinessService.pauseWorkers(workers);
};

const startAppInfra = async (app: INestApplication): Promise<void> => {
  const readinessService = app.get(ReadinessService);
  const workers = getWorkers(app);
  await readinessService.enableWorkers(workers);
};

export async function bootstrap(): Promise<INestApplication> {
  BullMqService.haveProInstalled();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(PinoLogger));
  app.flushLogs();

  await prepareAppInfra(app);

  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }

  app.use(helmet());

  app.setGlobalPrefix(CONTEXT_PATH + 'v1');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: false,
    })
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(getErrorInterceptor());

  app.use(extendedBodySizeRoutes, bodyParser.json({ limit: '20mb' }));
  app.use(extendedBodySizeRoutes, bodyParser.urlencoded({ limit: '20mb', extended: true }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  Logger.log('BOOTSTRAPPED SUCCESSFULLY');

  await app.listen(process.env.PORT);

  await startAppInfra(app);

  Logger.log(`Started application in NODE_ENV=${process.env.NODE_ENV} on port ${process.env.PORT}`);

  return app;
}
