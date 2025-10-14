module.exports = {
    apps: [
      {
        name: "payment-server",
        script: "./server.js",
        instances: "max",
        exec_mode: "cluster",
        watch: false,
        max_memory_restart: "14G",
        env: {
          NODE_ENV: "production",
        }
      }
    ]
  };