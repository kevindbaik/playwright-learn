import { test, expect, chromium } from '@playwright/test';

// tests for google chrome
let browser;
let page;

// global setup before test
test.beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto('https://news.ycombinator.com/', { waitUntil: 'networkidle'});
});

// global teardown after test
test.afterAll(async () => {
    await browser.close();
});

// headless mode (commented out because i primarily used for debugging)
// test.use({
//     launchOptions: {
//         headless: false
//     }
// });

// ----------- tests for homepage visibility -----------
test.describe.serial('View Homepage', () => {
    // check correct title
    test('has correct title', async () => {
        await expect(page).toHaveTitle(/Hacker News/);
    });

    // check correct articles count
    test('has 30 articles', async () => {
        await page.waitForSelector('.athing', { timeout: 20000 });
        const articles = page.locator('.athing');
        await expect(articles).toHaveCount(30);
    });

    // check correct navigation headers
    test('has navigation links', async () => {
        // some href value is different to what the link says
        const navLinks = [
            { href: "newest", text: "new" },
            { href: "front", text: "past" },
            { href: "newcomments", text: "comments" },
            { href: "ask", text: "ask" },
            { href: "show", text: "show" },
            { href: "jobs", text: "jobs" },
            { href: "submit", text: "submit" }
        ];

        // iterate through each href and check exists
        for (const link of navLinks) {
            const navLink = page.locator(`a[href="${link.href}"]`);
            await expect(navLink).toBeVisible();
            const linkText = await navLink.textContent();
            expect(linkText).toBe(link.text);
        }
    });

    // check title exists for every article
    test('each article has title', async () => {
        // class name for every tr element for each article
        // 20 second wait before throwing error
        await page.waitForSelector('.athing', { timeout: 20000 });
        const articles =  page.locator('.athing');

        // since i tested earlier for a fixed 30 articles per page
        for (let i = 0; i < 30; i++) {
            const articleTitle = articles.nth(i).locator('.titleline > a:first-child');
            await expect(articleTitle).toBeVisible();
            const titleText = await articleTitle.textContent();
            expect(titleText).not.toBeNull();
            expect(titleText.trim()).not.toBe('');
        }
    });

    // check age exists for every article
    test('each article has age', async () => {
        await page.waitForSelector('.athing', { timeout: 20000 });
        const articles = page.locator('.athing');
        await expect(articles).toHaveCount(30);

        for (let i = 0; i < 30; i++) {
            // sibling represents the other tr element right below "top" tr element that has title (.athing)
            const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
            const subtext = sibling.locator('.subtext');
            const ageElement = subtext.locator('span.age');

            await expect(ageElement).toBeVisible();
            const ageText = await ageElement.textContent();
            expect(ageText).not.toBeNull();
            expect(ageText.trim()).not.toBe('');
        }
    });

    // check source url exists for every article
    test('each article has source site', async () => {
        await page.waitForSelector('.athing', { timeout: 20000 });
        const articles = page.locator('.athing');

        for (let i = 0; i < 30; i++) {
         const titleCell = articles.nth(i).locator('.title');
         const sourceElement = titleCell.locator('.sitestr');
         await expect(sourceElement).toBeVisible();
         const siteText = await sourceElement.textContent();
         expect(siteText).not.toBeNull();
         expect(siteText.trim()).not.toBe('');
        }
    });

    // check hide button exists
    test('each article has hide option', async () => {
        await page.waitForSelector('.athing', { timeout: 20000 });
        const articles = page.locator('.athing');

        for (let i = 0; i < 30; i++) {
            const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
            const subtext = sibling.locator('.subtext');
            const hideLink = subtext.locator('a:has-text("hide")');
            await expect(hideLink).toBeVisible();
        }
    });

    // note: the tests below can FAIL. i wrote them to show possible small "bugs" and/or minor improvements i think the site can make
    // image included in submission showing "bug" encountered and tests for cases

    // these two tests can FAIL for articles with no comments and/or no upvotes
    // instead of "0 comments" and "0 points"... hackernews decides to show nothing if they don't exist (which makes the html look incomplete/buggy)
    //   test('each article has a comments link', async () => {
    //     await page.waitForSelector('.athing', { timeout: 20000 });
    //     const articles = page.locator('.athing');

    //     for (let i = 0; i < 30; i++) {
    //         const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
    //         const subline = sibling.locator('.subline');
    //         const commentsLink = subline.locator('a').last();
    //         await expect(commentsLink).toBeVisible();
    //         const commentsText = await commentsLink.textContent();
    //         expect(commentsText).toContain('comment');
    //     }
    // });

    // test('each article has an upvotes count', async () => {
    //     await page.waitForSelector('.athing', { timeout: 20000 });
    //     const articles = page.locator('.athing');

    //     for (let i = 0; i < 30; i++) {
    //         const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
    //         const subline = sibling.locator('.subline');
    //         const scoreElement = subline.locator('.score');
    //         await expect(scoreElement).toBeVisible();
    //         const scoreText = await scoreElement.textContent();
    //         expect(scoreText).toContain('points');
    //     }
    // });

    // this test can FAIL for some articles not showing an author
    // in order to submit a post a user must be logged in... so an article should always have an author
    // test('each article has an author', async () => {
    //     await page.waitForSelector('.athing', { timeout: 20000 });
    //     const articles = page.locator('.athing');
    //     await expect(articles).toHaveCount(30);

    //     for (let i = 0; i < 30; i++) {
    //         const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
    //         const subline = sibling.locator('.subline');
    //         const authorElement = subline.locator('.hnuser');
    //         await expect(authorElement).toBeVisible();
    //         const authorText = await authorElement.textContent();
    //         expect(authorText).not.toBeNull();
    //         expect(authorText.trim()).not.toBe('');
    //     }
    // });

});


