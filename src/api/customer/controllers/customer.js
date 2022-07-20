"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::customer.customer";

module.exports = createCoreController(entity, ({ strapi }) => ({
  async create(ctx) {
    const { body } = ctx.request;

    try {
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
    } catch (error) {
      strapi.log.error(`Error in create customer`, error);
    }
  },

  async findRefine(ctx) {
    ctx.query = { ...ctx.query, local: "en" };

    try {
      const { data, meta } = await super.find(ctx);
      return { data, meta };
    } catch (error) {
      strapi.log.error(`Error in findRefine customer`, error);
    }
  },

  async findOneRefine(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    try {
      const one = await strapi.service(entity).findOne(id, query);
      const sanitizedEntity = await this.sanitizeOutput(one, ctx);

      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      strapi.log.error(`Error in findOneRefine customer`, error);
    }
  },

  async updateOneRefine(ctx) {
    const { id } = ctx.params;
    const { body } = ctx.request;

    try {
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
    } catch (error) {
      strapi.log.error(`Error in updateOneRefine customer`, error);
    }
  },

  async deleteOneRefine(ctx) {
    const { id } = ctx.params;

    try {
      const lead = await strapi.service(entity).delete(id);

      const sanitizedEntity = await this.sanitizeOutput(lead, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      strapi.log.error(`Error in deleteOneRefine customer`, error);
    }
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

    try {
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
    } catch (error) {
      strapi.log.error(`Error in createCustomer customer`, error);
    }
  },
}));
