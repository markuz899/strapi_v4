"use strict";

/**
 *  type controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::type.type", ({ strapi }) => ({
  async find(ctx) {
    const entity = "api::type.type";
    const { params } = ctx;
    const store = params.store;
    if (!store) return {};

    const data = await strapi.service(entity).find({
      ...ctx.query,
    });

    return data.results;
  },
}));
