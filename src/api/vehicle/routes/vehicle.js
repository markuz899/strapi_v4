module.exports = {
  routes: [
    {
      method: "GET",
      path: "/:store/vehicles",
      handler: "vehicle.find",
    },
    {
      method: "GET",
      path: "/:store/vehicles/:make/:model/:slug",
      handler: "vehicle.findOne",
    },
    {
      method: "GET",
      path: "/:store/vehicles/:make",
      handler: "vehicle.findMake",
    },
    {
      method: "GET",
      path: "/:store/vehicles/:make/:model",
      handler: "vehicle.findMakeModel",
    },
    {
      method: "GET",
      path: "/vehicles",
      handler: "vehicle.findRefine",
    },
    {
      method: "GET",
      path: "/vehicles/:id",
      handler: "vehicle.findOneRefine",
    },
    {
      method: "POST",
      path: "/vehicles",
      handler: "vehicle.createOneRefine",
      config: {
        policies: ["global::is-adminRole", "global::is-adminStore"],
      },
    },
    {
      method: "PUT",
      path: "/vehicles/:id",
      handler: "vehicle.updateOneRefine",
    },
    {
      method: "DELETE",
      path: "/vehicles/:id",
      handler: "vehicle.deleteOneRefine",
    },
  ],
};
