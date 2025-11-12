module.exports = {
  apps: [
    {
      name: "payment-server",
      script: "./server.js",  // or "./src/index.js" if that's your entry point
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "14G",
      env: {
        NODE_ENV: "production",
        TZ: "Asia/Kolkata"  // Add this line
      }
    }
  ]
};