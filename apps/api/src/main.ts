import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { type AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<AppConfig>);
  const port = config.get('port', { infer: true }) ?? 3000;
  const corsOrigin = config.get('corsOrigin', { infer: true });

  app.enableCors({ origin: corsOrigin });
  await app.listen(port);
  console.log(`API is running on port ${port}`);
}

bootstrap();
