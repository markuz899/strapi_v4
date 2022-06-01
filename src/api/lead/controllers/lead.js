const entity = "api::lead.lead";

module.exports = {
  async create(ctx) {
    const storeName = ctx.params.store;

    const { body } = ctx.request;

    if (!body) {
      throw new Error("Invalid body");
    }

    try {
      await strapi.service(entity).create({
        data: {
          ...body,
          store: storeName,
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
    ctx.query = { ...ctx.query };

    const { data, meta } = await super.find(ctx);

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
