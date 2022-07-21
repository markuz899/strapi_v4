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

      try {
        const data = await strapi.service(entity).find({
          ...ctx.query,
        });

        return data.results;
      } catch (error) {
        strapi.log.error(`Error in find category`, error);
      }
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

      try {
        const data = await strapi.db.query(entity).findOne({ ...ctx.query });
        return data;
      } catch (error) {
        strapi.log.error(`Error in findOne category`, error);
      }
    },
    async findRefine(ctx) {
      ctx.query = { ...ctx.query, local: "en" };

      try {
        const { data, meta } = await super.find(ctx);
        return { data, meta };
      } catch (error) {
        strapi.log.error(`Error in findRefine category`, error);
      }
    },
    async findOneRefine(ctx) {
      const { id } = ctx.params;
      const { query } = ctx;

      try {
        const entity = await strapi
          .service("api::category.category")
          .findOne(id, query);
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

        return this.transformResponse(sanitizedEntity);
      } catch (error) {
        strapi.log.error(`Error in findOneRefine category`, error);
      }
    },
  })
);
