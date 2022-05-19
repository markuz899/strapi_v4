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
  ],
};
