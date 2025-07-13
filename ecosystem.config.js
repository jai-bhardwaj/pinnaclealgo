// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "pinnacle-algo", // Match the name in the deployment workflow
      script: "npm", // Use npm to run the start script
      args: "run start", // Run the start script from package.json
      instances: "max", // Run as many instances as CPU cores
      exec_mode: "cluster", // Use cluster mode for load balancing across cores
      // Optional: Log files for PM2
      error_file: "/var/log/pm2/pinnacle-algo-err.log",
      out_file: "/var/log/pm2/pinnacle-algo-out.log",
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        // Environment variables will be set by the deployment process
      },
      max_memory_restart: "1G", // Set max memory to 1GB
      cwd: "/opt/pinnacle-algo", // Set the working directory
    },
  ],
};