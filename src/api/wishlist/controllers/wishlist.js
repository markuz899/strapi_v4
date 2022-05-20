const vehicleEntity = "api::vehicle.vehicle";
const { getService } = require("@strapi/plugin-users-permissions/server/utils");

module.exports = {
  async find(ctx) {
    const userState = ctx.state.user;
    const storeName = ctx.params.store;
    let wishlist = [];

    // Check if the user exists.
    const user = await strapi.query("plugin::users-permissions.user").findOne({
      where: {
        email: userState.email,
        store: {
          name: {
            $eq: storeName,
          },
        },
      },
      populate: ["store", "wishlists"],
    });

    if (!user) {
      throw new Error("Invalid user");
    }

    async function getVehicle(id) {
      ctx.query = {
        where: {
          store: {
            name: {
              $eq: storeName,
            },
          },
          id: id,
        },
        populate: ["store", "category", "make", "type", "image"],
      };
      const vehicle = await strapi.db
        .query(vehicleEntity)
        .findOne({ ...ctx.query });
      //structure vehicle object

      let compose = {
        ...vehicle,
        make: vehicle.make ? vehicle.make.name : "",
        type: vehicle.type ? vehicle.type.name : "",
        category: vehicle.category ? vehicle.category.name : "",
        store: vehicle.store ? vehicle.store.name : "",
      };
      return compose;
    }

    if (user) {
      if (user.wishlists) {
        await Promise.all(
          user.wishlists.map(async (el) => {
            let vehicle = await getVehicle(el.id);
            wishlist.push({
              ...vehicle,
              make: vehicle.make ? vehicle.make.name : null,
            });
          })
        );
        return wishlist;
      } else {
        return wishlist;
      }
    }
  },

  async updateWishlist(ctx) {
    const userState = ctx.state.user;
    const storeName = ctx.params.store;
    let operation = "pending";
    let status = false;

    const { id } = ctx.request.body;
    if (!id) {
      return {
        status: false,
        operation,
      };
    }

    // Check if the user exists.
    const user = await strapi.query("plugin::users-permissions.user").findOne({
      where: {
        email: userState.email,
        store: {
          name: {
            $eq: storeName,
          },
        },
      },
      populate: ["store", "wishlists"],
    });

    if (!user) {
      throw new Error("Invalid user");
    }
    let wishlistUser = user.wishlists;

    if (wishlistUser) {
      let prodExist =
        wishlistUser.filter((item) => item.id === id).length !== 0;
      let removeItem = wishlistUser.filter((item) => item.id !== id);

      try {
        if (prodExist) {
          await getService("user").edit(user.id, {
            wishlists: removeItem,
          });
          operation = "delete";
        } else {
          await getService("user").edit(user.id, {
            wishlists: [...wishlistUser, id],
          });
          operation = "add";
        }
      } catch (err) {
        throw new Error(err);
      }
    }

    return {
      status: true,
      operation,
    };
  },
};
