"use strict";

/**
 *  vehicle controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::store.store";

module.exports = createCoreController("api::store.store", ({ strapi }) => ({
  async find(ctx) {
    // some custom logic here
    ctx.query = { ...ctx.query, local: "en" };

    // some more custom logic
    meta.date = Date.now();

    try {
      // Calling the default core action
      const { data, meta } = await super.find(ctx);
      return { data, meta };
    } catch (error) {
      strapi.log.error("Error in find store", error);
    }
  },
  async findOneRefine(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    try {
      const lead = await strapi.service(entity).findOne(id, query);
      const sanitizedEntity = await this.sanitizeOutput(lead, ctx);

      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      strapi.log.error("Error in findOneRefine store", error);
    }
  },
  async findOne(ctx) {
    const { store } = ctx.params;
    const { query } = ctx;

    let querys = {
      ...query,
      where: {
        name: {
          $eq: store,
        },
      },
      populate: ["logo"],
    };

    try {
      const stores = await strapi.db.query(entity).findOne(querys);

      return stores;
    } catch (error) {
      strapi.log.error("Error in findOne store", error);
    }
  },
}));
