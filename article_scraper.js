import { SELECTORS, BASE_URL, BASE_START_HTML, BASE_END_HTML } from './resources/constants.js';
import Utils from './resources/utils.js';
import * as cheerio from 'cheerio';
import puppeteer, * as other from 'puppeteer';
import * as fs from 'fs';

const utils = new Utils();

const section = 'health';
const url = `${BASE_URL}/hub/${section}?utm_source=apnewsnav&utm_medium=sections`;

// Launch a puppeteer browser instance
const browser = await puppeteer.launch({ ignoreDefaultArgs: ['--disable-extensions'] });
try {
    // Direct the browser to the AP News Section page we want to scrape
    let dynamic_page = await browser.newPage()
    await dynamic_page.goto(url)
    // Scroll to the bottom of the page so that all article images load
    await utils.autoScroll(dynamic_page);
    // Take a screenshot to review (for debugging)
    await dynamic_page.screenshot({
        path: `screenshots/${Date.now()}.jpeg`,
        fullPage: true
    });
    // Return the loaded page content to be scraped
    const html = await dynamic_page.content();
    // Load the page content into cheerio
    const page = await cheerio.load(html);

    // Pull an array of all FeedCard elements on the loaded page
    const articles = page(SELECTORS.FEEDCARD);
    console.log(`Articles found: ${articles.length}`);

    let article_objects = [];

    // Loop through the identified FeedCard elements to parse desired article data
    articles.each(function () {
        // Parse article details from each FeedCard
        let article_data = utils.parseArticle(this, page);
        // Add each article to the objects array
        article_objects.push(article_data);
    });
    console.log(`Total Article Objects Generated: ${article_objects.length}`);
    console.log(article_objects);

    // Now that we generated our article objects array we want to generate the report html
    const fileName = `./output/${section}_articles.html`;
    const stream = fs.createWriteStream(fileName);

    // Write the basic HTML start template to the file
    stream.write(BASE_START_HTML, 'UTF8');

    // Here is where we build the actual HTML report
    article_objects.forEach((article) => {
        stream.write('<div>', 'UTF8');
        stream.write('<p>', 'UTF8');
        stream.write(`<a href=${article.link}>${article.title}</a>`, 'UTF8');
        if (article.authors[0] !== 'no author cited') {
            stream.write(' by');
        }
        article.authors.forEach((author) => {
            stream.write(` ${author} `);
        })
        stream.write('</p>', 'UTF8');
        stream.write(`<img src=${article.image} >`);
        stream.write('<p>', 'UTF8');
        stream.write(`from ${article.datetime_relative} (${article.datetime})`);
        stream.write('</p>', 'UTF8');
        stream.write('</div>', 'UTF8');
    });

    // Write the basic HTML end template to the file
    stream.write(BASE_END_HTML, 'UTF8');

    // Mark the end of file
    stream.end();

    // Handle stream events --> finish, and error
    stream.on('finish', function () {
        console.log("Write completed.");
    });

    stream.on('error', function (err) {
        console.log(err.stack);
    });
} catch (error) {
    console.error(error);
} finally {
    await browser.close();
}

