module.exports = {
  routes: [
    {
      method: "POST",
      path: "/:store/leads",
      handler: "lead.create",
    },
    {
      method: "POST",
      path: "/:store/confirm-leads/:id",
      handler: "lead.confirmLead",
    },
    {
      method: "POST",
      path: "/:store/refresh-code",
      handler: "lead.refreshCode",
    },
    {
      method: "POST",
      path: "/leads",
      handler: "lead.createRefine",
    },
    {
      method: "GET",
      path: "/leads",
      handler: "lead.findRefine",
    },
    {
      method: "GET",
      path: "/leads/:id",
      handler: "lead.findOneRefine",
    },
    {
      method: "PUT",
      path: "/leads/:id",
      handler: "lead.updateOneRefine",
    },
    {
      method: "DELETE",
      path: "/leads/:id",
      handler: "lead.deleteOneRefine",
    },
  ],
};
