/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  webpack: (config, { isServer }) => {
    // Exclude legacy directory from compilation
    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /legacy/,
    });
    return config;
  },
};

export default config;
