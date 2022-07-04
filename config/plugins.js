module.exports = ({ env }) => ({
  email: {
    // config: {
    //   provider: "sendgrid",
    //   providerOptions: {
    //     apiKey: env("SEND_GRID_KEY"),
    //   },
    //   settings: {
    //     defaultFrom: `SGASGAS - INFO <${env("SEND_GRID_DEFAULT_FROM")}>`,
    //     defaultReplyTo: env("SEND_GRID_DEFAULT_FROM"),
    //     testAddress: env("SEND_GRID_DEFAULT_FROM"),
    //   },
    // },
    config: {
      provider: "nodemailer",
      providerOptions: {
        service: "gmail",
        host: env("SMTP_HOST", "smtp.google.com"),
        port: env("SMTP_PORT", 587),
        auth: {
          type: "OAuth2",
          user: env("EMAIL"),
          clientId: env("CLIENT_ID"),
          clientSecret: env("CLIENT_SECRET"),
          refreshToken: env("REFRESH_TOKEN"),
        },
      },
      settings: {
        defaultFrom: `SGASGAS - INFO <${env("EMAIL")}>`,
        defaultReplyTo: env("EMAIL"),
      },
    },
  },
});
