module.exports = {
  routes: [
    {
      method: "GET",
      path: "/opportunities",
      handler: "opportunity.findRefine",
    },
    {
      method: "GET",
      path: "/opportunities/:id",
      handler: "opportunity.findOneRefine",
    },
    {
      method: "PUT",
      path: "/opportunities/:id",
      handler: "opportunity.updateOneRefine",
    },
    {
      method: "DELETE",
      path: "/opportunities/:id",
      handler: "opportunity.deleteOneRefine",
    },
  ],
};
