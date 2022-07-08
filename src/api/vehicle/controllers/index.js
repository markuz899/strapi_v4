module.exports = {
  incrementVisited: async (strapi, vehicle) => {
    try {
      await strapi.service("api::vehicle.vehicle").update(vehicle.id, {
        data: {
          visited: vehicle.visited + 1,
        },
      });
    } catch (err) {
      strapi.log.error(`Error in incrementVisited vehicle`, err);
    }
  },
};
