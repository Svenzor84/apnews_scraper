import { SELECTORS, BASE_URL } from './constants.js';
import moment from 'moment';

export default class Utils {
    constructor() {}

    /**
     * Scrolls to the bottom of a page to dynamically load all content
     * @param {*} page A puppetteer page object with loaded html
     */
    async autoScroll(page){
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
                    if(totalHeight >= scrollHeight){
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
            if(author.includes(' and ')) {
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
        } else {
            // Use the default (AP Logo) image path if no image is provided
            article_data.image = 'resources/ap_logo.bmp';
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
}