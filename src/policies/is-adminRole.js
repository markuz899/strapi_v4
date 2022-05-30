module.exports = (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;
  if (user) {
    if (user.role?.type === "admin_user") {
      return true;
    }
  }
  return false;
};
