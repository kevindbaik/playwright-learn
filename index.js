import { chromium } from 'playwright';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import inquirer from 'inquirer';


async function fetchHackerNewsData({
  pageChoice = 'home',
  articleCount = 10,
  sortVotes = false,
  sortComments = false
}) {
  // Initialize browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the selected page
  await navigateToPage(page, pageChoice);

  console.log('Fetching article details...');
  let articles = await scrapeArticles(page, articleCount);

  // Process articles according to user preference
  articles = sortAndFilterArticles(articles, articleCount, sortVotes, sortComments);

  // Save to CSV
  saveToCsv(articles, 'hacker_news_data.csv');

  await browser.close();
  console.log('Browser closed.');
}

async function navigateToPage(page, choice) {
  const urlMap = {
    home: 'https://news.ycombinator.com',
    latest: 'https://news.ycombinator.com/newest',
    top: 'https://news.ycombinator.com/best'
  };
  await page.goto(urlMap[choice]);
}

async function scrapeArticles(page, count) {
  const pagesToVisit = Math.ceil(count / 30);
  let articles = [];

  for (let i = 0; i < pagesToVisit; i++) {
    const pageArticles = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.athing').forEach(el => {
        const titleLink = el.querySelector('.titleline > a');
        const title = titleLink.textContent;
        const url = titleLink.href;
        const subtext = el.nextElementSibling.querySelector('.subtext');
        const author = subtext.querySelector('.hnuser')?.innerText || 'unknown';
        const time = subtext.querySelector('.age')?.innerText;
        const score = subtext.querySelector('.score')?.innerText;
        const upvotes = score ? parseInt(score.split(' ')[0]) : 0;
        const numComments = subtext.querySelectorAll('a').length > 1 ? parseInt(subtext.querySelectorAll('a')[1].innerText.split(' ')[0]) : 0;
        results.push({ title, url, author, time, upvotes, comments: numComments });
      });
      return results;
    });

    articles.push(...pageArticles);

    if (i < pagesToVisit - 1) {
      await page.click('.morelink');
    }
  }

  return articles;
}

function sortAndFilterArticles(articles, count, sortVotes, sortComments) {
  let filteredArticles = articles.slice(0, count);

  if (sortComments) {
    filteredArticles.sort((a, b) => b.comments - a.comments);
  }
  if (sortVotes) {
    filteredArticles.sort((a, b) => b.upvotes - a.upvotes);
  }

  return filteredArticles;
}

function saveToCsv(data, fileName) {
  const csvWriter = createCsvWriter({
    path: fileName,
    header: [
      { id: 'title', title: 'Title' },
      { id: 'url', title: 'URL' },
      { id: 'author', title: 'Author' },
      { id: 'time', title: 'Time' },
      { id: 'upvotes', title: 'Upvotes' },
      { id: 'comments', title: 'Comments' }
    ]
  });

  csvWriter.writeRecords(data)
    .then(() => {
      console.log(`Data saved to ${fileName}.`);
    });
}

async function start() {
  const { fetchType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fetchType',
      message: 'Select an option:',
      choices: [
        { name: 'Fetch top 10 articles from homepage', value: 'home' },
        { name: 'Custom fetch options', value: 'custom' },
      ],
    },
  ]);

  if (fetchType === 'home') {
    await fetchHackerNewsData({ pageChoice: 'home' });
  } else {
    const customQuery = await inquirer.prompt([
      {
        type: 'list',
        name: 'pageChoice',
        message: 'Select the page to scrape:',
        choices: [
          { name: 'Homepage (url: .../news)', value: 'home' },
          { name: 'Latest News (url: .../newest)', value: 'latest' },
          { name: 'Top Articles (url: .../best)', value: 'top' },
        ],
      },
      {
        type: 'input',
        name: 'articleCount',
        message: 'Number of articles to fetch:',
        default: 10,
        validate: (value) => {
          const valid = !isNaN(parseInt(value));
          return valid || 'Please enter a number';
        },
        filter: (value) => parseInt(value),
      },
      {
        type: 'confirm',
        name: 'sortOptions',
        message: 'Would you like to sort the articles?',
        default: false,
      },
    ]);

    let sortVotes = false;
    let sortComments = false;

    if (customQuery.sortOptions) {
      const sortingPreferences = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'sortVotes',
          message: 'Sort by most votes?',
          default: false,
        },
        {
          type: 'confirm',
          name: 'sortComments',
          message: 'Sort by most comments?',
          default: false,
        },
      ]);
      sortVotes = sortingPreferences.sortVotes;
      sortComments = sortingPreferences.sortComments;
    }

    await fetchHackerNewsData({
      pageChoice: customQuery.pageChoice,
      articleCount: customQuery.articleCount,
      sortVotes,
      sortComments,
    });
  }
}

start();
