"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::notification.notification";

module.exports = createCoreController(entity, ({ strapi }) => ({
  async createRefine(ctx) {
    const { body } = ctx.request;

    //take id from storeName
    const stores = await strapi.service("api::store.store").find();
    const currentStore = stores?.results?.find(
      (el) => el.id === body.data.store
    );

    const result = await strapi.service(entity).create({
      data: {
        ...body.data,
        stores: currentStore?.id || null,
        publishedAt: new Date(),
      },
    });
    return result;
  },

  async findRefine(ctx) {
    const isAdmin = ctx.state?.user?.isAdmin;

    if (isAdmin) {
      ctx.query = { populate: ["users_sales", "lead"] };
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

    const one = await strapi.service(entity).findOne(id, query);
    const sanitizedEntity = await this.sanitizeOutput(one, ctx);

    return this.transformResponse(sanitizedEntity);
  },

  async updateOneRefine(ctx) {
    const { id } = ctx.params;
    const { body } = ctx.request;

    //take id from storeName
    const stores = await strapi.service("api::store.store").find();
    const currentStore = stores?.results?.find(
      (el) => el.id === body.data.store
    );

    const result = await strapi.service(entity).update(id, {
      data: {
        ...body.data,
        store: currentStore?.id || null,
        // vehicles: body.data.vehicle_list || [],
      },
    });

    return result;
  },

  async deleteOneRefine(ctx) {
    const { id } = ctx.params;
    const lead = await strapi.service(entity).delete(id);

    const sanitizedEntity = await this.sanitizeOutput(lead, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
