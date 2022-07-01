module.exports = async (policyContext, config, { strapi }) => {
  const { request } = policyContext;
  const user = policyContext.state.user;
  const bodyReq = request.body;

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
  const stores = userQuery.store;
  const userStore = stores.find((el) => el.id === bodyReq.data.store);

  if (userStore.id) {
    return true;
  }
  return false;
};
