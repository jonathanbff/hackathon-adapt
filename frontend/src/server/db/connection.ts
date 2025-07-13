import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schemas";

const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/edu_one";

const sql = postgres(connectionString);
export const db = drizzle(sql, { schema });
