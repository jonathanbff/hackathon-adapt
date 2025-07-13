import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		DATABASE_URL: z.string().url(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		BLOB_READ_WRITE_TOKEN: z.string(),
		UPSTASH_VECTOR_REST_TOKEN: z.string(),
		UPSTASH_VECTOR_REST_URL: z.string().url(),
		LLAMA_CLOUD_API_KEY: z.string(),
		OPENAI_API_KEY: z.string(),
		GROQ_API_KEY: z.string(),
		TRIGGER_SECRET_KEY: z.string(),
		SEARCHAPI_KEY: z.string(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// NEXT_PUBLIC_CLIENTVAR: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
		UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
		UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
		LLAMA_CLOUD_API_KEY: process.env.LLAMA_CLOUD_API_KEY,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		GROQ_API_KEY: process.env.GROQ_API_KEY,
		TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
		SEARCHAPI_KEY: process.env.SEARCHAPI_KEY,
		// NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});

// // Set default values for environment variables
// if (!process.env.DATABASE_URL) {
// 	process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_YQlKM7yjFd5A@ep-curly-snowflake-aekpa8kv-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
// }

// Do not assign to process.env.NODE_ENV as it may be read-only.
// Instead, handle default in runtimeEnv or schema.
