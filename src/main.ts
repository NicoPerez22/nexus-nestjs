import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { setup } from "./setup";
import { requireMysqlEnv } from "./database/data-source";
async function bootstrap() {
  requireMysqlEnv();
  const hours = Number(process.env.SESSION_HOURS || 8);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 168)
    throw new Error("SESSION_HOURS must be between 0 and 168");
  const app = await NestFactory.create(AppModule);
  setup(app);
  await app.listen(Number(process.env.PORT || 3000));
}
bootstrap().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
