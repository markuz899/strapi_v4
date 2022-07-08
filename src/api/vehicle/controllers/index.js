module.exports = {
  incrementVisited: async (ctx, strapi, vehicle) => {
    try {
      await strapi.service("api::vehicle.vehicle").update(vehicle.id, {
        data: {
          visited: vehicle.visited + 1,
        },
      });
      strapi.log.debug(`Vehicle incremented visited - ${vehicle.visited}`);
    } catch (err) {
      strapi.log.error(`Error in incrementVisited vehicle`, err);
    }
  },
};
