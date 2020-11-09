class: center, middle

# Frontend Testing Using Selenium

---

# What You Will Learn In This Talk

* How to write tests using Protractor (small API layer on top of WebDriver)
* What to watch out for when writing tests
* How to create and reset test data
* Frontend testing patterns

---

# Rough Idea (The Cake is a Lie)

Race conditions and issues on almost every single line!

```js
it('should find an element by text input model', async () => {
    await browser.get('/some/url');
    
    const username = element(by.css('.username'));
    await username.clear();
    await username.sendKeys('Jane Doe');
    
    const name = element(by.binding('username'));
    
    await expect(name.getText()).toEqual('Jane Doe');
});
```

---

# Bare Minimum Frontend Testing

Library + Browser Driver = 😑 

* Browser Drivers implement the [WebDriver Protocol](https://w3c.github.io/webdriver/) (REST + JSON) and know how to automate the browser
* Language bindings for the WebDriver API are usually maintained under the Selenium umbrella

---

# Utilities Take Care of the Heavy Lifting

Library + Utilities + Browser Driver = 😍

* Selenium Server is an optional proxy to launch and automate the drivers remote or locally
* WebDriverManager handles downloading and installing all relevant executables and browser drivers and itself offers an API to launch the selenium server
* Your test runner (Protractor/WebdriverIO/Nightwatch/etc) is usually a wrapper on top of the Selenium language bindings and your favorite test suite tool (e.g. Jasmine) 

---

# Test Runner Example: Protractor

Comes with built in Angular support and utilities

![](https://www.protractortest.org/img/components.png)

---

# API: Using Locators

Depends on your [abstraction layer](https://www.protractortest.org/#/api?view=ProtractorBy)

```ts
await element(by.tagName('form')).submit();

await element.all(by.tagName('form'))
    .each(async (element) => await element.submit())
```

Accessing attributes and methods depends on your [abstraction layer](https://www.protractortest.org/#/api?view=ElementFinder)

---

# API: Using Drag and Drop

```ts
const from = element(by.css('.draggable'));
const to = element(by.css('.droppable'));
await browser.actions()
    .dragAndDrop(from, to)
    .mouseUp()
    .perform();

await browser.actions()
    .mouseMove(from)
    .mouseDown()
    .mouseMove({x: 150, y: 150})
    .mouseUp()
    .perform();
```

---

# API: Using File Inputs

Path to imported file may vary

```ts
const remote = require('../../../node_modules/selenium-webdriver/remote');
browser.setFileDetector(new remote.FileDetector());
const path = require('path');
const filePath = path.resolve(__dirname, `../../assets/${assetPath}`);
const input = element(by.css('input[type="file"]'));
await input.sendKeys(filePath);
```

---

# API: The Browser 

E.g. Resizing, screenshots, cookies: depends on your [abstraction](https://www.protractortest.org/#/api?view=ProtractorBrowser) [layer](https://www.selenium.dev/documentation/en/webdriver/browser_manipulation/)

```ts
await browser.driver
    .manage()
    .window()
    .setSize(1280, 1280);
```

---

# What Can Go Wrong

```js
it('should find an element by text input model', async () => {
    // js app not initialized or finished loading
    await browser.get('/some/url');
    
    const username = element(by.css('.username'));
    // element not visible or interactable
    await username.clear();
    // different browser input implementations
    await username.sendKeys('Jane Doe');
    
    const name = element(by.css('.username'));
    // js framework state not synced yet
    await expect(name.getText()).toEqual('Jane Doe');
});
```

---

# Solutions: Waiting

```ts
export function urlRegex(regex: RegExp): () => Promise<boolean> {
    return async (): Promise<boolean> => {
        const currentUrl = await browser.driver.getCurrentUrl();
        return regex.test(currentUrl);
    };
}

// inside test case:
await browser.wait(urlRegex(/test$/))
```

More shortcuts are [usually provided by your abstraction layer](https://www.protractortest.org/#/api?view=ProtractorExpectedConditions)

---

# Solutions: Executing Scripts

```ts
export async function scrollToElement(
    locator: ElementFinder
): Promise<void> {
    await browser.wait(EC.presenceOf(locator));
    await browser.executeScript(
        'arguments[0].scrollIntoView();',  
        locator.getWebElement()
    );
    await browser.wait(EC.visibilityOf(locator));
}
```

Return types depend on your [abstraction layer](https://www.protractortest.org/#/api?view=webdriver.WebDriver.prototype.executeScript)

---

# Solutions: Abstracting Form Access

Biggest offenders: [browser native time and date inputs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time)

```ts
export async function setTime(
    locator: ElementFinder,
    value: string | null | undefined
): Promise<void> {
    await scrollToElement(locator);

    if (value !== null && value !== undefined && isChrome) {
        let result = value?.replace(':', '');
        if (/^(0|10|11)/.test(result)) {
            result += 'AM';
        } else {
            result += 'PM';
        }
        await locator.sendKeys(result);
    }
}
```

---

# Solutions: Waiting for JS Frameworks (1/2)

```ts
// your app sets this
window.appIsReady = false;

// your tests define this
export function appIsReady(): () => Promise<boolean> {
    return async (): Promise<boolean> => {
        return await browser.driver.executeScript('window.appIsReady === true')
    };
}

// inside test case:
await browser.wait(appIsReady())
```

---

# Solutions: Waiting for JS Frameworks (2/2)

```html
if (form.isSubmitting) {
    <button type="submit" disabled class="submitting-form">
} else {
    <button type="submit">
}
```
```ts
await element(by.css('button')).click();
const loadingButton = element(by.css('.submitting-form'))
await browser.wait(EC.presenceOf(loadingButton));
await browser.wait(EC.stalenessOf(loadingButton));
```

---

# How to Create and Reset Test Data

Selenium libraries are available for many languages, so it does not matter where you run the test suite from. 

* Run your tests either from the backend so that you can use database transactions
* Connect to your database in your test suite and reset the relevant data
* Use an API client to create/delete data

---

# Patterns: Page Objects (1/2)

Goal: [Separation between test logic and presentation](https://www.selenium.dev/documentation/en/guidelines_and_recommendations/page_object_models/)

```ts
class LoginPage {
    async navigate(): Promise<void> {
        await browser.get("/login")
    }
    
    async login(user: {login: string, password: string}): Promise<void> {
        await setTextValue('username', user.login);
        await setTextValue('password', user.password);
        await submitForm();

        // wait for redirect after login
        await browser.wait(EC.not(
            EC.or(
                EC.urlIs(`${baseUrl}/login`),
                EC.urlIs(`${baseUrl}`)
            ),
        ));
    }
}
```

---

# Patterns: Page Objects (2/2)

```js
it('administrators should have the ' + 
   'cooperative list page as home page', async () => {
    await loginPage.navigate();
    await loginPage.login({
        user: 'test', 
        password: 'password',
    });
    
    await expect(cooperativeListPage.isActive())
        .toBe(true)
});
```



# Questions?
