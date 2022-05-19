"use strict";

/**
 *  make controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::make.make", ({ strapi }) => ({
  async find(ctx) {
    const entity = "api::make.make";
    const { params } = ctx;
    const store = params.store;
    if (!store) return {};

    const data = await strapi.service(entity).find({
      ...ctx.query,
    });

    return data.results;
  },
}));