// -----------  tests for interacting with homepage -----------
test.describe.serial('Interact with Homepage', () => {
  // check clicking article directs user to the original url
  test('article titles are clickable and valid', async () => {
      // while testing for clicking buttons, i noticed having a small timeout made testing more consistent
      // without a short pause, website would often throw error for going too fast
      await page.waitForTimeout(4000);
      await page.waitForSelector('.athing', { timeout: 20000 });
      const articles = page.locator('.athing')

      // for the purpose of this assignment i only tested clicking the first 3 articles
      for (let i = 0; i < 2; i++) {
          const articleTitle = articles.nth(i).locator('.title .titleline > a:first-of-type');
          await expect(articleTitle).toBeVisible();

          // thankfully, most of these elements href had url or query to make it very simple to test
          const expectedUrl = await articleTitle.getAttribute('href');

          await Promise.all([
              articleTitle.click(),
              page.waitForNavigation()
          ]);

          const newUrl = page.url();
          expect(newUrl).toBe(expectedUrl);
          await page.goBack();
      }
  });

  // check clicking comments directs user to article post
  test('article comments are clickable and valid', async () => {
      await page.waitForTimeout(4000);
      await page.waitForSelector('.athing', { timeout: 20000 });
      const articles = page.locator('.athing')

      for (let i = 0; i < 2; i++) {
          const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
          const subline = sibling.locator('.subline');
          const commentElement = subline.locator('a').last();

          const queryString = await commentElement.getAttribute('href');

          await Promise.all([
              commentElement.click(),
              page.waitForNavigation()
          ]);

          await expect(page).toHaveURL(`https://news.ycombinator.com/${queryString}`);
          await page.goBack();
      }
  });

  // check clicking author directs user to author profile page
  test('article author is clickable and valid', async () => {
      await page.waitForTimeout(4000);
      await page.waitForSelector('.athing', { timeout: 20000 });
      const articles = page.locator('.athing')

      for (let i = 0; i < 2; i++) {
          const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
          const subline = sibling.locator('.subline');
          const authorElement = subline.locator('.hnuser');

          const queryString = await authorElement.getAttribute('href');

          await Promise.all([
              authorElement.click(),
              page.waitForNavigation()
          ]);

          await expect(page).toHaveURL(`https://news.ycombinator.com/${queryString}`);
          await page.goBack();
      }
  });

  // check clicking age directs user to article post
  test('article age is clickable and valid', async () => {
      await page.waitForTimeout(4000);
      await page.waitForSelector('.athing', { timeout: 20000 });
      const articles = page.locator('.athing')

      for (let i = 0; i < 2; i++) {
          const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
          const subtext = sibling.locator('.subtext');
          const ageElement = subtext.locator('span.age > a');

          const queryString = await ageElement.getAttribute('href');

          await Promise.all([
              ageElement.click(),
              page.waitForNavigation()
          ]);

          await expect(page).toHaveURL(`https://news.ycombinator.com/${queryString}`);
          await page.goBack();
      }
  });

  // check clicking source directs user to all other posts with same source
  test('article source site is clickable and valid', async () => {
      await page.waitForTimeout(4000);
      await page.waitForSelector('.athing', { timeout: 20000 });
      const articles = page.locator('.athing')

      for (let i = 0; i < 2; i++) {
          const titleCell = articles.nth(i).locator('.title');
          const sourceLink = titleCell.locator('.sitebit.comhead > a');

          const queryString = await sourceLink.getAttribute('href');

          await Promise.all([
              sourceLink.click(),
              page.waitForNavigation()
          ]);

          await expect(page).toHaveURL(`https://news.ycombinator.com/${queryString}`);
          await page.goBack();
      }
  });

  // check clicking upvote arrow directs user to post
  test('article upvote arrow is clickable and valid', async () => {
      await page.waitForTimeout(4000);
      await page.waitForSelector('.athing', { timeout: 20000 });
      const articles = page.locator('.athing')

      for (let i = 0; i < 2; i++) {
          const arrowCell = articles.nth(i).locator('.votelinks');
          const arrowLink = arrowCell.locator('center > a');

          const queryString = await arrowLink.getAttribute('href');

          await Promise.all([
              arrowLink.click(),
              page.waitForNavigation()
          ]);

          await expect(page).toHaveURL(`https://news.ycombinator.com/${queryString}`);
          await page.goBack();
      }
  });

  // check clicking hide button works as intended
  test('article hide button is clickable and valid', async () => {
      await page.waitForTimeout(4000);
      await page.waitForSelector('.athing', { timeout: 20000 });
      const articles = page.locator('.athing')

      for (let i = 0; i < 2; i++) {
          const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
          const subtext = sibling.locator('.subtext');
          const hideLink = subtext.locator('a:has-text("hide")');

          const queryString = await hideLink.getAttribute('href');

          await Promise.all([
              hideLink.click(),
              page.waitForNavigation()
          ]);

          await expect(page).toHaveURL(`https://news.ycombinator.com/${queryString}`);
          await page.goBack();
      }
  });

  // check clicking logo directs user to home
  test('article logo is clickable and valid', async () => {
      await page.waitForTimeout(4000);
      await page.waitForSelector('.athing', { timeout: 20000 });

      const logoLink = page.locator('img[src="y18.svg"]').locator('..');
      await expect(logoLink).toBeVisible();

      const url = await logoLink.getAttribute('href');

      await Promise.all([
          logoLink.click(),
          page.waitForNavigation()
      ]);

      await expect(page).toHaveURL(url);
      await page.goBack();
  });

  // check clicking the more button directs user to next page
  test('more (next page) button is clickable and valid', async () => {
      await page.waitForTimeout(4000);
      const url = 'https://news.ycombinator.com';
      await loadPageWithRetries(page, url);

      await page.waitForSelector('a.morelink');
      const moreLink = page.locator('a.morelink');
      const queryString = await moreLink.getAttribute('href');

      await Promise.all([
          moreLink.click(),
          page.waitForNavigation()
      ]);

      await expect(page).toHaveURL(`https://news.ycombinator.com/${queryString}`);
      await page.goBack();
  })

  // check clicking login button directs user to login page
  test('login button is clickable and valid', async () => {
      await page.waitForTimeout(4000);
      const url = 'https://news.ycombinator.com';
      await loadPageWithRetries(page, url);

      await page.waitForSelector('td[style*="text-align:right"] span.pagetop > a');
      const loginLink = page.locator('td[style*="text-align:right"] span.pagetop > a');

      const queryString = await loginLink.getAttribute('href');

      await page.waitForTimeout(4000);
      await Promise.all([
          loginLink.click(),
          page.waitForNavigation()
      ]);

      await expect(page).toHaveURL(`https://news.ycombinator.com/${queryString}`);
      await page.waitForTimeout(4000);
      await page.goBack();
  })
})


