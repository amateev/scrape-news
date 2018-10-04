// Dependencies
// request express to create a rout and response
var express = require("express");
// Initialize Express
var app = express();
// request mongojs to use db
var mongojs = require("mongojs");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");
//cheerio takes the html from the request and 
// let's you use jQuery like syntax to access particular text inside of it

// to create one rout for all files in public folder
app.use(express.static('public'));


// Use EJS to Template Your Node Application
// set the view engine to ejs
app.set('view engine', 'ejs');

//you need this to be able to process information sent to a POST route
// to get req.body
// get inf from forms, post request
var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());


// Database configuration
// created for you by itself!!!
var databaseUrl = "news-scraper";
var collections = ["scrapedNews"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);

// if not connecting use this way
// var db = 'news-scraper',
// collections = ['scrapedNews'],

// db = mongojs("mongodb://127.0.0.1:27017/"+db, collections);


db.on("error", function(error) {
  console.log("Database Error:", error);
});


// Main route (simple Hello World Message)
app.get("/", function(req, res) {
  res.send("Hello world");
});

// Retrieve data from the db
app.get("/", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedNews.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});


// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
  // Make a request for the news section of `imdb.com/news/movie`
  request("https://www.nytimes.com/section/todayspaper", function(error, response, html) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(html);
    // For each element with a "news-article__title" class
    // i for index, element for element
    $(".headline").each(function(i, element) {
      // Save the text and href of each link enclosed in the current element
      var title = $(element).children("a").text();
      var link = $(element).children("a").attr("href");
      // for second <a> element
      // var title = $(element).children("a").eq(1).text();

      // If this found element had both a title and a link
      if (title && link) {
        // Insert the data in the scrapedData db
        db.scrapedNews.insert({
          date: new Date(),
          title: title,
          link: link,
          saved: false
        },
        function(err, inserted) {
          if (err) {
            // Log the error if one is encountered during the query
            console.log(err);
          }
          else {
            // Otherwise, log the inserted data
            console.log(inserted);
          }
        });
      }
    });
  });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});







// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
