module.exports = {
  routes: [
    {
      method: "GET",
      path: "/:store/utils/city",
      handler: "utils.getCity",
    },
    {
      method: "GET",
      path: "/:store/utils/province",
      handler: "utils.getProvince",
    },
    {
      method: "GET",
      path: "/utils/city",
      handler: "utils.getCity",
    },
    {
      method: "GET",
      path: "/utils/province",
      handler: "utils.getProvince",
    },
  ],
};
