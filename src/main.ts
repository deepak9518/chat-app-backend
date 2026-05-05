import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { SwaggerConfig } from './config/docs/swagger.config';
import { ValidateInputPipe } from './config/pipe/validate.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  SwaggerConfig.config(app);
  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:3001', // Next.js
    credentials: true,
  });
  // DTO validation pipe configuration
  app.useGlobalPipes(new ValidateInputPipe());

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
