module.exports = {
  apps: [{
    name: "API-FABLAB",
    script: "./app.js",
    "watch": true,
    ignore_watch: ["node_modules", "out"],
    env_production: {
      NODE_ENV: "production"
    },
    env_development: {
      NODE_ENV: "development"
    },
    "max_memory_restart": "4G",
    "autorestart": true
  }]
}