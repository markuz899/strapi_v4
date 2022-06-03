"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::customer.customer";

module.exports = createCoreController(entity, ({ strapi }) => ({
  async create(ctx) {
    const { body } = ctx.request;

    const result = await strapi.service(entity).create(body);
    return result;
  },

  async findRefine(ctx) {
    ctx.query = { ...ctx.query, local: "en" };

    const { data, meta } = await super.find(ctx);

    return { data, meta };
  },

  async findOneRefine(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    const one = await strapi.service(entity).findOne(id, query);
    const sanitizedEntity = await this.sanitizeOutput(one, ctx);

    return this.transformResponse(sanitizedEntity);
  },

  async updateOneRefine(ctx) {
    const { id } = ctx.params;
    const { body } = ctx.request;

    const result = await strapi.service(entity).update(id, body);

    return result;
  },

  async deleteOneRefine(ctx) {
    const { id } = ctx.params;
    const lead = await strapi.service(entity).delete(id);

    const sanitizedEntity = await this.sanitizeOutput(lead, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
