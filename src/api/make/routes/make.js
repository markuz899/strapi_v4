module.exports = {
  routes: [
    {
      method: "GET",
      path: "/:store/makes",
      handler: "make.find",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/:store/makes/:id",
      handler: "make.findOne",
      config: {
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/:store/makes",
      handler: "make.create",
      config: {
        policies: [],
      },
    },
    {
      method: "PUT",
      path: "/:store/makes/:id",
      handler: "make.update",
      config: {
        policies: [],
      },
    },
    {
      method: "DELETE",
      path: "/:store/makes/:id",
      handler: "make.delete",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/makes",
      handler: "make.findRefine",
    },
    {
      method: "GET",
      path: "/makes/:id",
      handler: "make.findOneRefine",
    },
  ],
};
