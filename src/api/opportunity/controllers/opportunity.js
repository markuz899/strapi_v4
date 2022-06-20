"use strict";

/**
 *  opportunity controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::opportunity.opportunity";
const entityLead = "api::lead.lead";

module.exports = createCoreController(entity, ({ strapi }) => ({
  async createRefine(ctx) {},

  async findRefine(ctx) {
    const isAdmin = ctx.state?.user?.isSuperAdmin || ctx.state?.user?.isAdmin;

    if (isAdmin) {
      ctx.query = { ...ctx.query };
    } else {
      ctx.query = {
        ...ctx.query,
        filters: {
          ...ctx?.query?.filters,
          users_sales: {
            email: {
              $eq: ctx.state?.user?.email,
            },
          },
        },
      };
    }

    const { data, meta } = await super.find(ctx);

    return { data, meta };
  },

  async findOneRefine(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    const opp = await strapi.service(entity).findOne(id, query);
    const sanitizedEntity = await this.sanitizeOutput(opp, ctx);

    return this.transformResponse(sanitizedEntity);
  },

  async updateOneRefine(ctx) {
    const { id } = ctx.params;
    const { body } = ctx.request;

    let status = {
      open: "created",
      contacted: "progress",
      close: "close",
    };

    const opportunity = await strapi.service(entity).findOne(id, {
      populate: ["store", "vehicle", "users_sales", "lead"],
    });

    const result = await strapi.service(entity).update(id, body);

    try {
      await strapi.service(entityLead).update(opportunity.lead.id, {
        data: {
          status: status[body.data.status],
        },
      });

      return result;
    } catch (err) {
      console.log("error");
    }
  },

  async deleteOneRefine(ctx) {
    const { id } = ctx.params;

    const opportunity = await strapi.service(entity).findOne(id, {
      populate: ["store", "vehicle", "users_sales", "lead"],
    });

    try {
      await strapi.service(entityLead).update(opportunity.lead.id, {
        data: {
          users_sales: null,
          status: "close",
        },
      });

      const del = await strapi.service(entity).delete(id);
      const sanitizedEntity = await this.sanitizeOutput(del, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (err) {
      console.log("error");
    }
  },
}));
