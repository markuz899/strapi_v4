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

    try {
      const data = await strapi.service(entity).find({
        ...ctx.query,
      });

      return data.results;
    } catch (error) {
      strapi.log.error("Error in find type", error);
    }
  },
  async findRefine(ctx) {
    ctx.query = { ...ctx.query, local: "en" };

    try {
      const { data, meta } = await super.find(ctx);

      return { data, meta };
    } catch (error) {
      strapi.log.error("Error in findRefine type", error);
    }
  },
}));
