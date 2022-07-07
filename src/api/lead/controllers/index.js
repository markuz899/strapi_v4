const axios = require("axios");

module.exports = {
  assignOpportunities: async (ctx, strapi, currentStore) => {
    //take only user sales
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

    let allUserWorkers = [];

    users &&
      users.forEach((user) => {
        let userOpportunity = user.opportunities;
        let userOpportunityWork = user.opportunities.filter(
          (opp) => opp.status === "contacted"
        );
        allUserWorkers.push({
          opportunities: userOpportunity.length,
          works: userOpportunityWork.length,
          user,
        });
      });

    //take minor workers
    let minUserWorkers = allUserWorkers.reduce((prev, current) => {
      // return prev.works < current.works ? prev : current;
      return prev.opportunities < current.opportunities ? prev : current;
    });

    return minUserWorkers.user;
  },
  getPositionFromCity: async (city) => {
    try {
      let query = `http://api.openweathermap.org/geo/1.0/direct?q={${city}}&appid=${process.env.OPEN_WEATHER}`;
      const position = await axios.get(query);
      if (position.status === 200 && position.data) {
        strapi.log.debug(`Position calculated`);
        return position.data.length
          ? { lat: position.data[0].lat || 0, lon: position.data[0].lon || 0 }
          : {};
      }
      strapi.log.error(`Error in getPositionFromCity`);
    } catch (err) {
      strapi.log.error(`Error in getPositionFromCity`, err);
    }
  },
};
