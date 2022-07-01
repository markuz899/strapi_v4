module.exports = async (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;

  const query = {
    where: {
      id: {
        $eq: user.id,
      },
    },
    populate: ["role", "store"],
  };
  const userQuery = await strapi
    .query("plugin::users-permissions.user")
    .findOne({
      ...query,
    });
  const userStores = userQuery.store.map((el) => el.id);

  let filters = {
    populate: ["store"],
    where: {
      store: {
        id: {
          $in: userStores,
        },
      },
    },
  };
  const vehicle = await strapi.db
    .query("api::vehicle.vehicle")
    .findOne(filters);

  if (vehicle.id) {
    return true;
  }
  return false;
};
