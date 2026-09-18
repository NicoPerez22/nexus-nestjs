import { AppDataSource, requireMysqlEnv } from "./data-source";
async function run() {
  requireMysqlEnv();
  await AppDataSource.initialize();
  try {
    await AppDataSource.runMigrations({ transaction: "all" });
  } finally {
    await AppDataSource.destroy();
  }
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
