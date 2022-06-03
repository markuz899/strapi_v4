module.exports = {
  routes: [
    {
      method: "POST",
      path: "/customers",
      handler: "customer.create",
    },
    {
      method: "GET",
      path: "/customers",
      handler: "customer.findRefine",
    },
    {
      method: "GET",
      path: "/customers/:id",
      handler: "customer.findOneRefine",
    },
    {
      method: "PUT",
      path: "/customers/:id",
      handler: "customer.updateOneRefine",
    },
    {
      method: "DELETE",
      path: "/customers/:id",
      handler: "customer.deleteOneRefine",
    },
  ],
};
