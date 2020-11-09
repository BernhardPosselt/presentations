class: center, middle

# Frontend Testing Using Selenium

---

# What You Will Learn In This Talk

* How to write tests using Protractor (small API layer on top of WebDriver)
* What to watch out for when writing tests
* Frontend testing patterns

---

# Rough Idea (The Cake is a Lie)

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

# How Does Selenium Work

* Browser Drivers implement the [WebDriver Protocol](https://w3c.github.io/webdriver/) (REST + JSON) and know how to automate the browser
* Language bindings for the WebDriver API are usually maintained under the Selenium umbrella

---

# Utilities

* Selenium Server is an optional proxy to launch and automate the drivers remote or locally
* WebDriverManager handles downloading and installing all relevant executables and browser drivers and itself offers an API to launch the selenium server
* Your test suite (Protractor/WebdriverIO/Nightwatch/etc) is usually a wrapper on top of the Selenium language bindings and your favorite test suite tool (e.g. Jasmine) 

---

# Example: Protractor

![](https://www.protractortest.org/img/components.png)

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
    
    const name = element(by.binding('username'));
    // js framework state not synced yet
    await expect(name.getText()).toEqual('Jane Doe');
});
```

# Solutions: Waits

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

# Solutions: Abstracting Form Access

```ts
export async function setTime(
    locator: ElementFinder,
    value: string | null | undefined
): Promise<void> {
    await scrollToElement(locator);

    // chrome date input has AM and PM and ignores colons
    if (value !== null && value !== undefined && isChrome) {
        let result = value?.replace(':', '');
        if (/^(0|10|11)/.test(result)) {
            result += 'AM';
        } else {
            result += 'PM';
        }
        await locator.sendKeys(result);
    } else {
        await locator.sendKeys(value);
    }
}
```

Biggest offenders: [browser native time and date inputs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time)

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

# Fixtures

Your local app needs to add and reset test data

Solutions: 
* Run your tests either from the backend so that you can use database transactions
* Connect to your database in your test suite and reset the relevant data
* Use an API client to create/delete data

---

# Questions?
