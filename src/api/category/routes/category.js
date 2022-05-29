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
    {
      method: "GET",
      path: "/categories",
      handler: "category.findRefine",
    },
    {
      method: "GET",
      path: "/categories/:id",
      handler: "category.findOneRefine",
    },
  ],
};
