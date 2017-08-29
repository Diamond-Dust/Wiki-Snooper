var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var readlineSync = require('readline-sync');
var fs = require('fs');

var SEARCH_LANG = readlineSync.question('Which language do you choose? (pl/en) ');
while((SEARCH_LANG!='pl') && (SEARCH_LANG!='en'))
    SEARCH_LANG = readlineSync.question('Wrong syntax. Write "pl" or "en" ');
 
var SEARCH_WORD = readlineSync.question('What word would you like to seek? ');
console.log(SEARCH_WORD + ' it is, then!');

if(SEARCH_LANG == 'en') {
    var START_URL = "https://en.wikipedia.org/wiki/" + readlineSync.question('What Wikipedia page should we start at? Write the URL after the /wiki/ part. ');
    console.log(START_URL + ' it is, then!');
}
else if (SEARCH_LANG == 'pl') {
    var START_URL = "https://pl.wikipedia.org/wiki/" + readlineSync.question('What Wikipedia page should we start at? Write the URL after the /wiki/ part. ');
    console.log(START_URL + ' it is, then!');
}

var ROAD_STRING = "";

var MAX_PAGES_TO_VISIT = 1000;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;

pagesToVisit.push(START_URL);

crawl();

function crawl() {
  if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  numPagesVisited++;

  // Make the request
  ROAD_STRING += url;
  ROAD_STRING += '\r\n';
  console.log("Visiting page " + url);
  request(url, function(error, response, body) {
     // Check status code (200 is HTTP OK)
     console.log("Status code: " + response.statusCode);
     if(response.statusCode !== 200) {
       callback();
       return;
     }
     // Parse the document body
     var $ = cheerio.load(body);
     var isWordFound = searchForWord($, SEARCH_WORD);
     if(isWordFound) {
       console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
       console.log('My journey took me through ' + numPagesVisited + ' pages in total.');
       ROAD_STRING += ('I was searching for the word "' + SEARCH_WORD + '".');
       fs.writeFileSync('MyLastSuccessfulRoad.txt', ROAD_STRING);
     } else {
       collectInternalLinks($);
       // In this short program, our callback is just calling crawl()
       callback();
     }
  });
}

function searchForWord($, word) {
  var bodyText = $('html > body').text().toLowerCase();
  return(bodyText.indexOf(word.toLowerCase()) !== -1);
}

function collectInternalLinks($) {
    if(SEARCH_LANG == 'en') {
        var relativeLinks = $("#bodyContent p a[href^='/wiki/']").not("[href^='/wiki/Wikipedia:']").not("[href^='/wiki/User_talk:']").not("[href^='/wiki/Talk:']").not("[href^='/wiki/File:']").not("[href^='/wiki/User:']").not("[href^='/wiki/Special:']").not("[href^='/wiki/Book:']");
    }
    else if(SEARCH_LANG == 'pl') {
        var relativeLinks = $("#bodyContent p a[href^='/wiki/']").not("[href^='/wiki/Wikipedia:']").not("[href^='/wiki/Pomoc:']").not("[href^='/wiki/Dyskusja:']").not("[href^='/wiki/Szablon:']").not("[href^='/wiki/Wikipedysta:']").not("[href^='/wiki/Specjalna:']").not("[href^='/wiki/Plik:']");
    }
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
        pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
}

/*function searchForWord($, word) {
  var bodyText = $('html > body').text();
  if(bodyText.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
    return true;
  }
  return false;
}

function collectInternalLinks($) {
  var allRelativeLinks = [];
  var allAbsoluteLinks = [];

  if(SEARCH_LANG == 'en') {
      var relativeLinks = $("a[href^='/wiki/']").not("[href^='/wiki/Wikipedia:']").not("[href^='/wiki/User_talk:']").not("[href^='/wiki/Talk:']").not("[href^='/wiki/File:']").not("[href^='/wiki/User:']").not("[href^='/wiki/Special:']").not("[href^='/wiki/Book:']");
  }
  else if(SEARCH_LANG == 'pl') {
      var relativeLinks = $("a[href^='/wiki/']").not("[href^='/wiki/Wikipedia:']").not("[href^='/wiki/Pomoc:']").not("[href^='/wiki/Dyskusja:']").not("[href^='/wiki/Szablon:']").not("[href^='/wiki/Wikipedysta:']").not("[href^='/wiki/Specjalna:']").not("[href^='/wiki/Plik:']");
  }
  relativeLinks.each(function() {
      allRelativeLinks.push($(this).attr('href'));

  });
  
  var absoluteLinks = $("a[href^='http']");
  absoluteLinks.each(function() {
      allAbsoluteLinks.push($(this).attr('href'));
  });

  console.log("Found " + allRelativeLinks.length + " relative links");
  console.log("Found " + allAbsoluteLinks.length + " absolute links");
}

console.log("Visiting page " + pageToVisit);
request(START_URL, function(error, response, body) {
   if(error) {
     console.log("Error: " + error);
   }
   // Check status code (200 is HTTP OK)
   console.log("Status code: " + response.statusCode);
   if(response.statusCode === 200) {
     // Parse the document body
     var $ = cheerio.load(body);
     console.log("Page title:  " + $('title').text());
   }
   searchForWord($, SEARCH_WORD)
   collectInternalLinks($)
});*/



