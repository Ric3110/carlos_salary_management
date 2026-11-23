const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');
const { setupSwagger } = require('./docs/swagger.setup');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupSwagger(app);

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
