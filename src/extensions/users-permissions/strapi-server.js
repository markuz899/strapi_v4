const crypto = require("crypto");
const _ = require("lodash");
const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = (plugin) => {
  plugin.controllers.user.login = async (ctx) => {
    console.log("login service");
  };

  plugin.routes["content-api"].routes.push({
    method: "POST",
    path: "/:store/auth/local",
    handler: "user.login",
    config: {
      prefix: "",
    },
  });

  return plugin;
};
