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

    try {
      const { data, meta } = await super.find(ctx);

      return { data, meta };
    } catch (error) {
      strapi.log.error("Error in findRefine opportunity", error);
    }
  },

  async findOneRefine(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    try {
      const opp = await strapi.service(entity).findOne(id, query);
      const sanitizedEntity = await this.sanitizeOutput(opp, ctx);

      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      strapi.log.error("Error in findOneRefine opportunity", error);
    }
  },

  async updateOneRefine(ctx) {
    const { id } = ctx.params;
    const { body } = ctx.request;

    try {
      const opportunity = await strapi.service(entity).findOne(id, {
        populate: ["store", "vehicle", "users_sales", "lead"],
      });

      const result = await strapi.service(entity).update(id, body);
      await strapi.service(entityLead).update(opportunity.lead.id, {
        data: {
          status: body.data.status,
        },
      });
      strapi.log.debug(`Opportunity update from cmr`);
      return result;
    } catch (err) {
      strapi.log.error(
        `Error in update opportunity id ${opportunity.id} - ${err}`
      );
    }
  },

  async deleteOneRefine(ctx) {
    const { id } = ctx.params;

    try {
      const opportunity = await strapi.service(entity).findOne(id, {
        populate: ["store", "vehicle", "users_sales", "lead"],
      });
      await strapi.service(entityLead).update(opportunity.lead.id, {
        data: {
          users_sales: null,
          status: "close-negative",
        },
      });

      const del = await strapi.service(entity).delete(id);
      const sanitizedEntity = await this.sanitizeOutput(del, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (err) {
      strapi.log.error(
        `Error in delete opportunity id ${opportunity.id} - ${err}`
      );
    }
  },
}));
