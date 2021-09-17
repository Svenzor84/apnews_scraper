# apnews_scraper
A simple Node.js scraper to pull medical articles from apnews.com

## Overview
This program utilizes a series of node modules (namely Cheerio and Puppeteer) to scrape the contents of apnews.com, given a specific filter, and generate an HTML report to display the data gathered.

To accomplish this task, an instance of Puppeteer is used to open the target page in a headless browser allowing all dynamic content to load before any parsing occurs - I had originally utilized the Axios module for this process as the majority of data on apnews is static, however article images are loaded dynamically as the user scrolls down the page; Pupeteer was an easy choice to fill this role as it is full featured and easy to use.

With all dynamic content loaded, the html string is loaded into Cheerio in order to interact with the DOM and select relevant page elements using jQuery syntax - Cheerio is utilized in this case for its speed and, again, ease of use.

Utilizing Cheerio and jQuery the parent element for each set of article data is isolated, identified by the FeedCard class, and all requested data for each article is pulled from several nested elements (ByLine, Timestamp, etc); these data are utilized to populate custom article JSON objects describing each article in the selected Section.

Finally, these article objects are utilized to generate a basic HTML report; the filestream library is used to stream Title Image (if present), Title (hyperlinked to the article itself), Authors (is provided), Relative Datetime (yesterday, two hours ago, etc), and Timestamp data to a static HTML page saved in the local filesystem. A simple css stylesheet is included to make this basic report a little easier to look at.

The Section filters on apnews.com are leveraged to narrow the search based on the category of article desired - given the request for Medical articles the default Section selected by the scraper is Health, however any of the Sections present on apnews.com can be scraped with this program.

## Setup
*apnews_scraper* requires node.js in order to run - after insalling node and cloning this repo, run `npm i` from the project root directory to install all dependencies (installing the Puppeteer dependency can take a little time).

## Running
The scraper can be initiated directly from the command line by running `node article_scraper.js` from the project root directory, however a few scripts have been set up in the project `package.json` to make scraping different Sections easy - the current options are `npm run scrape:health`, `npm run scrape:sports`, `npm run scrape:politics`, `npm run scrape:travel`, and `npm run scrape:science`. Other Sections can be scraped by using these scripts as templates or by providing a Section title as a command line argument to the direct call (e.g. `node article_scraper.js religion`).

When the scraper is finished the array of article objects will output to the console, and successful generation of the HTML report will be logged there as well. The HTML report will be saved to the project `/output` directory and can be opened locally in a browser to view.
