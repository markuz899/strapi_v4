"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::lead.lead";
const opportunitieEntity = "api::opportunity.opportunity";
const notificationEntity = "api::notification.notification";
const { assignOpportunities } = require("./");

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
    let userSalesSelected = await assignOpportunities(
      ctx,
      strapi,
      currentStore
    );

    //////////////////////////////////////START MAGIC///////////////////////////////////////////////

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
          text: `Ti è stata assegnata una lead con email ${lead.email}`,
          users_sales: userSalesSelected ? userSalesSelected.id : null,
          store: currentStore?.id || null,
          lead: lead.id || null,
          link: lead.id || null,
          publishedAt: new Date(),
        },
      });
      strapi.log.debug(`Lead created from portal - ${lead.id}`);
    } catch (err) {
      strapi.log.error(`Error in create lead`);
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
    strapi.log.debug(`Lead created from cmr - ${result.id}`);
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

    const currentLead = await strapi.service(entity).findOne(id, {
      populate: ["opportunity"],
    });

    const editLead = await strapi.service(entity).update(id, {
      data: {
        ...body.data,
        store: currentStore?.id || null,
      },
    });

    if (body?.data?.users_sales?.id) {
      // check if opportunity exist
      let query = {
        populate: ["lead", "users_sales"],
        where: {
          lead: {
            id: {
              $eq: id,
            },
          },
        },
      };
      const currentOpportunity = await strapi.db
        .query(opportunitieEntity)
        .findOne(query);

      if (currentOpportunity) {
        // update the opportunity relation
        await strapi
          .service(opportunitieEntity)
          .update(currentLead?.opportunity?.id, {
            data: {
              ...body.data,
              lead: id,
              users_sales: body?.data?.users_sales?.id,
              // vehicles: body.data.vehicle_list || [],
            },
          });
      } else {
        // create an opportunity from lead
        await strapi.service(opportunitieEntity).create({
          data: {
            ...body.data,
            lead: id,
            store: currentStore?.id || null,
            publishedAt: new Date(),
          },
        });
      }
    }

    strapi.log.debug(`Lead update from cmr - ${editLead.id}`);
    return editLead;
  },

  async deleteOneRefine(ctx) {
    const { id } = ctx.params;
    const lead = await strapi.service(entity).delete(id);

    const sanitizedEntity = await this.sanitizeOutput(lead, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
