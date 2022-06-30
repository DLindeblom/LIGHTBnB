const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});




const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email LIKE $1`, [`%${email}%`])
    .then((result) => {
      // console.log(result.rows);
      let user = result.rows[0];
      return user;
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
  // let user;
  // for (const userId in users) {
  //   user = users[userId];
  //   if (user.email.toLowerCase() === email.toLowerCase()) {
  //     break;
  //   } else {
  //     user = null;
  //   }
  // }
  // console.log(user)
  // return Promise.resolve(user);
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query('SELECT id FROM users WHERE id = $1 ', [id])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
      return null;
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {

  return pool
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`, [`${user.name}`, `${user.email}`, `${user.password}`])
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err);
    });

  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

// query string for reservations
let reservations = ` 
SELECT DISTINCT reservations.id as id, properties.*, reservations.start_date, reservations.end_date, avg(rating)
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON property_reviews.property_id= properties.id
WHERE reservations.guest_id = $1
GROUP BY reservations.id, properties.id
ORDER BY start_date 
LIMIT $2;
`;
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(reservations, [guest_id, limit])
    .then((results) => {
      // console.log(results.rows)
      return results.rows;
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 50) {

  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.owner_id) {
    queryParams.push(Number(options.owner_id));
    queryString += `WHERE owner_id = $${queryParams.length}`;
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night) * 100);
    queryString += `AND properties.cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night) * 100);
    queryString += `AND cost_per_night <= $${queryParams.length} `;
  }

  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    queryString += `AND rating >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams, options.owner_id);
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      // console.log(result.rows)
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });

};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {

  const { title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, city, province, post_code, owner_id } = property;

  let queryString = `
  INSERT INTO properties (title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, city, province, post_code, owner_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *
  `;
  const queryParams = [title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, city, province, post_code, owner_id];


  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err);
    });
  ;
};
exports.addProperty = addProperty;
