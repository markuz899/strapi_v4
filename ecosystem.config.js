module.exports = {
  apps: [
    {
      name: "CMS-Sgasgas-server",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
