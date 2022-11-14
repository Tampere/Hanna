# E2E tests

## Local setup

Install the test dependencies on your machine

```sh
$ npm i
```

Start the test stack

```sh
$ docker compose up -d
```

Run the E2E tests

```sh
# Run the tests once
$ npm test

# Run the tests whenever source code is changed
$ npm run watch
```

## Creating a new test case

Start Playwright test generator

```sh
$ npm run codegen
```

Read more about Playwright codegen: https://playwright.dev/docs/codegen
