// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "pinnacle-frontend", // Your application name
      script: "./.next/standalone/server.js", // Path to the standalone server
      instances: "max", // Run as many instances as CPU cores
      exec_mode: "cluster", // Use cluster mode for load balancing across cores
      // Optional: Log files for PM2
      error_file: "/var/log/pm2/pinnacle-frontend-err.log",
      out_file: "/var/log/pm2/pinnacle-frontend-out.log",
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        // Environment variables needed at runtime for your Next.js app
      },
      max_memory_restart: "1G", // Set max memory to 1GB
    },
  ],
};