SELECT reservations.id as id, title, reservations.start_date, cost_per_night, avg(property_reviews.rating)

FROM
  reservations
JOIN
  properties ON property_id = properties.id
JOIN
  property_reviews ON property_reviews.property_id= properties.id

WHERE reservations.guest_id = 9

GROUP BY
  reservations.id, title, reservations.start_date, cost_per_night

ORDER BY
  start_date 

LIMIT 
  10;