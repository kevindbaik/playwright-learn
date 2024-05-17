import { chromium } from 'playwright';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import inquirer from 'inquirer';

// script start (UI)
async function run() {
  console.log("🐺 Welcome to QA Wolf's Hacker News Hunt! 🐺");

  // menu option for query:
  const { fetchType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fetchType',
      message: 'Select an option:',
      choices: [
        { name: 'Normal Hunt (Top 10 Articles)', value: 'normal' },
        { name: 'Custom Hunt', value: 'custom' },
      ],
    },
  ]);

   // query option 1: MVP (from directions)
  if (fetchType === 'normal') {
    // call main helper method
    await fetchHackerNewsData({url: 'today', articles: 10, sort: 'default'});
  }
  // query option 2: custom
  else if (fetchType === 'custom') {
    const customQuery = await inquirer.prompt([
      { // get url
        type: 'list',
        name: 'page',
        message: 'Select which page to scrape:',
        choices: [
          { name: 'Hunt Most Popular Articles (Today)', value: 'today' },
          { name: 'Hunt Newest Articles (Today)', value: 'newest' },
          { name: 'Hunt Most Popular Articles (Yesterday)', value: 'past' },
        ],
      },
      { // get number of articles
        type: 'input',
        name: 'articles',
        message: 'Number of articles to hunt:',
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
      { // get sort type
        type: 'list',
        name: 'sort',
        message: 'Select sorting option:',
        choices: [
          { name: 'Default Sorting (None)', value: 'default' },
          { name: 'Sort by Most Votes', value: 'upvotes' },
          { name: 'Sort by Most Comments', value: 'comments' },
        ],
      },
    ]);

    // customQuery object created and looks like: { page : "newest", articles: 30, sort: 'upvotes' }
    await fetchHackerNewsData({url: customQuery.page, articles: customQuery.articles, sort: customQuery.sort})
  }
}

// --------------- helper functions -----------------
// purpose:
// input: object (representing query options)
// output: none
async function fetchHackerNewsData(options) {
  // create browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to desired page (either today, newest, or past)
  const url = await goToPage(options.url);
  console.log(`Helper Wolf 🐺: Going to page: ${url}....`)
  await page.goto(url);

  // save the articles
  console.log(`Helper Wolf 🐺: Hunting ${options.articles} articles, sorted by: ${options.sort}`)
  const articles = await getArticles(page, options.articles, options.sort);

  // save articles to a csv file
  console.log("Helper Wolf 🐺: Creating CSV file....")
  await saveToCsv(articles, 'hacker_news_articles.csv')

  // close browser + end
  await browser.close();
  console.log('Helper Wolf 🐺: Hunt finished. Thanks for stopping by!');
}

// purpose: generate url link
// input: string
// output: string
async function goToPage(url) {
  const options = {
    today: 'https://news.ycombinator.com',
    newest: 'https://news.ycombinator.com/newest',
    past: 'https://news.ycombinator.com/front'
  };
  return options[url]
}

// purpose: retrieves information about articles on a page
// input: playwright page, integer, string
// output: array of objects (of articles)
async function getArticles(page, articleCount, sortType) {
  let articles = [];

  // give second to allow data to load onto screen before i do anything
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

      const scoreElement = subtextElement.querySelector('.score');
      const scoreText = scoreElement ? scoreElement.innerText : '0 points';
      const upvotes = parseInt(scoreText.split(' ')[0]) || 0;

      const commentElements = subtextElement.querySelectorAll('a');
      // HTML structure for Hacker News has a lot of a tags, here i just get the LAST one
      const numCommentsText = commentElements.length > 0 ? commentElements[commentElements.length - 1].innerText : '0 comments';
      const numComments = parseInt(numCommentsText.split(' ')[0]) || 0;

      const timeElement = subtextElement.querySelector('.age');
      const time = timeElement ? timeElement.innerText : 'Unknown time';

      results.push({ title, url, author, upvotes, comments: numComments, time });
    });

    return results;
  })

  // add new articles (30) to my main array
  articles.push(...article)

  // if we have collected enough articles, end.. otherwise go to next page
  if (articles.length >= articleCount) break;

  // find more "button"
  const moreButton = await page.$('a.morelink');
  if (moreButton) {
      await moreButton.click();
      await page.waitForTimeout(2000); // wait another second to allow new articles to load
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
   // return the top articles from start to end (based on the articleCount)
   return articles.slice(0, articleCount);
}

// purpose: creates csv file
// input: array of objects (articles), string
// output: nothing
async function saveToCsv(data, fileName) {
  const csvWriter = createCsvWriter({
    path: fileName,
    header: [
      { id: 'title', title: 'Title' },
      { id: 'url', title: 'URL' },
      { id: 'author', title: 'Author' },
      { id: 'upvotes', title: 'Upvotes' },
      { id: 'comments', title: 'Comments' },
      { id: 'time', title: 'Time' }
    ]
  });

  // organizing data with headers
  const organizedData = data.map(item => ({
    title: item.title,
    url: item.url,
    author: item.author,
    upvotes: item.upvotes,
    comments: item.comments,
    time: item.time
  }));

  csvWriter.writeRecords(organizedData)
    .then(() => {
      console.log(`Helper Wolf 🐺: Data saved to ${fileName}.`);
    })
    .catch(err => {
      console.error('Error writing to CSV file:', err);
    });
}

(async () => {
  await run()
})();