// ----------- tests for login/logout feature -----------
test.describe.serial('Login and Logout User', () => {
  // test to create account and get captcha message (since i cant verify captcha)
  test('can create a new account and check for captcha presence', async () => {
      await page.waitForTimeout(4000);
      let url = 'https://news.ycombinator.com/login';
      // navigate to login page
      await loadPageWithRetries(page, url);

      // find the 'create account' form
      const forms = page.locator('form');
      const signupForm = forms.nth(1); // which is the SECOND form on the page

      // selectors based on that specific form
      const usernameSelector = signupForm.locator('input[name="acct"]');
      const passwordSelector = signupForm.locator('input[name="pw"]');
      const submitButtonSelector = signupForm.locator('input[type="submit"][value="create account"]');

      // wait for the username input to be visible and then fill
      await usernameSelector.waitFor({ state: 'visible' });
      const username = 'qawolftester222';
      const password = 'qawolfwoofwoof';
      await usernameSelector.fill(username);

      // wait for the password input to be visible and then fill
      await passwordSelector.waitFor({ state: 'visible' });
      await passwordSelector.fill(password);

      // wait for the submit button to be visible
      await submitButtonSelector.waitFor({ state: 'visible' });

      // add a slight delay before clicking the submit button or else error
      await page.waitForTimeout(2000);

      // click the submit button and wait for navigation
      await Promise.all([
          submitButtonSelector.click(),
          page.waitForNavigation()
      ]);
      await page.waitForTimeout(2000);

      // wait for captcha
      await page.waitForSelector('.g-recaptcha', { state: 'visible', timeout: 20000 });
      // make sure captcha is present
      const captchaFrame = page.locator('.g-recaptcha');
      await expect(captchaFrame).toBeVisible();
  });

  // test to log in with an existing account
  // this test can fail if attempted too much, hackernews requires captcha after frequent login attempts on local device
  test('can log in with existing account and logout', async () => {
      await page.waitForTimeout(4000);
      const url = 'https://news.ycombinator.com/login';
      await loadPageWithRetries(page, url);

      // valid login credentials from last test
      const username = 'wolftester123';
      const password = 'password1';

      await page.waitForSelector('input[name="acct"]', { state: 'visible' });
      await page.fill('input[name="acct"]', username);

      await page.waitForSelector('input[name="pw"]', { state: 'visible' });
      await page.fill('input[name="pw"]', password);

      await page.waitForSelector('input[type="submit"][value="login"]', { state: 'visible' });
      await Promise.all([
          // click the login button
          page.click('input[type="submit"][value="login"]'),
          page.waitForNavigation()
      ]);

      // verify that the login was successful
      await expect(page).toHaveURL('https://news.ycombinator.com');

      // now logout
      await page.waitForSelector("#logout", { timeout: 20000 });
      const logoutLink = page.locator('#logout');
      await expect(logoutLink).toBeVisible();
      await page.waitForTimeout(2000);
      await logoutLink.click();

      // to ensure logout worked, make sure login button is available again
      await page.waitForSelector('td[style*="text-align:right"] span.pagetop > a');
      const loginLink = page.locator('td[style*="text-align:right"] span.pagetop > a');
      await expect(loginLink).toBeVisible();

      await clearData(page);
  });


  // test not being able to login with bad account
  // this test can also fail if attempted too much, hackernews requires captcha after frequent login attempts
  test('cannot log in with invalid credentials', async () => {
      await page.waitForTimeout(4000);
      const url = 'https://news.ycombinator.com/login';
      await loadPageWithRetries(page, url);

      // valid login credentials from last test
      const username = 'invaliduser';
      const password = 'invalidpwd';

      await page.waitForSelector('input[name="acct"]', { state: 'visible' });
      await page.fill('input[name="acct"]', username);

      await page.waitForSelector('input[name="pw"]', { state: 'visible' });
      await page.fill('input[name="pw"]', password);

      await page.waitForSelector('input[type="submit"][value="login"]', { state: 'visible' });
      await page.waitForTimeout(2000);
      await Promise.all([
          page.click('input[type="submit"][value="login"]'),
          page.waitForNavigation()
      ]);

      // should be on same page
      await expect(page).toHaveURL('https://news.ycombinator.com/login');

      await page.waitForTimeout(4000);
      await page.waitForSelector('text=Bad login.', { state: 'visible' });
      // should have error message
      const badLoginMessage = page.locator('text=Bad login.');
      await expect(badLoginMessage).toBeVisible();

      await clearData(page);
  });
})


