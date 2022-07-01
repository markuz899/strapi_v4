"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::customer.customer";

module.exports = createCoreController(entity, ({ strapi }) => ({
  async create(ctx) {
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

  async createCustomer(ctx) {
    const { body } = ctx.request;

    ctx.query = {
      where: {
        email: {
          $eq: body.email,
        },
      },
      populate: ["*"],
    };

    const one = await strapi.db.query(entity).findOne({ ...ctx.query });

    if (one?.id) {
      return {
        status: "404",
        message: "Il cliente esiste",
      };
    }

    const payload = {
      name: body.firstname,
      surname: body.lastname,
      email: body.email,
      telephone: body.telephone,
      city: body.city,
      province: body.province,
      vehicles: body.vehicle?.id,
      store: body.store?.id,
    };
    // take id from storeName
    const stores = await strapi.service("api::store.store").find();
    const currentStore = stores?.results?.find(
      (el) => el.id === body?.store?.id
    );

    const result = await strapi.service(entity).create({
      data: {
        ...payload,
        stores: currentStore?.id || null,
        publishedAt: new Date(),
      },
    });
    return result;
  },
}));
