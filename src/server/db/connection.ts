import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/edu_one";

const sql = postgres(connectionString);
export const db = drizzle(sql);
