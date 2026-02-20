import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import morgan from 'morgan';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { type AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<AppConfig>);
  const port = config.get('port', { infer: true }) ?? 3000;
  const corsOrigin = config.get('corsOrigin', { infer: true });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: [
            "'self'",
            "'sha256-xWQwGLGML5mNNPGsILz+eAdeO2/VjqM/jj5PBnvsstA='",
          ],
        },
      },
    }),
  );
  app.use(morgan('dev'));
  app.enableCors({ origin: corsOrigin });
  await app.listen(port);
  console.log(`API is running on port ${port}`);
}

bootstrap();
