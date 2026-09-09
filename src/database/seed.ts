import { AppDataSource } from "./data-source";
import { seedData } from "./seed-data";
async function run() {
  const email = process.env.SEED_ADMIN_EMAIL,
    password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD");
  await AppDataSource.initialize();
  try {
    await seedData(AppDataSource, email, password);
  } finally {
    await AppDataSource.destroy();
  }
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
