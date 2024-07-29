import { CONTEXT_PATH } from './config';
// import 'newrelic';
import '@sentry/tracing';

import helmet from 'helmet';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import * as passport from 'passport';
import * as compression from 'compression';
import { NestFactory, Reflector } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import * as Sentry from '@sentry/node';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BullMqService, getErrorInterceptor, getLogLevel, Logger as PinoLogger } from '@novu/application-generic';
import { ExpressAdapter } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './app/shared/framework/response.interceptor';
import { RolesGuard } from './app/auth/framework/roles.guard';
import { SubscriberRouteGuard } from './app/auth/framework/subscriber-route.guard';
import { validateEnv } from './config/env-validator';

import * as packageJson from '../package.json';
import { readFileSync } from 'fs';

const extendedBodySizeRoutes = ['/v1/events', '/v1/notification-templates', '/v1/workflows', '/v1/layouts'];

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

const runAsHttp = process.env.RUN_ON_HTTP === 'true';

const httpsCerts =
  !runAsHttp && process.env.HTTPS_CERT_PATH && process.env.HTTPS_KEY_PATH
    ? {
        cert: readFileSync(process.env.HTTPS_CERT_PATH),
        key: readFileSync(process.env.HTTPS_KEY_PATH),
      }
    : undefined;

if (httpsCerts?.cert && httpsCerts.key) {
  console.log('Successfully read https cert and key files');
  // TODO - comment out
  console.log('https:', process.env.HTTPS_CERT_PATH, ';', process.env.HTTPS_KEY_PATH);
} else {
  if (runAsHttp) {
    console.log('Running API server on HTTP, not HTTPS');
  } else {
    // console.log(
    //   'WARNING - Failed to obtain https cert and key. Please provide absolute filepaths to the https cert and key files, as the values for the following .env variables for the API server: HTTPS_CERT_PATH, HTTPS_KEY_PATH. \n (If instead intending to run the API server on HTTP, set RUN_ON_HTTP=true in .env.)'
    // );
    throw new Error(
      'ERROR - Failed to obtain https cert and key. Please provide absolute filepaths to the https cert and key files, as the values for the following .env variables for the API server: HTTPS_CERT_PATH, HTTPS_KEY_PATH. \n (If instead intending to run the API server on HTTP, set RUN_ON_HTTP=true in .env.)'
    );
  }
}

export async function bootstrap(expressApp?): Promise<INestApplication> {
  BullMqService.haveProInstalled();

  let app: INestApplication;
  if (expressApp) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  } else {
    app = await NestFactory.create(AppModule, {
      ...(httpsCerts ? { httpsOptions: { cert: httpsCerts.cert, key: httpsCerts.key } } : {}),
    });
  }

  // if (httpsCerts?.cert && httpsCerts.key) {
  // app.use(httpsRequireSslMiddleware);
  // }

  // Logger.log('API bootstrap file - value of app url:', safeStringify(app));

  // const circ: { [a: symbol | string | number]: any } = {
  //   head: 'a',
  //   body: 'b',
  //   tail: 'c',
  //   other: 'a',
  // };

  // circ.trouble = {
  //   a: { b: 'c' },
  //   b: [...[1, 2]],
  // };

  // close the circle somewhere:
  // circ.trouble.a = circ.trouble;

  // function safeStringify(o: any) {
  //   const safeObj: {
  //     [prop: string]: any;
  //     circularKeys: string[];
  //   } = {
  //     circularKeys: [],
  //   };
  //   try {
  //     if (o instanceof Object) {
  //       for (const [key, val] of Object.entries(o)) {
  //         try {
  //           const strfiable = JSON.stringify(val);
  //           // If here, it didn't error, so:
  //           safeObj[key] = val;
  //         } catch (err) {
  //           let newCircular = key;
  //           // chase the circular ref for n times?
  //           let n = 0;
  //           let next = Object.keys(val || { '': '' })[0];
  //           while (n < 3) {
  //             let nested = next?.[key];
  //             if (nested) {
  //               newCircular += `.${nested}`;
  //               next = Object.keys(nested || { '': '' })[0];
  //             }
  //             n++;
  //           }
  //           safeObj.circularKeys.push(key);
  //           continue;
  //         }
  //       }

  //       // JSON.stringify(safeObj)
  //       console.log(safeObj);
  //     } else {
  //       console.log('not an object:', o);
  //     }
  //   } catch (err) {
  //     console.log('err in safeStringify:', err);
  //     return;
  //   }
  // }

  app.flushLogs();

  const server = app.getHttpServer();
  Logger.verbose(`Server timeout: ${server.timeout}`);
  server.keepAliveTimeout = 61 * 1000;
  Logger.verbose(`Server keepAliveTimeout: ${server.keepAliveTimeout / 1000}s `);
  server.headersTimeout = 65 * 1000;
  Logger.verbose(`Server headersTimeout: ${server.headersTimeout / 1000}s `);

  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }

  app.use(helmet());
  app.enableCors(corsOptionsDelegate);

  app.setGlobalPrefix(CONTEXT_PATH + 'v1');

  app.use(passport.initialize());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: false,
    })
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(getErrorInterceptor());

  app.useGlobalGuards(new RolesGuard(app.get(Reflector)));
  app.useGlobalGuards(new SubscriberRouteGuard(app.get(Reflector)));

  app.use(extendedBodySizeRoutes, bodyParser.json({ limit: '20mb' }));
  app.use(extendedBodySizeRoutes, bodyParser.urlencoded({ limit: '20mb', extended: true }));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(compression());

  // const options = new DocumentBuilder()
  //   .setTitle('Novu API')
  //   .setDescription('The Novu API description')
  //   .setVersion('1.0')
  //   .addTag('Events')
  //   .addTag('Subscribers')
  //   .addTag('Topics')
  //   .addTag('Notification')
  //   .addTag('Integrations')
  //   .addTag('Layouts')
  //   .addTag('Workflows')
  //   .addTag('Notification Templates')
  //   .addTag('Workflow groups')
  //   .addTag('Changes')
  //   .addTag('Environments')
  //   .addTag('Inbound Parse')
  //   .addTag('Feeds')
  //   .addTag('Tenants')
  //   .addTag('Messages')
  //   .addTag('Execution Details')
  //   .build();
  // const document = SwaggerModule.createDocument(app, options);

  // SwaggerModule.setup('api', app, document);

  Logger.log('BOOTSTRAPPED SUCCESSFULLY');

  if (expressApp) {
    await app.init();
  } else {
    await app.listen(process.env.PORT);
  }

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  Logger.log(`Started application in NODE_ENV=${process.env.NODE_ENV} on port ${process.env.PORT}`);

  return app;
}

const corsOptionsDelegate = function (req, callback) {
  const corsOptions = {
    origin: false as boolean | string | string[],
    preflightContinue: false,
    allowedHeaders: ['Content-Type', 'Authorization', 'sentry-trace'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  };

  if (['dev', 'test', 'local'].includes(process.env.NODE_ENV) || isWidgetRoute(req.url) || isBlueprintRoute(req.url)) {
    corsOptions.origin = '*';
  } else {
    corsOptions.origin = [process.env.FRONT_BASE_URL];
    if (process.env.WIDGET_BASE_URL) {
      corsOptions.origin.push(process.env.WIDGET_BASE_URL);
    }
  }
  callback(null, corsOptions);
};

function isWidgetRoute(url: string) {
  return url.startsWith('/v1/widgets');
}

function isBlueprintRoute(url: string) {
  return url.startsWith('/v1/blueprints');
}
