module.exports = {
  routes: [
    {
      method: "POST",
      path: "/notifications",
      handler: "notification.createRefine",
    },
    {
      method: "GET",
      path: "/notifications",
      handler: "notification.findRefine",
    },
    {
      method: "GET",
      path: "/notifications/:id",
      handler: "notification.findOneRefine",
    },
    {
      method: "PUT",
      path: "/notifications/:id",
      handler: "notification.updateOneRefine",
    },
    {
      method: "DELETE",
      path: "/notifications/:id",
      handler: "notification.deleteOneRefine",
    },
  ],
};
