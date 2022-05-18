"use strict";

/**
 * vehicle router.
 */

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::vehicle.vehicle", {
  prefix: "/:store",
  only: ["find", "findOne"],
  except: [],
  config: {
    find: {
      auth: false,
      middlewares: [],
    },
    findOne: {
      auth: false,
      middlewares: [],
    },
    create: {},
    update: {},
    delete: {},
  },
});
