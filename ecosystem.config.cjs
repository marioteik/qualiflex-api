module.exports = {
  apps: [
    {
      name: "shipments",
      script: "schedules/sync-shipments.ts",
      interpreter: "ts-node",
      interpreter_args: "--transpile-only",
      cron_restart: "*/1 * * * *",
      autorestart: false,
      watch: true,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
