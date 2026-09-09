import { INestApplication, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { DbErrorFilter } from "./common/db-error.filter";
export function setup(app: INestApplication) {
  app.setGlobalPrefix("api");
  app.use(helmet());
  app.enableCors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:4200")
      .split(",")
      .map((x) => x.trim()),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DbErrorFilter());
  app.enableShutdownHooks();
}
