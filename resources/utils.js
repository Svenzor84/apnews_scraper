import { SELECTORS, BASE_URL, BASE_START_HTML, BASE_END_HTML } from './constants.js';
import moment from 'moment';
import * as fs from 'fs';

export default class Utils {
    constructor() { }

    /**
     * Scrolls to the bottom of a page to dynamically load all content
     * @param {*} page A puppetteer page object with loaded html
     */
    async autoScroll(page) {
        await page.evaluate(async () => {
            await new Promise((resolve, reject) => {
                let totalHeight = 0;
                // Distance of 200 per loop was determined to be the fastest speed to reliably load all images
                let distance = 200;
                // Set a wait interval of 100 ms after each callback loop
                let timer = setInterval(() => {
                    // Ultimate scroll height is the height of the page
                    let scrollHeight = document.body.scrollHeight;
                    // Scroll in the y direction for our previously determined distance
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    // Once we have scrolled to the bottom of the page we can resolve the promise
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
    }

    /**
     * Parses a string of one or more Authors to generate an array of author names
     * @param {string} author_string String of authors (comma separated) to be parsed
     * @returns String array of author names
     */
    parseAuthors(author_string) {
        // First strip the "By" portion of the ByLine from the string
        author_string = author_string.substr(3);
        // Split the comma separated author list string
        const authors_split = author_string.split(',');
        let authors_array = [];
        authors_split.forEach((author) => {
            // The substring " and " is used to separate the last two authors in the list
            if (author.includes(' and ')) {
                const secondary_split = author.split(' and ');
                secondary_split.forEach((add_author) => {
                    authors_array.push(add_author);
                });
            } else {
                authors_array.push(author);
            }
        });
        return authors_array;
    }

    /**
     * Parses a FeedCard element for article details to generate an article JSON object
     * @param {*} parsed_article a single FeedCard element (cheerio object) to be parsed
     * @param {*} page Cheerio page object with loaded html
     * @returns JSON representation of article details
     */
    parseArticle(parsed_article, page) {
        let article_data = {};
        // Article title lives in the text node from the first/only h3 element nested in the FeedCard
        article_data.title = page(parsed_article).find('h3').text();
        // Article link lives in the href value from the first anchor element nested in the FeedCard
        article_data.link = BASE_URL + page(parsed_article).find('a').attr('href');
        // Image src value lives in the the first/only image element nested in the FeedCard
        let image_src = page(parsed_article).find('img').attr('src');
        // Check for case where no image is provided
        if (image_src !== undefined) {
            article_data.image = image_src;
        }
        // Author data lives in the ByLine element's text node nested in the FeedCard
        let authors_text = page(parsed_article).find(SELECTORS.BYLINE).text()
        // Check for edge case where article author is not cited
        if (authors_text.toLowerCase().startsWith('by ')) {
            // Parse the author data to build an array of cited authors
            article_data.authors = this.parseAuthors(authors_text);
        } else {
            article_data.authors = ['no author cited'];
        }
        // Select the Timestamp element to access datetime data
        const timestamp = page(parsed_article).find(SELECTORS.TIMESTAMP);
        // Timestamp data lives in the Timestamp element's data-source attribute
        article_data.datetime = moment(timestamp.attr('data-source'));
        // Relative Date (x hours ago, yesterday, etc) data lives in the Timestamp element's text node
        article_data.datetime_relative = timestamp.text();

        return article_data;
    }

    /**
     * Generates an HTML report (list) of parsed articles (file generated in /output)
     * @param {*} section String representation of the AP News section that was parsed
     * @param {*} article_objects Array of article objects with parsed data
     */
    generateReport(section, article_objects) {
        const fileName = `./output/${section}_articles.html`;
        const stream = fs.createWriteStream(fileName);

        // Write the basic HTML start template to the file
        stream.write(BASE_START_HTML, 'UTF8');

        stream.write(`<h1>AP News ${section.charAt(0).toUpperCase()}${section.slice(1)} Articles</h1>`);
        // Here is where we build the actual HTML report
        article_objects.forEach((article) => {
            stream.write('<div>', 'UTF8');
            if (article.image !== undefined) {
                stream.write(`<img src=${article.image} >`);
            }
            stream.write('<span class="article_title">', 'UTF8');
            stream.write(`<a href=${article.link}>${article.title}</a>`, 'UTF8');
            stream.write('</span>', 'UTF8');
            stream.write('</div>', 'UTF8');

            stream.write('<span class="author">');
            article.authors.forEach((author) => {
                stream.write(`| ${author} |`);
            })
            stream.write('</span>');
            stream.write(`<span class="datetime"> from ${article.datetime_relative} (${article.datetime})</span>`);

            stream.write('<hr>');
        });

        // Write the basic HTML end template to the file
        stream.write(BASE_END_HTML, 'UTF8');

        // Mark the end of file
        stream.end();

        // Handle stream events --> finish, and error
        stream.on('finish', function () {
            console.log("Report Generated.");
        });

        stream.on('error', function (err) {
            console.log(err.stack);
        });
    }
}