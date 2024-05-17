import { chromium } from 'playwright';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import inquirer from 'inquirer';


async function fetchHackerNewsData(options) {
  // Placeholder for your fetchHackerNewsData function implementation
  console.log("Fetching Hacker News data with options:", options);

  // create browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to desired page (either today, newest, or past)
  const url = await goToPage(options.url);
  await page.goto(url);

  // save the articles
  const articles = await getArticles(page, options.articles, options.sort);
  console.log('articles', articles)
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
    await fetchHackerNewsData({url: 'today', articles: 10, sort: 'none'});
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
    await fetchHackerNewsData({url: customQuery.page, articles: customQuery.articles, sort: customQuery.sort})
  }
}

// helper functions
// purpose: generate url link
  // parameter: string, returns: string
async function goToPage(url) {
  const options = {
    today: 'https://news.ycombinator.com',
    newest: 'https://news.ycombinator.com/newest',
    past: 'https://news.ycombinator.com/front'
  };
  return options[url]
}

// purpose:
async function getArticles(page, articleCount, sortType) {
  let articles = [];

  // give small time to allow data to load onto screen before i do anything
  await page.waitForTimeout(1000);

  // stop when i have the # of articles requested
  while (articles.length < articleCount) {
  const article = await page.evaluate(() => {
    const results = [];
    const articles = document.querySelectorAll('.athing');

    articles.forEach(element => {
      const titleElement = element.querySelector('.titleline > a');
      const title = titleElement ? titleElement.innerText : 'No title';
      const url = titleElement ? titleElement.href : 'Unknown link';

      const subtextElement = element.nextElementSibling.querySelector('.subtext');
      const authorElement = subtextElement.querySelector('.hnuser');
      const author = authorElement ? authorElement.innerText : 'Unknown Author';

      const timeElement = subtextElement.querySelector('.age');
      const time = timeElement ? timeElement.innerText : 'Unknown time';

      const scoreElement = subtextElement.querySelector('.score');
      const scoreText = scoreElement ? scoreElement.innerText : '0 points';
      const upvotes = parseInt(scoreText.split(' ')[0]) || 0;

      const commentElements = subtextElement.querySelectorAll('a');
      // HTML structure for Hacker News has a lot of a tags, here i just get the LAST one
      const numCommentsText = commentElements.length > 0 ? commentElements[commentElements.length - 1].innerText : '0 comments';
      const numComments = parseInt(numCommentsText.split(' ')[0]) || 0;

      results.push({ title, url, author, time, upvotes, comments: numComments });
    });
    return results;
  })

  // add new articles (30) to my main array
  articles.push(...article)

  // if we have collected enough articles, leave.. otherwise go to next page
  if (articles.length >= articleCount) break;
    const nextPage = await page.$('a.morelink');
    if (nextPage) {
      await nextPage.click();
      await page.waitForNavigation();
    } else {
      break;
    }
  }
  // loop is finished now, we have our articles array
  // now sort
    if (sortType === 'upvotes') {
      articles.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sortType === 'comments') {
      articles.sort((a, b) => b.comments - a.comments);
    }

   // return the top articles based on the articleCount
   return articles.slice(0, articleCount);
}



(async () => {
  await run()
})();
