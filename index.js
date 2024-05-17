import { chromium } from 'playwright';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import inquirer from 'inquirer';


async function fetchHackerNewsData(options) {
  // Placeholder for your fetchHackerNewsData function implementation
  console.log("Fetching Hacker News data with options:", options);
}


async function run() {
  console.log("");
  console.log("Welcome to Hacker News Scraper!");
  console.log("");

  const { fetchType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fetchType',
      message: 'Select an option:',
      choices: [
        { name: 'Normal Fetch (Top 10 Articles)', value: 'normal' },
        { name: 'Custom Fetch', value: 'custom' },
      ],
    },
  ]);

  if (fetchType === 'normal') {
    await fetchHackerNewsData({page: 'home', articles: 10, sort: 'none'});
  } else if (fetchType === 'custom') {
    const customQuery = await inquirer.prompt([
      {
        type: 'list',
        name: 'page',
        message: 'Select which page to scrape:',
        choices: [
          { name: 'Most Popular Articles (Today)', value: 'today' },
          { name: 'Newest Articles (Today)', value: 'newest' },
          { name: 'Most Popular Articles (Yesterday)', value: 'past' },
        ],
      },
      {
        type: 'input',
        name: 'articles',
        message: 'Number of articles to fetch:',
        default: 10,
        validate: (value) => {
          const parsedValue = parseInt(value);
          if (isNaN(parsedValue)) {
            return 'Please enter a valid number';
          } else if (parsedValue > 60 || parsedValue <= 0) {
            return 'Minimum articles to fetch is 1 and maximum is 60';
          }
          return true;
        },
        filter: (value) => {
          const parsedValue = parseInt(value);
          if (isNaN(parsedValue) || parsedValue > 60 || parsedValue <= 0) {
            return '';
          }
          return parsedValue;
        },
      },
      {
        type: 'list',
        name: 'sort',
        message: 'Select sorting option:',
        choices: [
          { name: 'No Sorting', value: 'none' },
          { name: 'Sort by Most Votes', value: 'upvotes' },
          { name: 'Sort by Most Comments', value: 'comments' },
        ],
      },
    ]);

    // customQuery object created and looks like:
      // { page : "newest", articles: 30, sort: 'upvotes' }
    await fetchHackerNewsData({page: customQuery.page, articles: customQuery.articles, sort: customQuery.sort})
  }
}

(async () => {
  await run()
})();
