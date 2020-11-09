class: center, middle

# Frontend Testing Using Selenium

---

# What You Will Learn In This Talk

* All important APIs
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
* Selenium Server is an optional proxy to launch and automate the drivers remote or locally
* WebDriverManager handles downloading and installing all relevant executables and browser drivers and itself offers an API to launch the selenium server
* Language bindings for the WebDriver API are usually maintained under the Selenium umbrella
* Your test suite (Protractor/WebdriverIO/Nightwatch/etc) is usually a wrapper on top of the Selenium language bindings and your favorite test suite tool (e.g. Jasmine) 

---

# Example: Protractor

![](https://www.protractortest.org/img/components.png)

---
