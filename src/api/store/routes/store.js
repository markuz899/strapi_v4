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
  ],
};