// writing random additional tests for practice

// check HTML structure consistency
test('HTML structure is consistent', async () => {
    const bodyElement = page.locator('body');
    const bodyInnerHtml = await bodyElement.innerHTML();
    const expectedStructure = /<html>.*<head>.*<\/head>.*<body>.*<table.*>.*<\/table>.*<\/body>.*<\/html>/s;

    expect(bodyInnerHtml).toMatch(expectedStructure);
});

// check if each article has a comment link with the correct format
test('each article has a comment link with correct format', async () => {
await page.waitForSelector('.athing', { timeout: 20000 });
const articles = page.locator('.athing');

for (let i = 0; i < 30; i++) {
    const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
    const subtext = sibling.locator('.subtext');
    const commentLink = subtext.locator('a').nth(3);

    await expect(commentLink).toBeVisible();
    const commentText = await commentLink.textContent();
    expect(commentText).toMatch(/^\d+ comments?$/);
}
});

// check consistency of points formatting
test('each article has points in correct format', async () => {
    await page.waitForSelector('.athing', { timeout: 20000 });
    const articles = page.locator('.athing');

    for (let i = 0; i < 30; i++) {
        const sibling = articles.nth(i).locator('xpath=following-sibling::tr[1]');
        const subtext = sibling.locator('.subtext');
        const pointsElement = subtext.locator('.score');

        await expect(pointsElement).toBeVisible();
        const pointsText = await pointsElement.textContent();
        expect(pointsText).not.toBeNull();
        expect(pointsText.trim()).toMatch(/^\d+ points?$/);
    }
    });

// ------------- retry helper function -------------
// when console logging page.content(), i noticed sometimes i get an error and my data wont load
// so i use a retry helper function which tries again (up to 5 times) and this works
async function loadPageWithRetries(page, url) {
  for (let i = 0; i < 4; i++) {
      await page.goto(url, { waitUntil: 'networkidle' });
      const content = await page.content();
      if (!content.includes("Sorry, we're not able to serve your requests this quickly.")) {
          return;
      }
      console.log(`Attempt ${i + 1} failed. Retrying in 5 seconds...`);
      await page.waitForTimeout(5000);
  }
  throw new Error('Failed to load the page after multiple attempts due to rate limiting.');
}
