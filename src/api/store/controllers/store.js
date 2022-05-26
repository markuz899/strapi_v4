"use strict";

/**
 *  vehicle controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::store.store";

module.exports = createCoreController("api::store.store", ({ strapi }) => ({
  async find(ctx) {
    // some custom logic here
    ctx.query = { ...ctx.query, local: "en" };

    // Calling the default core action
    const { data, meta } = await super.find(ctx);

    // some more custom logic
    meta.date = Date.now();

    return { data, meta };
  },
}));
