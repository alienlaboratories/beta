# Express

## Promises

- https://expressjs.com/en/advanced/best-practice-performance.html#use-promises
- https://strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators/

- https://www.npmjs.com/package/express-promise-router

~~~~
app.get('/foo', (req, res, next) => {       // next denotes async.
  return doPromise()                        // TODO(burdon): Is return needed?
    .then((data) => {
      res.end();
    })
    .catch(next)                            // Propagate errors to middleware. (use express-promise-router instead?)
})

app.use(function (err, req, res, next) {
  // Handle error.
})
~~~~
