"use strict";

/**
 *  category controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::category.category";

module.exports = createCoreController(
  "api::category.category",
  ({ strapi }) => ({
    async find(ctx) {
      ctx.query = {
        populate: ["vehicles"],
      };

      const data = await strapi.service(entity).find({
        ...ctx.query,
      });

      return data.results;
    },
    async findOne(ctx) {
      const { store, slug } = ctx.params;

      ctx.query = {
        where: {
          slug: {
            $eq: slug,
          },
        },
        populate: ["vehicles"],
      };

      const data = await strapi.db.query(entity).findOne({ ...ctx.query });
      return data;
    },
  })
);
