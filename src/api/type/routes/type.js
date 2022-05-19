module.exports = {
  routes: [
    {
      method: "GET",
      path: "/:store/types",
      handler: "type.find",
    },
    {
      method: "GET",
      path: "/:store/types/:id",
      handler: "type.findOne",
    },
    {
      method: "POST",
      path: "/:store/types",
      handler: "type.create",
    },
    {
      method: "PUT",
      path: "/:store/types/:id",
      handler: "type.update",
    },
    {
      method: "DELETE",
      path: "/:store/types/:id",
      handler: "type.delete",
    },
  ],
};
