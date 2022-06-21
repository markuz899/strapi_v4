const crypto = require("crypto");
const _ = require("lodash");
const utils = require("@strapi/utils");
const { getService } = require("@strapi/plugin-users-permissions/server/utils");
const {
  validateCreateUserBody,
  validateUpdateUserBody,
} = require("@strapi/plugin-users-permissions/server/controllers/validation/user");
const {
  validateCallbackBody,
  validateRegisterBody,
  validateSendEmailConfirmationBody,
} = require("@strapi/plugin-users-permissions/server/controllers/validation/auth");
const { env } = require("process");
const { getAbsoluteAdminUrl, getAbsoluteServerUrl, sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");

  return sanitize.contentAPI.output(user, userSchema, { auth });
};
const sanitizeOutput = (user) => {
  const { password, resetPasswordToken, confirmationToken, ...sanitizedUser } =
    user;
  return sanitizedUser;
};

const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

module.exports = (plugin) => {
  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized();
    }

    const userState = ctx.state.user;
    const storeName = ctx.params.store;
    const provider = ctx.params.provider || "local";
    const query = { provider };
    query.email = userState.email.toLowerCase();

    ctx.query = {
      where: {
        ...query,
        store: {
          name: {
            $eq: storeName,
          },
        },
      },
      populate: ["wishlists", "role", "store"],
    };

    // Check if the user exists.
    const user = await strapi.query("plugin::users-permissions.user").findOne({
      ...ctx.query,
    });

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    // ctx.send({
    //   jwt: getService("jwt").issue({
    //     id: user.id,
    //   }),
    //   user: await sanitizeUser(user, ctx),
    // });
    ctx.send(user);
  };

  plugin.controllers.user.find = async (ctx) => {
    const users = await strapi.entityService.findMany(
      "plugin::users-permissions.user",
      { ...ctx.params, ...ctx.query, populate: ["role", "store", "wishlists"] }
    );

    ctx.body = users.map((user) => sanitizeOutput(user));
  };

  plugin.controllers.user.login = async (ctx) => {
    const storeName = ctx.params.store;
    const provider = ctx.params.provider || "local";
    const params = ctx.request.body;

    if (!storeName) {
      throw new ApplicationError("Without store no login");
    }

    const store = strapi.store({ type: "plugin", name: "users-permissions" });

    if (provider === "local") {
      if (!_.get(await store.get({ key: "grant" }), "email.enabled")) {
        throw new ApplicationError("This provider is disabled");
      }

      await validateCallbackBody(params);

      const query = { provider };

      // Check if the provided identifier is an email or not.
      const isEmail = emailRegExp.test(params.identifier);

      // Set the identifier to the appropriate query field.
      if (isEmail) {
        query.email = params.identifier.toLowerCase();
      } else {
        query.username = params.identifier;
      }

      ctx.query = {
        where: {
          ...query,
          store: {
            name: {
              $eq: storeName,
            },
          },
        },
        populate: ["store", "wishlists"],
      };

      // Check if the user exists.
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          ...ctx.query,
        });

      if (!user) {
        throw new ValidationError("Invalid identifier or password");
      }

      if (
        _.get(await store.get({ key: "advanced" }), "email_confirmation") &&
        user.confirmed !== true
      ) {
        throw new ApplicationError("Your account email is not confirmed");
      }

      if (user.blocked === true) {
        throw new ApplicationError(
          "Your account has been blocked by an administrator"
        );
      }

      // The user never authenticated with the `local` provider.
      if (!user.password) {
        throw new ApplicationError(
          "This user never set a local password, please login with the provider used during account creation"
        );
      }

      const validPassword = await getService("user").validatePassword(
        params.password,
        user.password
      );

      if (!validPassword) {
        throw new ValidationError("Invalid identifier or password");
      } else {
        ctx.send({
          jwt: getService("jwt").issue({
            id: user.id,
          }),
          user: await sanitizeUser(user, ctx),
        });
      }
    } else {
      if (!_.get(await store.get({ key: "grant" }), [provider, "enabled"])) {
        throw new ApplicationError("This provider is disabled");
      }

      // Connect the user with the third-party provider.
      try {
        const user = await getService("providers").connect(provider, ctx.query);
        ctx.send({
          jwt: getService("jwt").issue({ id: user.id }),
          user: await sanitizeUser(user, ctx),
        });
      } catch (error) {
        throw new ApplicationError(error.message);
      }
    }
  };

  plugin.controllers.user.register = async (ctx) => {
    const storeName = ctx.params.store;

    const pluginStore = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });

    const settings = await pluginStore.get({
      key: "advanced",
    });

    // Check if the storeName exist and return entity
    const entityStore = await strapi.query("api::store.store").findOne({
      where: { name: storeName },
    });

    if (!settings.allow_register) {
      throw new ApplicationError("Register action is currently disabled");
    }

    const params = {
      ..._.omit(ctx.request.body, [
        "confirmed",
        "confirmationToken",
        "resetPasswordToken",
      ]),
      provider: "local",
    };

    if (storeName && entityStore) {
      params.store = entityStore.id;
    } else {
      throw new ApplicationError("No valid store");
    }

    await validateRegisterBody(params);

    // Throw an error if the password selected by the user
    // contains more than three times the symbol '$'.
    if (getService("user").isHashed(params.password)) {
      throw new ValidationError(
        "Your password cannot contain more than three times the symbol `$`"
      );
    }

    const role = await strapi
      .query("plugin::users-permissions.role")
      .findOne({ where: { type: settings.default_role } });

    if (!role) {
      throw new ApplicationError("Impossible to find the default role");
    }

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      throw new ValidationError("Please provide a valid email address");
    }

    params.role = role.id;

    ctx.query = {
      where: {
        email: params.email,
        store: {
          name: {
            $eq: storeName,
          },
        },
      },
      populate: ["store"],
    };

    // Check if the user exists.
    const user = await strapi.query("plugin::users-permissions.user").findOne({
      ...ctx.query,
    });

    if (user && user.provider === params.provider) {
      throw new ApplicationError("Email is already taken");
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      throw new ApplicationError("Email is already taken");
    }

    try {
      if (!settings.email_confirmation) {
        params.confirmed = true;
      }

      const user = await getService("user").add(params);
      const sanitizedUser = await sanitizeUser(user, ctx);
      if (settings.email_confirmation) {
        try {
          await getService("user").sendConfirmationEmail(sanitizedUser);
        } catch (err) {
          throw new ApplicationError(err.message);
        }

        return ctx.send({ user: sanitizedUser });
      }

      const jwt = getService("jwt").issue(_.pick(user, ["id"]));

      return ctx.send({
        jwt,
        user: sanitizedUser,
      });
    } catch (err) {
      if (_.includes(err.message, "username")) {
        throw new ApplicationError("Username already taken");
      } else if (_.includes(err.message, "email")) {
        throw new ApplicationError("Email already taken");
      } else {
        strapi.log.error(err);
        throw new ApplicationError("An error occurred during account creation");
      }
    }
  };

  plugin.controllers.user.forgotPassword = async (ctx) => {
    const storeName = ctx.params.store;
    let { email } = ctx.request.body;
    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(email);

    if (isEmail) {
      email = email.toLowerCase();
    } else {
      throw new ValidationError("Please provide a valid email address");
    }

    const pluginStore = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });

    // Find the user by email.
    const user = await strapi.query("plugin::users-permissions.user").findOne({
      where: {
        email: email.toLowerCase(),
        store: {
          name: {
            $eq: storeName,
          },
        },
      },
    });

    // User not found.
    if (!user) {
      throw new ApplicationError("This email does not exist");
    }

    // User blocked
    if (user.blocked) {
      throw new ApplicationError("This user is disabled");
    }

    // Generate random token.
    const resetPasswordToken = crypto.randomBytes(64).toString("hex");

    const settings = await pluginStore
      .get({ key: "email" })
      .then((storeEmail) => {
        try {
          return storeEmail["reset_password"].options;
        } catch (error) {
          return {};
        }
      });

    const advanced = await pluginStore.get({
      key: "advanced",
    });

    const userInfo = await sanitizeUser(user, ctx);

    settings.message = await getService("users-permissions").template(
      settings.message,
      {
        URL: advanced.email_reset_password,
        SERVER_URL: getAbsoluteServerUrl(strapi.config),
        ADMIN_URL: getAbsoluteAdminUrl(strapi.config),
        USER: userInfo,
        TOKEN: resetPasswordToken,
      }
    );

    settings.object = await getService("users-permissions").template(
      settings.object,
      {
        USER: userInfo,
      }
    );

    try {
      // Send an email to the user.
      await strapi
        .plugin("email")
        .service("email")
        .send({
          to: user.email,
          from:
            settings.from.email || settings.from.name
              ? `${settings.from.name} <${process.env.SEND_GRID_DEFAULT_FROM}>`
              : undefined,
          replyTo: settings.response_email,
          subject: settings.object,
          text: settings.message,
          html: settings.message,
        });
    } catch (err) {
      throw new ApplicationError(err.message);
    }

    // Update the user.
    await strapi
      .query("plugin::users-permissions.user")
      .update({ where: { id: user.id }, data: { resetPasswordToken } });

    ctx.send({ ok: true });
  };

  plugin.controllers.user.resetPassword = async (ctx) => {
    const storeName = ctx.params.store;
    const params = _.assign({}, ctx.request.body, ctx.params);

    if (
      params.password &&
      params.passwordConfirmation &&
      params.password === params.passwordConfirmation &&
      params.code
    ) {
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: {
            resetPasswordToken: `${params.code}`,
            store: {
              name: {
                $eq: storeName,
              },
            },
          },
        });

      if (!user) {
        throw new ValidationError("Incorrect code provided");
      }

      await getService("user").edit(user.id, {
        resetPasswordToken: null,
        password: params.password,
      });
      // Update the user.
      ctx.send({
        jwt: getService("jwt").issue({ id: user.id }),
        user: await sanitizeUser(user, ctx),
      });
    } else if (
      params.password &&
      params.passwordConfirmation &&
      params.password !== params.passwordConfirmation
    ) {
      throw new ValidationError("Passwords do not match");
    } else {
      throw new ValidationError("Incorrect params provided");
    }
  };

  plugin.controllers.user.update = async (ctx) => {
    const storeName = ctx.params.store;
    const userState = ctx.state.user;
    const advancedConfigs = await strapi
      .store({ type: "plugin", name: "users-permissions", key: "advanced" })
      .get();

    const { id } = ctx.params;
    const { email, username, password } = ctx.request.body;

    const user = await strapi.query("plugin::users-permissions.user").findOne({
      where: {
        email: userState.email,
        store: {
          name: {
            $eq: storeName,
          },
        },
      },
    });

    await validateUpdateUserBody(ctx.request.body);

    if (
      user.provider === "local" &&
      _.has(ctx.request.body, "password") &&
      !password
    ) {
      throw new ValidationError("password.notNull");
    }

    if (_.has(ctx.request.body, "username")) {
      const userWithSameUsername = await strapi
        .query("plugin::users-permissions.user")
        .findOne({ where: { username } });

      if (userWithSameUsername && userWithSameUsername.id != id) {
        throw new ApplicationError("Username already taken");
      }
    }

    if (_.has(ctx.request.body, "email") && advancedConfigs.unique_email) {
      const userWithSameEmail = await strapi
        .query("plugin::users-permissions.user")
        .findOne({ where: { email: email.toLowerCase() } });

      if (userWithSameEmail && userWithSameEmail.id != id) {
        throw new ApplicationError("Email already taken");
      }
      ctx.request.body.email = ctx.request.body.email.toLowerCase();
    }

    let updateData = {
      ...ctx.request.body,
    };

    const data = await getService("user").edit(user.id, updateData);
    const sanitizedData = await sanitizeOutput(data, ctx);

    ctx.send(sanitizedData);
  };

  plugin.controllers.user.forgotPassword = async (ctx) => {
    let { email } = ctx.request.body;
    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(email);

    if (isEmail) {
      email = email.toLowerCase();
    } else {
      throw new ValidationError("Please provide a valid email address");
    }

    const pluginStore = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });

    // Find the user by email.
    const user = await strapi.query("plugin::users-permissions.user").findOne({
      where: {
        email: email.toLowerCase(),
      },
    });

    // User not found.
    if (!user) {
      throw new ApplicationError("This email does not exist");
    }

    // User blocked
    if (user.blocked) {
      throw new ApplicationError("This user is disabled");
    }

    // Generate random token.
    const resetPasswordToken = crypto.randomBytes(64).toString("hex");

    const settings = await pluginStore
      .get({ key: "email" })
      .then((storeEmail) => {
        try {
          return storeEmail["reset_password"].options;
        } catch (error) {
          return {};
        }
      });

    const advanced = await pluginStore.get({
      key: "advanced",
    });

    const userInfo = await sanitizeUser(user, ctx);

    settings.message = await getService("users-permissions").template(
      settings.message,
      {
        URL: advanced.email_reset_password,
        SERVER_URL: getAbsoluteServerUrl(strapi.config),
        ADMIN_URL: getAbsoluteAdminUrl(strapi.config),
        USER: userInfo,
        TOKEN: resetPasswordToken,
      }
    );

    settings.object = await getService("users-permissions").template(
      settings.object,
      {
        USER: userInfo,
      }
    );

    try {
      // Send an email to the user.
      await strapi
        .plugin("email")
        .service("email")
        .send({
          // to: user.email,
          to: "marcoliberati.89@gmail.com",
          from:
            settings.from.email || settings.from.name
              ? `${settings.from.name} <${process.env.SEND_GRID_DEFAULT_FROM}>`
              : undefined,
          replyTo: settings.response_email,
          subject: settings.object,
          text: settings.message,
          html: settings.message,
        });
    } catch (err) {
      throw new ApplicationError(err.message);
    }

    // Update the user.
    await strapi
      .query("plugin::users-permissions.user")
      .update({ where: { id: user.id }, data: { resetPasswordToken } });

    ctx.send({ ok: true });
  };

  plugin.controllers.user.resetPassword = async (ctx) => {
    const params = _.assign({}, ctx.request.body, ctx.params);

    if (
      params.password &&
      params.passwordConfirmation &&
      params.password === params.passwordConfirmation &&
      params.code
    ) {
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({
          where: {
            resetPasswordToken: `${params.code}`,
          },
        });

      if (!user) {
        throw new ValidationError("Incorrect code provided");
      }

      await getService("user").edit(user.id, {
        resetPasswordToken: null,
        password: params.password,
      });
      // Update the user.
      ctx.send({
        jwt: getService("jwt").issue({ id: user.id }),
        user: await sanitizeUser(user, ctx),
      });
    } else if (
      params.password &&
      params.passwordConfirmation &&
      params.password !== params.passwordConfirmation
    ) {
      throw new ValidationError("Passwords do not match");
    } else {
      throw new ValidationError("Incorrect params provided");
    }
  };

  plugin.controllers.user.getUserStore = async (ctx) => {
    let data, meta;
    //take user sales
    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        isSales: {
          $eq: true,
        },
      },
      populate: ["role", "opportunities", "store"],
    };
    const users = await strapi.entityService.findMany(
      "plugin::users-permissions.user",
      ctx.query
    );

    data = users;
    meta = { pagination: {} };
    return { data, meta };
  };

  // user routing
  // /:store/auth/local
  plugin.routes["content-api"].routes.push({
    method: "POST",
    path: "/:store/auth/local",
    handler: "user.login",
    config: {
      prefix: "",
    },
  });

  // /:store/users/me
  plugin.routes["content-api"].routes.push({
    method: "GET",
    path: "/:store/users/me",
    handler: "user.me",
    config: {
      prefix: "",
    },
  });

  // /:store/auth/local/register
  plugin.routes["content-api"].routes.push({
    method: "POST",
    path: "/:store/auth/local/register",
    handler: "user.register",
    config: {
      prefix: "",
    },
  });

  // /:store/auth/forgot-password
  plugin.routes["content-api"].routes.push({
    method: "POST",
    path: "/:store/auth/forgot-password",
    handler: "user.forgotPassword",
    config: {
      prefix: "",
    },
  });
  plugin.routes["content-api"].routes.push({
    method: "POST",
    path: "/v1/auth/forgot-password",
    handler: "user.forgotPassword",
    config: {
      prefix: "",
    },
  });

  // /:store/auth/reset-password
  plugin.routes["content-api"].routes.push({
    method: "POST",
    path: "/:store/auth/reset-password",
    handler: "user.resetPassword",
    config: {
      prefix: "",
    },
  });
  plugin.routes["content-api"].routes.push({
    method: "POST",
    path: "/v1/auth/reset-password",
    handler: "user.resetPassword",
    config: {
      prefix: "",
    },
  });

  // /:store/auth/update
  plugin.routes["content-api"].routes.push({
    method: "PUT",
    path: "/:store/users",
    handler: "user.update",
    config: {
      prefix: "",
    },
  });

  // /users/getUserStore
  plugin.routes["content-api"].routes.push({
    method: "GET",
    path: "/v1/users/store",
    handler: "user.getUserStore",
    config: {
      prefix: "",
    },
  });

  return plugin;
};
