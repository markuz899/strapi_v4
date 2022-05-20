module.exports = ({ env }) => ({
  email: {
    config: {
      provider: "sendgrid",
      providerOptions: {
        apiKey: env("SEND_GRID_KEY"),
      },
      settings: {
        defaultFrom: "markuz.89@hotmail.it",
        defaultReplyTo: "markuz.89@hotmail.it",
        testAddress: "markuz.89@hotmail.it",
      },
    },
  },
});
