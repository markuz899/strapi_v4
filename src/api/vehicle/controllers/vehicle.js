"use strict";

/**
 *  vehicle controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::vehicle.vehicle";

module.exports = createCoreController("api::vehicle.vehicle", ({ strapi }) => ({
  async queryFilters(qs) {
    function isNumeric(val) {
      return /^-?\d+$/.test(val);
    }
    let query = {
      category: {
        name: {
          $eq: qs.category,
        },
      },
      make: {
        name: {
          $eq: qs.make && qs.make.includes(",") ? qs.make.split(",") : qs.make,
        },
      },
      model: {
        $eq: qs.model,
      },
      price: {
        $gte: qs.price_gte,
        $lte: qs.price_lte,
      },
      type: {
        slug: {
          $eq: qs.type && qs.type.includes(",") ? qs.type.split(",") : qs.type,
        },
      },
      powerSupply: {
        $eq: qs.motor,
      },
    };
    return query;
  },

  async find(ctx) {
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
      sort: [query._sort],
      populate: ["store", "category", "make", "type", "image"],
    };

    const data = await strapi.service(entity).find({
      ...ctx.query,
    });

    let compose = data.results.map((el) => ({
      ...el,
      optionals: el.optionals ? el.optionals.split(";") : [],
      make: el.make ? el.make.name : null,
      type: el.type ? el.type.name : null,
      category: el.category ? el.category.name : null,
      store: el.store ? el.store.name : null,
    }));

    return compose;
  },

  async findOne(ctx) {
    const { make, model, slug, store } = ctx.params;
    if (!make || !model || !slug) return;

    ctx.query = {
      where: {
        store: {
          name: {
            $eq: store,
          },
        },
        make: {
          name: {
            $eq: make,
          },
        },
        model: {
          $eq: model,
        },
        slug: {
          $eq: slug,
        },
      },
      populate: ["store", "category", "make", "type", "image"],
    };
    const data = await strapi.db.query(entity).findOne({ ...ctx.query });

    let compose = {
      ...data,
      make: data.make ? data.make.name : "",
      type: data.type ? data.type.name : "",
      category: data.category ? data.category.name : "",
      store: data.store ? data.store.name : "",
    };

    return compose;
  },

  async findMake(ctx) {
    const { make, store } = ctx.params;
    if (!make) return;

    ctx.query = {
      filters: {
        store: {
          name: {
            $eq: store,
          },
        },
        make: {
          name: {
            $eq: make,
          },
        },
      },
      populate: ["store", "category", "make", "type", "image"],
    };

    const data = await strapi.service(entity).find({
      ...ctx.query,
    });

    let compose = data.results.map((el) => ({
      ...el,
      optionals: el.optionals ? el.optionals.split(";") : [],
      make: el.make ? el.make.name : null,
      type: el.type ? el.type.name : null,
      category: el.category ? el.category.name : null,
      store: el.store ? el.store.name : null,
    }));

    return compose;
  },

  async findMakeModel(ctx) {
    const { make, model, store } = ctx.params;
    if (!make || !model || !store) return;

    ctx.query = {
      filters: {
        store: {
          name: {
            $eq: store,
          },
        },
        make: {
          name: {
            $eq: make,
          },
        },
        model: {
          $eq: model,
        },
      },
      populate: ["store", "category", "make", "type", "image"],
    };

    const data = await strapi.service(entity).find({
      ...ctx.query,
    });

    let compose = data.results.map((el) => ({
      ...el,
      optionals: el.optionals ? el.optionals.split(";") : [],
      make: el.make ? el.make.name : null,
      type: el.type ? el.type.name : null,
      category: el.category ? el.category.name : null,
      store: el.store ? el.store.name : null,
    }));

    return compose;
  },
  async findRefine(ctx) {
    ctx.query = { ...ctx.query, local: "en" };

    const { data, meta } = await super.find(ctx);

    return { data, meta };
  },
  async findOneRefine(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    const entity = await strapi
      .service("api::vehicle.vehicle")
      .findOne(id, query);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },
  async createOneRefine(ctx) {
    const { body } = ctx.request;

    if (body.title === "") return;
    const result = await strapi.service("api::vehicle.vehicle").create(body);
    return result;
  },
  async updateOneRefine(ctx) {
    const { id } = ctx.params;
    const { body } = ctx.request;

    const result = await strapi
      .service("api::vehicle.vehicle")
      .update(id, body);

    return result;
  },
  async deleteOneRefine(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.service("api::vehicle.vehicle").delete(id);

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
