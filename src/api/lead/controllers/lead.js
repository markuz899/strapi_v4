"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::lead.lead";
const opportunitieEntity = "api::opportunity.opportunity";
const notificationEntity = "api::notification.notification";

module.exports = createCoreController(entity, ({ strapi }) => ({
  async create(ctx) {
    const storeName = ctx.params.store;

    const { body } = ctx.request;

    if (!body) {
      throw new Error("Invalid body");
    }

    //take id from storeName
    const stores = await strapi.service("api::store.store").find();
    const currentStore = stores?.results?.find((el) => el.name === storeName);

    //sales selected
    let userSalesSelected = null;

    //take user sales
    ctx.query = {
      filters: {
        isSales: {
          $eq: true,
        },
        store: {
          name: {
            $eq: currentStore.name,
          },
        },
      },
      populate: ["role", "opportunities", "store"],
    };
    const users = await strapi.entityService.findMany(
      "plugin::users-permissions.user",
      ctx.query
    );

    //add user sales selected logic
    let targets = users?.filter((el) => el?.opportunities?.length < 10);
    if (targets.length) {
      userSalesSelected = targets[0];
    } else {
      userSalesSelected = users[0];
    }

    try {
      let lead = await strapi.service(entity).create({
        data: {
          ...body,
          store: currentStore?.id || null,
          users_sales: userSalesSelected ? userSalesSelected.id : null,
          publishedAt: new Date(),
        },
      });

      // create an opportunity from lead
      await strapi.service(opportunitieEntity).create({
        data: {
          ...body,
          store: currentStore?.id || null,
          users_sales: userSalesSelected ? userSalesSelected.id : null,
          lead: lead.id,
          publishedAt: new Date(),
        },
      });
      // create a notification from lead
      await strapi.service(notificationEntity).create({
        data: {
          text: "Ti è stata assegnata una lead",
          users_sales: userSalesSelected ? userSalesSelected.id : null,
          store: currentStore?.id || null,
          lead: lead.id || null,
          link: lead.id || null,
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
        store: currentStore?.id || null,
        users_sales: "",
        publishedAt: new Date(),
      },
    });
    return result;
  },

  async findRefine(ctx) {
    ctx.query = { ...ctx.query };
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

    //take id from storeName
    const stores = await strapi.service("api::store.store").find();
    const currentStore = stores?.results?.find(
      (el) => el.id === body.data?.store?.id
    );

    //sales selected
    let userSalesSelected = null;

    //take user sales
    ctx.query = {
      filters: {
        isSales: {
          $eq: true,
        },
        store: {
          name: {
            $eq: currentStore.name,
          },
        },
      },
      populate: ["role", "opportunities", "store"],
    };
    const users = await strapi.entityService.findMany(
      "plugin::users-permissions.user",
      ctx.query
    );

    //add user sales selected logic
    let targets = users?.filter((el) => el?.opportunities?.length < 10);
    if (targets.length) {
      userSalesSelected = targets[0];
    } else {
      userSalesSelected = users[0];
    }

    const currentLead = await strapi.service(entity).findOne(id, {
      populate: ["opportunity"],
    });

    const editLead = await strapi.service(entity).update(id, {
      data: {
        ...body.data,
        store: currentStore?.id || null,
      },
    });

    if (currentLead?.opportunity?.id) {
      // update the opportunity relation
      const status = {
        created: "open",
        progress: "contacted",
        close: "close",
      };
      await strapi
        .service(opportunitieEntity)
        .update(currentLead?.opportunity?.id, {
          data: {
            ...body.data,
            lead: id,
            status: status[body.data.status] || "open",
            // vehicles: body.data.vehicle_list || [],
          },
        });
    }

    return editLead;
  },

  async deleteOneRefine(ctx) {
    const { id } = ctx.params;
    const lead = await strapi.service(entity).delete(id);

    const sanitizedEntity = await this.sanitizeOutput(lead, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
