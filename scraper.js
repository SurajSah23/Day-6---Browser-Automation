// scrape.mjs
import puppeteer from 'puppeteer';
import { writeFile } from 'fs/promises';

(async () => {
    // Launch the browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the target website
    await page.goto('http://books.toscrape.com/', { waitUntil: 'domcontentloaded' });

    let products = [];
    let pageNum = 1;
    const productsPerPage = 20;

    // Loop until we have at least 20 products
    while (products.length < 20) {
        console.log(`Scraping page ${pageNum}...`);

        // Scrape product data from the current page
        const pageProducts = await page.evaluate(() => {
            const productList = [];
            const items = document.querySelectorAll('.product_pod');

            items.forEach(item => {
                const name = item.querySelector('h3 a')?.getAttribute('title') || 'No name';
                const price = item.querySelector('.price_color')?.innerText || 'No price';
                const imageUrl = item.querySelector('img')?.getAttribute('src') || 'No image';
                const category = document.querySelector('.page-header h1')?.innerText || 'No category';

                productList.push({
                    name,
                    price,
                    description: 'Description not available on listing page',
                    imageUrl: imageUrl.startsWith('http') ? imageUrl : `http://books.toscrape.com/${imageUrl}`,
                    category
                });
            });

            return productList;
        });

        products = products.concat(pageProducts);

        // Check if there’s a next page and navigate if we need more products
        const nextButton = await page.$('.next a');
        if (nextButton && products.length < 20) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
                page.click('.next a')
            ]);
            pageNum++;
        } else {
            break;
        }
    }

    // Limit to 20 products if we scraped more
    products = products.slice(0, 20);

    // Save the data to a JSON file
    await writeFile('products.json', JSON.stringify(products, null, 2));
    console.log(`Scraped ${products.length} products. Data saved to products.json`);

    // Close the browser
    await browser.close();
})();