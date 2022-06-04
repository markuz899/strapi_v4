module.exports = {
  routes: [
    {
      method: "GET",
      path: "/stores",
      handler: "store.find",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/stores/:id",
      handler: "store.findOneRefine",
      config: {
        policies: [],
      },
    },
  ],
};
