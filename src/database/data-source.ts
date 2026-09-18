import "dotenv/config";
import { DataSource, DataSourceOptions } from "typeorm";
import { entities } from "./entities";
import { Initial1788900000000 } from "./migrations/initial";
import process from "process";

export function requireMysqlEnv() {
  const host = process.env.MYSQLHOST;
  const username = process.env.MYSQLUSER;
  const password = process.env.MYSQLPASSWORD;
  const database = process.env.MYSQLDATABASE;
  const port = Number(process.env.MYSQLPORT || 3306);
  if (!host || !username || !password || !database)
    throw new Error(
      "Configure MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD and MYSQLDATABASE in .env",
    );
  if (!Number.isInteger(port) || port <= 0 || port > 65535)
    throw new Error("MYSQLPORT must be a valid TCP port");
  return { host, port, username, password, database };
}

const mysql = {
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT || 3306),
  username: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
};

export const databaseOptions: DataSourceOptions = {
  type: "mysql",
  ...mysql,
  entities,
  migrations: [Initial1788900000000],
  synchronize: false,
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000,
  },
};

export const AppDataSource = new DataSource(databaseOptions);
