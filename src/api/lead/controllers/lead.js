"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const entity = "api::lead.lead";
const opportunitieEntity = "api::opportunity.opportunity";
const notificationEntity = "api::notification.notification";
const { assignOpportunities, getPositionFromCity } = require("./");

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

    let lead;
    try {
      let verificationCode = Math.floor(Math.random() * 90000) + 100000;
      let position = await getPositionFromCity(body.city);
      lead = await strapi.service(entity).create({
        data: {
          ...body,
          store: currentStore?.id || null,
          publishedAt: new Date(),
          position,
          verificationCode,
          confirmed: false,
        },
      });

      // send verificationCode to email
      await strapi.plugins["email"].services.email.send({
        to: lead.email,
        from: process.env.defaultFrom,
        subject: "Conferma codice OTP",
        text: `${verificationCode} è il codice di verifica OTP`,
      });

      strapi.log.debug(`Lead created from portal - ${lead.id}`);
    } catch (err) {
      strapi.log.error(`Error in create lead`);
      throw new Error(err);
    }

    return {
      ids: lead.id,
      status: true,
    };
  },

  async confirmLead(ctx) {
    const { id } = ctx.params;
    const { body } = ctx.request;

    //take id from storeName
    const storeName = ctx.params.store;
    const stores = await strapi.service("api::store.store").find();
    const currentStore = stores?.results?.find((el) => el.name === storeName);

    try {
      // get lead from id
      const currentLead = await strapi.service(entity).findOne(id, {
        populate: ["vehicle"],
      });
      // verify verificationCode and confirm lead
      if (currentLead.verificationCode === body.verificationCode) {
        //////////////////////////////////////START MAGIC///////////////////////////////////////////////

        //sales selected
        let userSalesSelected = await assignOpportunities(
          ctx,
          strapi,
          currentStore
        );

        await strapi.service(entity).update(id, {
          data: {
            users_sales: userSalesSelected ? userSalesSelected.id : null,
            verificationCode: null,
            confirmed: true,
          },
        });

        // create an opportunity from lead
        await strapi.service(opportunitieEntity).create({
          data: {
            ...currentLead,
            store: currentStore?.id || null,
            users_sales: userSalesSelected ? userSalesSelected.id : null,
            lead: currentLead.id,
            publishedAt: new Date(),
          },
        });
        // create a notification from lead
        await strapi.service(notificationEntity).create({
          data: {
            text: `Ti è stata assegnata una lead con email ${currentLead.email}`,
            users_sales: userSalesSelected ? userSalesSelected.id : null,
            store: currentStore?.id || null,
            lead: currentLead.id || null,
            link: currentLead.id || null,
            publishedAt: new Date(),
          },
        });

        strapi.log.debug(`Lead confirmed from portal - ${id}`);
        return {
          status: true,
        };
      }
    } catch (err) {
      strapi.log.error(`Error in confirm lead`);
      return {
        status: false,
        msg: "codice OTP errato",
      };
    }
  },

  async refreshCode(ctx) {
    const { body } = ctx.request;

    let verificationCode = Math.floor(Math.random() * 90000) + 100000;

    try {
      await strapi.service(entity).update(body.ids, {
        data: {
          verificationCode,
        },
      });

      strapi.log.debug(`Refresh Lead OTP - ${body.ids}`);

      return {
        status: true,
      };
    } catch (err) {
      strapi.log.error(`Error in Refresh OTP lead`);
      return {
        status: false,
        msg: "codice OTP errato",
      };
    }
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
