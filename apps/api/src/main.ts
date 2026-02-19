import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:5173' });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`API is running on port ${process.env.PORT ?? 3000}`);
}

bootstrap();
