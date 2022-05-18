"use strict";

/**
 *  vehicle controller
 */

const qs = require("qs");
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::vehicle.vehicle", ({ strapi }) => ({
  async queryFilters(qs) {
    function isNumeric(val) {
      return /^-?\d+$/.test(val);
    }

    let query = {
      make: {
        name: {
          $eq: qs.make,
        },
      },
      model: {
        $eq: qs.model,
      },
      price: {
        $gte: qs.price_gte,
      },
      price: {
        $lte: qs.price_lte,
      },
      type: {
        slug: {
          $eq: qs.type,
        },
      },
    };
    return query;
  },

  async find(ctx) {
    const entity = "api::vehicle.vehicle";
    const { query, params } = ctx;
    const store = params.store;
    if (!store) return {};
    const filters = await this.queryFilters(query);

    ctx.query = {
      filters: {
        ...filters,
        store: {
          name: {
            $eq: store,
          },
        },
      },
      sort: [query.sort],
      populate: ["store", "category", "make", "type"],
    };

    const data = await strapi.service(entity).find({
      ...ctx.query,
    });

    return data.results;
  },
  async findOne(ctx) {
    const entity = "api::vehicle.vehicle";
    const { id } = ctx.params;
    const { query } = ctx;

    const data = await strapi.service(entity).findOne(id, query);
    const sanitizedEntity = await this.sanitizeOutput(data, ctx);

    return this.transformResponse(sanitizedEntity);
  },
}));
