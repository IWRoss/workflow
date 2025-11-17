const copperSdk = require("./index");

const { getCache, setCache } = require("../../controllers/cache");

/**
 * Get Copper users
 *
 * @returns {Array} The Copper users data
 */
exports.getUsers = async () => {
    const copperUsers = getCache("copperUsers");

    if (copperUsers) {
        return copperUsers;
    }
    const copper = copperSdk();

    let page = 1;
    const pageSize = 100;
    let allUsers = [];

    while (true) {
        const response = await copper.get("/users", {
            params: {
                page_number: page,
                page_size: pageSize,
            },
        });

        allUsers = allUsers.concat(response.data);

        if (response.data.length < pageSize) {
            break;
        }
        page += 1;
    }

    setCache("copperUsers", allUsers, 3600); // Cache for 1 hour

    return allUsers;
};

/**
 * Get a single Copper user by id
 */
exports.getUserByID = async (userID) => {
    const copper = copperSdk();

    const response = await copper.get(`/users/${userID}`);

    return response.data;
};
