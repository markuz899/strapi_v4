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

    try {
      const data = await strapi.service(entity).find({
        ...ctx.query,
      });

      return data.results;
    } catch (error) {
      strapi.log.error("Error in find make", error);
    }
  },
  async findRefine(ctx) {
    ctx.query = { ...ctx.query, local: "en" };

    try {
      const { data, meta } = await super.find(ctx);

      return { data, meta };
    } catch (error) {
      strapi.log.error("Error in findRefine make", error);
    }
  },
  async findOneRefine(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    try {
      const entity = await strapi.service("api::make.make").findOne(id, query);
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      strapi.log.error("Error in findOneRefine make", error);
    }
  },
}));
