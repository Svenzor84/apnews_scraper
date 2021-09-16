import { SELECTORS, BASE_URL } from './resources/constants.js';
import Utils from './resources/utils.js';
import * as cheerio from 'cheerio';
import puppeteer, * as otherz from 'puppeteer';

const utils = new Utils();

const section = 'health';
const url = `${BASE_URL}/hub/${section}?utm_source=apnewsnav&utm_medium=sections`;

// Launch a puppeteer browser instance
const browser = await puppeteer.launch({ignoreDefaultArgs: ['--disable-extensions']});

// Direct the browser to the AP News Section page we want to scrape
await browser.newPage()
    .then(page => {
        return page.goto(url).then( async () => {
            // Scroll to the bottom of the page so that all article images load
            await utils.autoScroll(page);
            // Take a screenshot to review (for debugging)
            await page.screenshot({
                path:'screen.png',
                fullPage: true
            });
            // Return the loaded page content to be scraped
            return page.content();
        });
    })
    .then(html => {
        // Load the page content into cheerio
        const page = cheerio.load(html);
        
        // Pull an array of all FeedCard elements on the loaded page
        const articles = page(SELECTORS.FEEDCARD);
        console.log(`Articles found: ${articles.length}`);
        
        let article_objects = [];

        // Loop through the identified FeedCard elements to parse desired article data
        articles.each(function() {
            // Parse article details from each FeedCard
            let article_data = utils.parseArticle(this, page);
            // Add each article to the objects array
            article_objects.push(article_data);
        });
        console.log(`Total Article Objects Generated: ${article_objects.length}`);
        console.log(article_objects);
    })
.catch(console.error);

// Close the browser instance
browser.close();