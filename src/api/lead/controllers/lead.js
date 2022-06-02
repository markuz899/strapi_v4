const entity = "api::lead.lead";

module.exports = {
  async create(ctx) {
    const storeName = ctx.params.store;

    const { body } = ctx.request;

    if (!body) {
      throw new Error("Invalid body");
    }

    //take id from storeName
    const stores = await strapi.service("api::store.store").find();
    const currentStore = stores?.results?.find((el) => el.name === storeName);

    try {
      await strapi.service(entity).create({
        data: {
          ...body,
          store: currentStore?.id || null,
          publishedAt: new Date(),
        },
      });
    } catch (err) {
      throw new Error(err);
    }

    return {
      status: true,
    };
  },

  async findRefine(ctx) {
    ctx.query = { ...ctx.query, populate: ["store"] };
    let data = {};
    let meta = {};
    const lead = await strapi.service(entity).find({ ...ctx.query });

    if (lead) {
      data = lead?.results;
      meta = { pagination: lead?.pagination };
    }
    return { data, meta };
  },

  async findOneRefine(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    const lead = await strapi.service(entity).findOne(id, query);
    const sanitizedEntity = await this.sanitizeOutput(lead, ctx);

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
};
