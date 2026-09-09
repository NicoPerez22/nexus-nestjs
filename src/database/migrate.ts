import { AppDataSource } from "./data-source";
async function run() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
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
