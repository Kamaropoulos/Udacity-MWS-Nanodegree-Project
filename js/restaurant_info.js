let restaurant;
var map;
var restaurantID;
let ratingValue = "0";

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });

      // Google Maps Lighthouse Accesibility issue workaround
      google.maps.event.addListenerOnce(map, 'idle', () => {
        document.getElementsByTagName('iframe')[0].title = "Google Maps";
      });

      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  restaurantID = id;
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  if (!restaurant.photograph) {
    image.src = "/img/no-photo.png";
    image.alt = "Image of " + restaurant.name + "restaurant was not found.";
    image.style = "background-color: transparent;";
  } else {
    image.src = DBHelper.responsiveImageName(restaurant.photograph, "1x");
    image.alt = "Image of " + restaurant.name + "restaurant.";
    image.srcset = DBHelper.generateSrcSet(restaurant);
  }

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  ul.appendChild(createReviewForm());

  var rad = document.querySelectorAll(".starR");
  var prev = null;
  for (var i = 0; i < rad.length; i++) {
    rad[i].onclick = function () {
      if (this !== prev) {
        prev = this;
      }
      ratingValue = this.value;
    };
  }

  document.querySelector("#reviewForm").addEventListener("submit", function (e) {
    e.preventDefault();    //stop form from submitting

    // Get form data
    let data = document.querySelector("#reviewForm").serialize();
    data.stars = ratingValue;

    // Validate data
    if (!data.reviewText || !data.reviewName || !data.stars) {
      // Something went wrong
    }

    fetch(`http://${window.location.hostname}:1337/reviews/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        "restaurant_id": restaurantID,
        "name": data.reviewName,
        "rating": data.stars,
        "comments": data.reviewText
      })
    }).then(res => res.json())
      .then(res => {
        // Check result
        // If success, set to done
        // Else output msg
        console.log(res)
      });

      // Create new element
      let newReview = {};
      newReview.comments = data.reviewText;
      newReview.createAt = new Date().getTime();
      newReview.restaurant_id = restaurantID;
      newReview.name = data.reviewName;
      newReview.rating = data.stars;
      newReview.updatedAt = newReview.createAt;
      const ul = document.getElementById('reviews-list');
      ul.insertBefore(createReviewHTML(newReview), ul.childNodes[ul.childNodes.length-1]);

  });

  container.appendChild(ul);
}

HTMLElement.prototype.serialize = function () {
  var obj = {};
  var elements = this.querySelectorAll("input, select, textarea");
  for (var i = 0; i < elements.length; ++i) {
    var element = elements[i];
    var name = element.name;
    var value = element.value;

    if (name) {
      obj[name] = value;
    }
  }
  return obj;
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  review.date = new Date(review.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

createReviewForm = () => {
  const li = document.createElement('li');

  li.innerHTML =
    `<h3>Add Your Review</h3>
    <form id="reviewForm">
      <textarea name="reviewText" id="reviewText" cols="5" rows="5" required></textarea>
      <div>Your Name:<input type="text" name="reviewName" id="reviewName" required></div>
      <div>Your rating: <div class="rating"><label>
      <input class="starR" type="radio" name="stars" value="1"  required/>
      <span class="icon">★</span>
    </label>
    <label>
      <input class="starR" type="radio" name="stars" value="2"  required/>
      <span class="icon">★</span>
      <span class="icon">★</span>
    </label>
    <label>
      <input class="starR" type="radio" name="stars" value="3"  required/>
      <span class="icon">★</span>
      <span class="icon">★</span>
      <span class="icon">★</span>   
    </label>
    <label>
      <input class="starR" type="radio" name="stars" value="4"  required/>
      <span class="icon">★</span>
      <span class="icon">★</span>
      <span class="icon">★</span>
      <span class="icon">★</span>
    </label>
    <label>
      <input class="starR" type="radio" name="stars" value="5"  required/>
      <span class="icon">★</span>
      <span class="icon">★</span>
      <span class="icon">★</span>
      <span class="icon">★</span>
      <span class="icon">★</span>
    </label></div></div> 
      <button href="#" id="reviewSubmit">Submit</button>
    </form>`;

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
