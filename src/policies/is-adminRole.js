module.exports = (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;
  if (user) {
    if (user.isSuperAdmin || user.isAdmin) {
      return true;
    }
  }
  return false;
};
