module.exports = {
  routes: [
    {
      method: "GET",
      path: "/:store/wishlist",
      handler: "wishlist.find",
    },
    {
      method: "POST",
      path: "/:store/wishlist",
      handler: "wishlist.updateWishlist",
    },
  ],
};
