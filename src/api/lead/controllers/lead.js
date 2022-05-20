const { getService } = require("@strapi/plugin-users-permissions/server/utils");
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
};
