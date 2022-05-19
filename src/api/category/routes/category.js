module.exports = {
  routes: [
    {
      method: "GET",
      path: "/:store/categories",
      handler: "category.find",
    },
    {
      method: "GET",
      path: "/:store/categories/:slug",
      handler: "category.findOne",
    },
  ],
};
