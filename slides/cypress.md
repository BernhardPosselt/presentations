class: center, middle

# E2E Testing with Cypress

---

# What You Will Learn In This Talk

* Why you should choose Cypress
* How Cypress compares to other E2E tools
* How you write tests
* How retry-ability works
* API issues: what you need to watch out for

---

# The Pitch - Why Choose Cypress

* Fast, easy and **reliable** testing for anything that runs in a browser
* Runs inside a browser/Electron using the Chrome DevTools API and Node on the backend instead of using the web driver API
* Retries on failure until a timeout is reached
* All in one tool: GUI, recording, debugging
* Stepping through browser states when debugging
* Great logging
* Very popular right now and has commercial support and additional paid features

---

# Pitfalls

* Only works with the DevTools API: Edge, Chrome, Firefox
* No Async
* Doesn't feel like native JS
* Strings instead of types for many APIs
* Inconsistent APIs
* Things need to be done the ["Cypress Way"](https://www.cypress.io/blog/2019/01/22/when-can-the-test-click/)
* APIs that look like Promises but don't work that way
* Bad drag and drop API
* Leaky abstraction. You need to understand the details of:
  * retry-ability
  * "awaits"
  * frontend/backend split
  * where to run async code
  * the command queue

---

# Basics

Excerpt from [the Introduction](https://docs.cypress.io/guides/getting-started/writing-your-first-test)

```ts
describe('My First Test', () => {
  it('Gets, types and asserts', () => {
    cy.visit('https://example.cypress.io')

    cy.contains('type').click()

    cy.url().should('include', '/commands/actions')

    cy.get('.action-email')
            .type('fake@email.com')
            .should('have.value', 'fake@email.com')
  })
})
```

---

# Commands

* Only the last failing command chain is retried (there are exceptions)
* You need to know which methods are commands and which are retried

```ts
cy.visit('https://example.cypress.io')  // command

cy.contains('type')  // command
  .click() // command, not retried

cy.url().should('include', '/commands/actions')  // command

cy.get('.action-email')  // command
  .type('fake@email.com').should('have.value', 'fake@email.com') // command
```

---

# Assertions

* Additional things that are tacked onto retryable commands and force retries
* "Waits"
* Stringly-Typed using Mocha like assertions or via callbacks
* Luckily covered by TypeScript string enum overloads

```ts
cy.get('.action-email')
  .should('have.value', 'fake@email.com')

// equivalent:
cy.get('.action-email')
        .should(($elem) => {
            expect($elem.val()).to.eq('fake@email.com')
        })
```

---

# If Everything Is Retried, How Do I Test If Something Exists?

* Get a base element that is sure to exist
* Go off that one using jQuery
* Wrap element back in Cypress to get the Cypress API + retry-ability

```ts
cy.get('base-container')
    .then($elem => {
        if ($elem.length > 0) {
            cy.wrap($elem).click();
        }
    })
```

---

# Asynchronicity

* Async code does not work well with Cypress
* Can kinda only be executed on the Node backend using the tasks API:

```ts
// definitions:
const config: Cypress.PluginConfig = (on) => {
  on('task', {
    async resetDatabase() {
      await resetDatabase(process.env.DB_URL ?? 'localhost');
      return null;  // returning undefined throws an Error!
    },
  })
};

// usage
cy.task('resetDatabase');
```

---

# Command List

* In order to retry commands, Cypress keeps an internal list of things that it should execute
 
```ts
cy.visit('https://example.cypress.io')  // pushed into commands array

cy.contains('type')  // pushed into commands array
  .click() // pushed into commands array
```

* Test will not execute until it actually reaches the very end, meaning the following code will fail spectacularly

```ts
cy.get('button').click()  // this execute after the following 2 lines!
const contents = $('div .greeting').text();
expect(contents).to.eq('Hello');
```

---

# Custom "Promise" like API

* Not compatible with JS promises (e.g. no Promise.all())

```ts
cy.get('button').click()
const contents = $('div .greeting').text();
expect(contents).to.eq('Hello');
```

should become 

```ts
cy.get('button').click()
  .then(() => {
    const contents = $('div .greeting').text();
    expect(contents).to.eq('Hello');  
  })
```

---

# Fixtures

* Used to mock [backend requests](https://docs.cypress.io/guides/guides/network-requests#Fixtures)
* Useful in environments where the backend is too hard to set up

Place file **activities.json into **cypress/fixtures/activities.json**

```ts
cy.intercept('GET', '/activities/*', { fixture: 'activities.json' })
cy.intercept('/search*', [{ item: 'Book 1' }, { item: 'Book 2' }])
```

```ts
cy.intercept('GET', '/activities/*', { fixture: 'activities.json' })
    .as('label')
cy.wait('@label')
    .then(response => {
        // etc
    })
```

---

# Common Things

* File Upload: [cypress-file-upload](https://www.npmjs.com/package/cypress-file-upload) MIT licensed

```ts
cy.get('[data-cy="file-input"]')
  .attachFile('myfixture.json');
```

* Drag and Drop: [cypress-drag-drop](https://www.npmjs.com/package/@4tw/cypress-drag-drop) GPL licensed, doesn't work with every framework

```ts
cy.get('.sourceitem').drag('.targetitem')
```

---

# Quiz: Can You Spot the Bugs

```ts
cy.get('element')
    .should('be.visible')
```

```ts
cy.visit('/')
cy.get('.next-button').click(); // loads next page
cy.get('.next-button').click(); // loads next page
```

```ts
cy.get('.open-calendar').click(); // opens date picker
cy.get('.christmas').click();
```

```ts
cy.get('.content')
  .find('.header').should('contain', 'hi');
```

---

# Should You Use Cypress

Probably, but at some point it will be replaced by a better solution

---

class: center, middle

# Questions?
