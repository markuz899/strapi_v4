module.exports = {
  routes: [
    {
      method: "POST",
      path: "/:store/leads",
      handler: "lead.create",
    },
  ],
};
