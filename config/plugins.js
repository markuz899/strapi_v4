module.exports = ({ env }) => ({
  email: {
    // config: {
    //   provider: "sendgrid",
    //   providerOptions: {
    //     apiKey: env("SEND_GRID_KEY"),
    //   },
    //   settings: {
    //     defaultFrom: "markuz.89@hotmail.it",
    //     defaultReplyTo: "markuz.89@hotmail.it",
    //     testAddress: "markuz.89@hotmail.it",
    //   },
    // },
    config: {
      provider: "nodemailer",
      providerOptions: {
        service: "gmail",
        host: env("SMTP_HOST", "smtp.google.com"),
        port: env("SMTP_PORT", 587),
        secure: false,
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
