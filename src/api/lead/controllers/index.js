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
        let atWork = user.opportunities.filter(
          (opp) => opp.status === "contacted"
        );
        allUserWorkers.push({ works: atWork.length, user });
      });

    //take minor workers
    let minUserWorkers = allUserWorkers.reduce((prev, current) => {
      return prev.works < current.works ? prev : current;
    });

    return minUserWorkers.user;
  },
};
