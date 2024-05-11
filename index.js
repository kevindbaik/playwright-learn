// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");

async function saveHackerNewsArticles() {
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to Hacker News
  await page.goto('https://news.ycombinator.com');

  // select the titles and URLs of the top 10 articles
  const articles = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.athing')).slice(0, 10);
    return items.map(item => {
      const title = item.querySelector('.titlelink').innerText;
      const url = item.querySelector('.titlelink').href;
      return { title, url };
    });
  });

  await browser.close();

  // save data to a csv file
  const csvWriter = createCsvWriter({
    path: 'hacker_news_articles.csv',
    header: [
      { id: 'title', title: 'Title' },
      { id: 'url', title: 'URL' }
    ]
  });

  csvWriter.writeRecords(articles)
    .then(() => console.log('Data has been written to CSV file successfully.'))
    .catch(err => console.error('Error writing CSV file:', err));
}

(async () => {
  await saveHackerNewsArticles();
})();
