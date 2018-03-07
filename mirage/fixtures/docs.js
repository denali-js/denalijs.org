// TODO
// - add internal (i.e. not publically supported interface) flag to distinguish from public/private/protected access
// - add since tags
// - add parentClass
// - add parentInterface to interfaces
// - add kind (i.e. class, function, interface) property
// - add file & line to top level api entries
// - method descriptions seem to be missing
// - filenames are missing top level directory
// - add order to guides
export default [
  {
    addon: '@denali-js:core',
    "name": "@denali-js/core",
    "version": "master",
    "pages": {
        "guides/application/actions": {
            "title": "Actions",
            "contents": "\nActions form the core of interacting with a Denali application. They are the\ncontroller layer in the MVC architecture, taking in incoming requests,\nperforming business logic, and handing off to the view or serializer to send the\nresponse.\n\nWhen a request comes in, Denali's [Router](latest/guides/application/routing)\nwill map the method and URL to a particular Action. It will invoke the\n`respond()` method on that class, which is where your application logic\nlives:\n\n```js\nimport ApplicationAction from './application';\nimport Post from '../models/post';\n\nexport default class ShowPost extends ApplicationAction {\n\n  respond({ params }) {\n    return Post.find(params.id);\n  }\n\n}\n```\n\n## The respond method\n\nYour `respond()` method is where you perform any business logic, query the\ndatabase, invoke services such as a mailer, and more.\n\nWhen you are ready to send a response to the inbound HTTP request, you can\ninvoke `this.render()`. In it's simplest form, it will simple respond with a\n200 status code and an empty response body:\n\n```js\nthis.render();\n// HTTP/1.1 200 OK\n```\n\nYou can customize the status code using the first argument:\n\n```js\nthis.render(204)\n// HTTP/1.1 204 Accepted\n```\n\nTo send some data in the response body, pass that data in as the second argument:\n\n```js\nthis.render(200, post);\n// HTTP/1.1 200 OK\n// <...serialized post...>\n```\n\nYou can also pass options to the serializer layer as a third argument. Denali\ndoesn't care about the contents or structure of this options object - it's\nhanded off directly to your serializer.\n\n```js\nthis.render(200, post);\n// HTTP/1.1 200 OK\n// <...serialized post...>\n```\n\nOne scenario is common enough (respond with HTTP 200 and some data) that\nDenali provides a shortcut: just return the data (or a promise that resolves\nwith that data) from your respond method:\n\n```js\nrespond() {\n  return Post.find(1);\n}\n// is the same as:\nrespond() {\n  let post = Post.find(1);\n  this.render(200, post);\n}\n```\n\n### Actions as controllers\n\nActions are probably a bit different than most controllers you might be used\nto. Rather than a single controller class that handles multiple different\nHTTP endpoints, Actions represent just one endpoint (HTTP method + URL).\n\nThis might seem like overkill at first, but it enables powerful declarative\nabstractions now that there is a 1:1 relationship between a class and\nendpoint, as you'll see soon. For a deeper dive into the rationale for Actions\nover traditional controllers, check out the [blog post](FIXME);\n\n## Parameters, request body, and query strings\n\nAn inbound HTTP request carries several different types of data that you\nmight want to access in your action's responder method. Denali makes each of\nthese types of data available under a single object, passed as the sole\nargument to your responder method. Combined with destructuring syntax, this\nlets you quickly and easily get to the data you need:\n\n```js\nrespond({ body, params, query, headers }) {\n  // body - the inbound HTTP request body\n  // params - parameters extracted from dynamic url segments, i.e. /posts/:id -> params.id\n  // query - query params parsed from the querystring, i.e. /posts?sort=id -> query.sort === 'id'\n  // headers - the HTTP headers from the request\n}\n```\n\nThis object passed to your `respond()` method is actually the return value of\nthe Parser that was used to parse the incoming request. The properties show\nin the example above are the convetional ones to include, but Parsers may add\nadditional fields as well. For example, the JSON-API parser adds a `included`\nproperty containing any sideloaded records sent with the primary data in the\nrequest body.\n\n## Filters\n\nActions also support the concept of before and after filters. These are methods\nthat run before or after your responder method. Before filters also have the\nability to render a response and abort the rest of the action handling (i.e.\nskip subsequent before filters and the responder). After filters do not have this ability.\n\nTo add a filter, simply add the method name to the static `before` or `after`\narray on your Action:\n\n```js\nclass CreatePurchase extends Action {\n\n  static before = [\n    'authenticateUser',\n    'confirmBalance'\n  ];\n  static after = 'trackPurchase';\n\n  authenticateUser() {\n    // makes sure the user is logged in\n  }\n\n  confirmBalance() {\n    // make sure the user has money to make the purchase\n  }\n\n  trackPurchase() {\n    // log the purchase in an analytics tool - we do this as an after filter\n    // because there is no reason why this would block the actual purchase\n  }\n\n}\n```\n\nFilters are inherited and accumulated from parent classes and mixins. This\nlets you combine and reuse sets of filters, either through a base class or a\nmixin. For example, want to authenticate all requests against your API? Just\nadd an authentication before filter to your base ApplicationAction, and it\nwill run on all requests:\n\n```js\nclass ApplicationAction extends Action {\n\n  static before = [ 'authenticate' ];\n\n  authenticate() {\n    // This will run before all actions\n  }\n\n}\n```\n\nHere we can start to see the power that comes from modeling endpoints with a\nsingle class rather than multiple endpoints per class.\n\nImagine we have an app where _most_ of our routes need authentication, but a\nhandful don't. We could use a mixin to apply authentication to only the routes\nthat need it:\n\n```js\nclass TransferMoneyAction extends Action.mixin(Authenticate) {\n}\n```\n\nBut now we need to remember to include that mixin every time. Forget once, and\nyou've exposed your app to attackers.\n\nInstead, lets make authentication the default, but allow actions to opt out:\n\n```js\nclass ApplicationAction extends Action {\n\n  static before = [ 'authenticate' ];\n\n  authenticate() {\n    // This allows individual actions to \"opt-out\" of authentication by setting\n    // `protected = false;`\n    if (this.protected !== false) {\n      // authenticate the user\n    }\n\n  }\n\n}\n```\n\nHere, we add authentication to our base ApplicationAction class, which all our\nactions will extend from. This ensures that every action will automatically\nrequire authentication.\n\nBut we also check the `this.protected` flag, which lets an individual action\nopt out of authentication if needed, but in an explicit manner. Much better!\n\nThis example might seem a bit trivial, but it becomes more compelling as we add complexity; imagine we now need to support access based on different roles. With one-class-per-endpoint Actions, it's easy and concise:\n\n```js\nclass TransferMoney extends ApplicationAction {\n\n  allowedRoles = [ 'admin', 'owner' ];\n\n  respond() { /* ... */ }\n\n}\n```\n\nFilters method themselves behave much like responders: they receive the\nparsed request argument, and if they return any value other than null,\nundefined, or a Promise that resolves something other than null or undefined,\nDenali will halt the request processing and attempt to render that value as\nthe response.\n\n> **Note:** this means that you should take extra care with the return values of\n> your filter methods. Accidentally returning a value will cause the request\n> processing to halt prematurely, and Denali will attempt to render that value!\n"
        },
        "guides/application/container": {
            "title": "Container and Dependency Injection",
            "contents": "\nDenali ships with a powerful dependency injection system built into the\nframework, which serves a few goals:\n\n* Make testing easier by allowing tests to inject mocked or stubbed values for\ndependencies rather than hardcoding them.\n* Manage singleton lifecycles\n* Allow tests to automatically parallelized whenever possible\n* Allow addons to supply functionality, without the consuming application\n  knowing exactly which addon is providing it.\n* Decouple the on-disk structure of the application from how dependencies are\n  resolved.\n\nFor most users, this all happens under the hood. The primary way most\napplication code will interact with the dependency injection system is via\n`lookup()`.\n\n## Looking up dependencies\n\nLet's say we have a `CreatePurchase` action, which is responsible for\nsubmitting an order to a third party payment processor and sending a\nconfirmation email upon success. To do this, our action needs to leverage the\n`payment-processor` service to charge a credit card, and the `mailer` service\nto send the email.\n\nUsing `lookup()`, we can supply our action with these dependencies as simple\ninstance properties:\n\n```js\nimport { lookup } from 'denali';\nimport ApplicationAction from `./application';\n\nexport default class CreatePurchase extends ApplicationAction {\n\n  paymentProcessor = lookup('service:payment-processor');\n  mailer = lookup('service:mailer');\n\n  respond({ body }) {\n    await this.paymentProcessor.charge(body.amount, body.cardToken);\n    this.mailer.send('order-confirmation', {\n      amount: body.amount\n    });\n    // ...\n  }\n\n}\n```\n\nAs we can see, the looked up dependencies are available as properties on our\naction instance.\n\n## Injecting dependencies\n\nLooking up dependencies is handy, but one of the real strengths of the\nContainer can be seen when injecting dependencies in tests. Continuing our\nexample from above, let's imagine we try to test our `CreatePurchase` action.\nWithout the Container, that would be tricky - how do we test that code\nwithout actually triggering a real purchase?\n\nWith Denali's Container and `inject()`, you can easily override dependencies\nin your app, allowing you to isolate code and test what really matters:\n\n```js\nimport { setupAcceptanceTest } from '@denali-js/core';\n\nconst test = setupAcceptanceTest();\n\ntest('create purchase charges the card', async (t) => {\n  t.plan(1);\n  let { app, inject } = t.context;\n  inject('service:payment-processor', class extends Service {\n    charge() {\n      t.pass();\n    }\n  });\n  await app.post('/purchases/create', purchaseData);\n});\n```\n\nLet's break this down:\n\n - `t.plan(1)`: this let's Ava (Denali's test runner) know that we expect to\n   have one assertion checked by the end of this test. If the test finishes\n   with no assertions having run, Ava will fail the test.\n - `let { app, inject } = t.context`: Denali's `setupAcceptanceTest` helper\n   adds these properties to the test's context object - we'll use them to carry\n   out our test\n - `inject('service:payment-processor', ...)`: Here's the key - we tell\n   Denali to replace the payment processor service with our own stub. This way,\n   we can ensure the action appropriately invokes the payment processor without\n   actually trigger a real payment\n - `await app.post('/purchases/create', purchaseData)`: Simulates sending an\n   HTTP POST request to the `/purchases/create` endpoint\n\n## Manually registrations\n\nNormally, the container will take requests to lookup a particular dependency\nand figure out how to find that file on the filesystem. However, there are\ncases where you want to add something to the container that isn't represented\nby a file on disk. You can do this via `container.register`.\n\nIn this example, our custom database driver uses a connection pool that the\nentire application needs access to. After the pool is created in an\nintializer as the app boots up, we'll add it to the container so that other\nresources can look it up:\n\n```js\n// config/initializers/setup-database-connection-pool.js\nimport { container } from '@denali-js/core';\nexport default {\n  name: 'setup-database-connection-pool',\n  initialize() {\n    let pool = createDatabaseConnectionPool();\n    container.register('my-custom-db-driver:pool', pool);\n  }\n}\n```\n\nAnd now, elsewhere in the app, any consuer can fetch that reference to the\nconnection pool via `lookup()`:\n\n```js\nlet pool = lookup('my-custom-db-driver:pool');\n```\n\nKeep in mind that when looking up container entries, manually registered\nvalues always take precedence over any matching files on disk."
        },
        "guides/application/errors": {
            "title": "Errors",
            "contents": "\nDenali exposes common HTTP error classes for you to use throughout your app.\nThese error classes provide a standardized way to communicate various failure\nscenarios throughout your entire codebase.\n\nThese errors are automatically created with the correct HTTP status code, and\nDenali will use the status code when sending the response if you return the\nerror from your action's responder method:\n\n```js\nimport { Action, Errors } from '@denali-js/core';\n\nexport default class NotFoundAction extends Action {\n\n  // Will send a 404 Not Found response. The response body will be formatted by\n  // your application serializer.\n  respond() {\n    return new Errors.NotFound('The resource you requested was not found');\n  }\n\n}\n```\n\nAll defined HTTP error status codes (i.e. status codes 400 and above) are\nimplemented. If your action throws, returns, or renders an error that is not a\nsubclass of one of these supplied HTTP error classes, it defaults to a HTTP 500\nstatus code in the response."
        },
        "guides/application/routing": {
            "title": "Routing",
            "contents": "\nRouting in Denali should feel familiar to anyone with experience in modern\nserver side frameworks. Routes are defined in `config/routes.js`.\n\nTo add individual routes, just invoke the appropriate method on the router and\nsupply the URL and action to route to:\n\n```js\n// Routes GET requests to /foo to the FooAction at `app/actions/foo.js`\nrouter.get('/foo', 'foo');\n```\n\nAll the common HTTP verbs are supported.\n\n\n## Resourceful Routing\n\nThe router also exposes a `resource()` method for quickly adding an entire suite\nof endpoints for a given resource (it follows the [JSON-API recommendations for\nURL design](http://jsonapi.org/recommendations/#urls)):\n\n```js\nrouter.resource('post');\n```\n\nwill generate the following routes:\n\n| Endpoint                                      |  Action                   |\n|-----------------------------------------------|---------------------------|\n| `GET     /posts`                              | `posts/list`              |\n| `POST    /posts`                              | `posts/create`            |\n| `GET     /posts/:id`                          | `posts/show`              |\n| `PATCH   /posts/:id`                          | `posts/update`            |\n| `DELETE  /posts/:id`                          | `posts/destroy`           |\n| `GET     /posts/:id/:relation`                | `posts/related`           |\n| `GET     /posts/:id/relationships/:relation`  | `posts/fetch-related`     |\n| `PATCH   /posts/:id/relationships/:relation`  | `posts/replace-related`   |\n| `POST    /posts/:id/relationships/:relation`  | `posts/add-related`       |\n| `DELETE  /posts/:id/relationships/:relation`  | `posts/remove-related`    |\n\nYou can limit the generated routes using the `only` or `except` options:\n\n```js\n// Generates only the list and show actions from the table above\nrouter.resource('post', { only: [ 'list', 'show' ] });\n\n// Generates all the routes from the table above, except for the destroy route\nrouter.resource('post', { except: [ 'destroy' ] });\n\n// Shorthand for except: [ 'related', 'fetch-related', 'replace-related', 'add-related', 'remove-related' ]\nrouter.resource('post', { related: false });\n```\n\n## Namespacing\n\nIf you want to nest a group of routes underneath a common namespace, you can use\nthe `router.namespace()` method. You can either supply a function as a second\nargument, or use the return object to declare your nested routes:\n\n```js\nrouter.namespace('admin', function(adminRouter) {\n  adminRouter.get('products');\n});\n// or ...\nlet adminNamespace = router.namespace('admin');\nadminNamespace.get('products');\n```\n\n"
        },
        "guides/application/services": {
            "title": "Services",
            "contents": "\nServices are long lived singletons in your app that usually expose app-wide\nfunctionality. Some good examples might be a caching service, which maintains a\npersistent connection to a Redis database; or a mailer service, which\ncentralizes the logic for formatting and sending emails.\n\nServices are defined as subclasses of the base `Service` class, and are\nautomatically created as singletons:\n\n```js\nimport { Service } from 'denali';\n\nexport default class CacheService extends Service {\n\n  read() {\n    // ...\n  }\n\n  write() {\n    // ...\n  }\n\n  // ...\n}\n```\n\nOnce you have defined your service, you can use it via injection in any of your\nDenali classes:\n\n```js\nimport { Action, inject } from 'denali';\n\nexport default class CachedAction extends Action {\n\n  cache = inject('service:cache');\n\n  respond() {\n    if (this.cache.has(cacheKey)) {\n      return this.cache.read(cacheKey);\n    }\n    // ...\n  }\n}\n```"
        },
        "guides/configuration/environment": {
            "title": "Environment",
            "contents": "\nThe environment config file (`config/environment.js`) holds the configuration\nthat varies between environments. It should export a function that takes a\nsingle `environment` argument (the string value of the current environment),\nand returns a configuration object populated with whatever values are\nappropriate.\n\nDenali also supports `.env` files - if you create a `.env` file with variables\ndefined one-per-line, `NAME=VALUE`, then those variables will be loaded into\n`process.env` before your `config/environment.js` file is executed:\n\n\n```js\nexport default function environmentConfig(environment) {\n  let config = {\n    server: {\n      port: process.env.PORT || 3000,\n      detached: process.env.DETACHED\n    },\n    database: {\n      url: process.env.DATABASE_URL // <- could be defined in /.env\n    }\n  };\n\n  if (environment === 'development') {\n    // development-specific config\n  }\n\n  if (environment === 'production') {\n    // production-specific config\n\n    // You can start Denali in SSL mode by providing your private key and\n    // certificate, or your pfx file contents\n    //\n    //   config.server.ssl = {\n    //     key: fs.readFileSync('privatekey.pem'),\n    //     cert: fs.readFileSync('certificate.pem')\n    //   };\n    //\n    // or,\n    //\n    //   config.server.ssl = {\n    //     pfx: fs.readFileSync('server.pfx')\n    //   };\n    //\n  }\n\n  return config;\n}\n```"
        },
        "guides/configuration/initializers": {
            "title": "Initializers",
            "contents": "\nInitializers are functions that run after your application is loaded into\nmemory, but before it binds to a port to start accepting connections. It's\nthe ideal spot to do any kind of bootstrapping or setup to get your app ready\nto start serving connections.\n\nInitializers can return a Promise, and the application will wait for it to\nresolve before proceeding to the next initializer (or starting the app if that\nwas the last one).\n\nFor example, here's an initializer that sets up a connection to a hypothetical\ndatabase, and pauses the application startup until the connection is\nestablished:\n\n```js\nimport { Container } from '@denali-js/core';\nimport MyDbManager from 'db-manager';\n\nexport default {\n  name: 'db-connect',\n  initialize(application) {\n    let dbConfig = container.lookup('config:environment').db;\n    let db = new MyDbManager(dbConfig);\n    return new Promise((resolve, reject) => {\n      db.on('connect', resolve);\n      db.on('error', reject);\n    });\n  }\n}\n```\n\n## Initializer order\n\nSometimes you may want an initializer to run before or after another. To let\nDenali know what the order should be, just add a `before` and/or `after` string\nor array of strings with names of other initializers to your initializer object:\n\n```js\nexport default {\n  name: 'sync-schema',\n  before: [\n    'seed-data',\n    'setup-admins'\n  ],\n  after: 'db-connect',\n  initialize() {\n    // the 'db-connect' initializer has completed by this point\n  }\n}\n```\n"
        },
        "guides/configuration/middleware": {
            "title": "Middleware",
            "contents": "\nThe Node community has developed a rich ecosystem of Connect and Express\ncompatible middleware functions. Denali lets you leverage the power of this open\nsource community by providing a simple integration point to plug these\nmiddleware methods in.\n\nThe `config/middleware.js` file exports a function that will be invoked with a\nreference to the application's Router. You can use that reference to add\nmiddleware to the Router via `router.use()`:\n\n```js\n// config/middleware.js\nexport default function middleware(router) {\n  router.use(function (req, res, next) {\n    // ...\n  });\n}\n```\n\nThese middleware are run in the order they are added, before an incoming request\nis handed off to it's Action.\n\n## When to use Middleware vs. Action Before Filters?\n\nA common question is when is it appropriate to implement some functionality\nas a middleware function vs. as an Action before filter. There's no hard and fast rules, but here are a couple suggestions:\n\n - Does the code need to run against only some requests, determined by their\n request URL? If so, then middleware is not a good choice. Middleware is run\n against every incoming request.\n - Does the code need access to the rest of your Denali app? Action filters might be a better choice.\n - Does the code expect the incoming request body to be parsed and ready? Action filters are the better choice - they are run after the parser stage.\n"
        },
        "guides/data/models": {
            "title": "Models",
            "contents": "\nDenali's Models are one of the more unusual aspects of the framework - but\nfear not! They are relatively simple to learn, and quite powerful once you\nunderstand how to use them effectively.\n\nIn Denali, Models are actually thin wrappers over your ORM's own model objects. Denali Models mostly just forward operations on to the underlying ORM, via the ORM Adapter.\n\n## Models do not hide your database\n\nProbably the most important commonly misunderstood concept is that Denali\nModels are there to allow you to swap out databases without refactoring your\napp, or to otherwise hide / abstract away from the details of your database.\n\n**This is incorrect.** In fact, Denali takes the stance that the _goal itself is\na red herring_.\n\nIf your app can swap database A with database B without changing your\napplication code, that must mean:\n\n1. The underlying databases are identical in their querying and storage\n   semantics (rarely the case), or\n2. You were using some lowest common denominator of querying and storage\n   semantics for the two databases that is equivalent across both (which means\n   you weren't using the strengths of your original database)\n\nDenali is built around the assumption that different databases have different\ntradeoffs, and that you should pick the data store best suited to your use case.\nThis means a good data layer should highlight the unique strengths of choice of\na data store, rather than trying to hide any differences behind some kind of\nuniversal interface.\n\nIf you're interested in more of the rationale behind Denali's data layer, and why there is one at all given the situation described above, check out the [blog post](FIXME)\n\n## Defining a Model\n\nModels are defined in the `app/models/` folder. Conventionally, models extend\nfrom a common base, the ApplicationModel:\n\n```js\n// app/models/application.js\nimport { Model } from '@denali-js/core';\n\nexport default class ApplicationModel extends Model {\n  // add any common, application-wide model functionality here\n}\n```\n\nLet's create a basic model representing a blog post:\n\n```js\n// app/models/post.js\nimport { attr } from '@denali-js/core';\nimport ApplicationModel from './application';\n\nexport default class Post extends ApplicationModel {\n\n  static schema = {\n    title: attr('string')\n  };\n\n}\n```\n\nHere we started out by adding a `title` attribute to our Post model's schema.\nWe use the `attr()` method exported by Denali to define an attribute. The\nsingle argument is the data type of that attribute.\n\n### Data Types\n\nDenali provides a common base set of data types for most ORM adapters:\n\n* `string`\n* `number`\n* `date`\n* `boolean`\n* `object`\n\nIn addition to the basic data types, your ORM adapter can support additional,\nmore specialized data types (i.e. `integer` rather than `number`).\n\nKeep in mind that each ORM adapter decides for itself how best to implement\nthese common data types, and it may be more performant to go with an\nORM-specific type in some cases. For example, ORMs for SQL based data stores\nshould implement the `number` data type as a `float` or `double` rather than an\n`integer`, since JavaScript numbers are floating point. But if you know the\nfield should only container integers, you should use `integer` (assuming your\nORM adapter supports it).\n\nThe value of the common base set of data types is that it allows addons that\nmanage data attributes to safely assume a certain subset of data types.\n\n### Relationships\n\nIn addition to basic data attributes, you can also define relationships on\nyour model classes:\n\n```js\n// app/models/post.js\nimport { attr, hasMany, hasOne } from '@denali-js/core';\nimport ApplicationModel from './application';\n\nexport default class Post extends ApplicationModel {\n\n  static schema = {\n    title: attr('text'),\n    comments: hasMany('comment'),\n    author: hasOne('user')\n  }\n\n}\n```\n\nRelationships in Denali might look slightly different than you're used to:\nfor example, there is no explicit `manyToMany()`. This is because Denali's\nModels only need to understand their own side of the relationship. The result\nis that you only need `hasMany` or `hasOne` to define the relationships, and\nyou must define _both sides_ of each relationship.\n\n### Relationship Options\n\nDespite Denali Models only needing to know whether it's a `hasOne` or\n`hasMany` relationship, it's possible your ORM / database needs more\ninformation to setup the relationship. In that case, you can supply it\noptions via a second argument to `hasOne` or `hasMany`.\n\nLet's look at example of how this works:\n\n```js\nexport default class Book extends ApplicationModel {\n  static schema = {\n    editor: hasOne('user', { inverse: 'booksEdited' }),\n    author: hasOne('user', { inverse: 'booksAuthored' })\n```\n\nIn this example, a `Book` has two relationships with `User` - `author` and\n`editor`. Since a `User` can edit or author multiple books, that means the\n`Book` will store the foreign key (i.e. `editor_id` and `author_id`).\n\nNow what happens when you say `user.getBooksAuthored()`? Presumably, we would\nquery the database for all books that have that user's id. But wait - there\nare two spots that might have a user id - `author_id` and `editor_id`.\nThere's not enough information here.\n\nSome ORMs may solve this by asking you to clarify what the inverse side of\nthis relationship looks like (as in the example above). So we pass that in as\nan additional option when we define the schema.\n\nDenali itself doesn't care what's in that object - it just passes it on\nthrough to the ORM for it to use as it wants. For details about what kinds of\noptions are supported, check your ORM adapter's documentation.\n\n## Querying Data\n\nModels expose a few methods for querying data:\n\n```js\n// Find post with id 1\nPost.find(1);\n\n// Find posts that match the filter\nPost.query({ title: 'My cool post' });\n\n// Find posts using ORM specific querying\nPost.query((/* Your ORM can pass in arguments, i.e. a query builder */) => {\n  // You can use ORM-specific syntax here\n});\n\n// Find all posts\nPost.all()\n\n// Find the first post that matches the supplied query (an object or\n// ORM-specific function)\nPost.queryOne()\n```\n\nOnce you have a record, you can read attributes directly:\n\n```js\nlet post = Post.find(1);\nconsole.log(post.title);\n// > \"Denali is a tall mountain\"\n```\n\nTo read related data, you should use the `get[Relationship]` getters:\n\n```js\nlet post = Post.find(1);\nlet author = await post.getAuthor()\nconsole.log(author)\n// <Author:17 name=\"Dave\">\n```\n\nFor one-to-one style relationships, you can use `set[Relationship]` to set\nthe related record. For one-to-many style relationships, you can use\n`set[Relationship]` to replace the entire relationship at once, or\n`add[Relationship]` and `remove[Relationship]` to operate on a single member\nof the relationship at a time.\n\n## Saving Data\n\nModels expose an instance method called `.save()` that returns a promise\nwhich resolves or rejects when the save operation is complete.\n"
        },
        "guides/data/orm-adapters": {
            "title": "ORM Adapters",
            "contents": "\nDenali takes a somewhat unique approach to handling the data layer. Unlike\nmost frameworks, it doesn't come bundled with a \"blessed\" ORM or attempt to\nbuild it's own. Instead, Denali's Model class works with your ORM of choice\nby communicating with it through an ORM Adapter.\n\nThis lets you bring your own ORM to your apps, while still enabling Denali to\nunderstand your data model. This is good news for your app since it lets you\npick the right ORM for the job and leverage the strengths of the specific\ndata store backing your app, rather than relying on a\nlowest-common-denominator data layer.\n\nNormally, you won't need to write your own ORM adapters, you can just use any\nof the community supported ones. However, you may need to familiarize\nyourself with any additional, custom query APIs, data types, etc that the\nadapter may support.\n\n## Available ORM Adapters\n\nSeveral popular ORMs have Denali adapters ready to go. Just add them to your\nproject via `$ denali install <adapter package name>`, and set the `ormAdapter`\nproperty in your `config/environment.js` file to the ORM's name.\n\n* [`node-orm2`](https://github.com/denali-js/denali-node-orm2) (beta)\n* [`objection`](https://github.com/denali-js/denali-objection) (beta)\n* ~~`Sequelize`~~ (coming soon)\n* ~~`Bookshelf`~~ (coming soon)\n\n## Creating an ORM Adapter\n\nWant to use an ORM that doesn't have an adapter yet? It's fairly easy to\nwrite your own! Just extend from [the base `ORMAdapter`\nclass](https://github.com/denali-js/denali/blob/master/lib/data/orm-adapter.ts),\nand implement each of the hooks defined in the base class.\n\nWhen you are ready to test out your adapter, you can use a prebuilt test suite to ensure your adapter is ready for primetime: [@denali-js/adapter-test-suite](FIXME).\n"
        },
        "guides/data/serializers": {
            "title": "Serializers",
            "contents": "\nSince Denali is API focused, it ships with first class primitive for\nrendering JSON response bodies.\n\nAt first, this might seem rather simple: just `JSON.stringify()` and you're\ndone! But in reality, when your app needs to send some data in a response,\nthere are three problems to face:\n\n  1. **What data to send**: you'll often want to send only a subset of your\n  record back (i.e. omitting a hashed password).\n\n  2. **Transforming the data**: you may want to transform the content to make it\n  easier to consume or to match consumer expectations (i.e. change underscore_\n  keys to camelCaseKeys).\n\n  3. **Structuring the data**: what is the structure of the response? Is there a root JSON wrapper? Does it conform to a spec, i.e. JSON-API 1.0?\n\nSerializers address all of these problems. They select what data to send, apply\ntransformations to that data (i.e. renaming keys, serializing values), and\nstructure the result according to a particular output format.\n\nTypically, your API will have a standard output format (i.e. JSON-API 1.0)\nfor all endpoints. A good approach is to pick (or create) a base\nApplicationSerializer class that renders that structure, and extend from that.\n\nWith a base ApplicationSerializer class in place, you'll then create a subclass\nfor each model you have (PostSerializer, UserSerializer, etc). These subclasses\ntell Denali what attributes and relationships should be sent in a response that\ncontains that particular model.\n\n## Rendering data in a response\n\nSerializers render data based on _whitelists_. That means that if you want any\npart of your Model to render into JSON in the response body, you must specify\nit explicitly in that Model's Serializer. This ensures you won't\naccidentally return sensitive data in a response because you forgot to strip it\nout.\n\nSelecting which attributes to render is as simple as adding them to the\nattributes array on your serializer:\n\n```js\nexport default class UserSerializer extends ApplicationSerializer {\n\n  attributes = [ 'firstName', 'lastName' ];\n\n}\n```\n\nThis might seem like an onerous requirment at first, but as applications\ngrow, it's easy to loose track of what is actually rendered out where,\nleading to security leaks as you forget to strip out sensitive information\nfrom response bodies. Serializer whitelists force you to explicitly opt in to\nevery piece of data exposed to the world.\n\n### Automatic whitelisting\n\nFor most applications, we strongly recommend sticking to the above\nwhitelisting approach. However, in rare cases, you may be building an app\nthat has no sensitive data. In fact, the API powering denalijs.org itself is\none such example - some of it's models are operating on purely public data\nfrom the npm registry.\n\nIn these cases, it can be annoying to maintain a whitelist for a model's\nserializer when there is no security risk. Here's a quick trick to\nautomatically whitelist all attributes on a given model:\n\n```js\nimport Post from '../models/post';\n\nexport default PostSerializer extends ApplicationSerializer {\n\n  attributes = Object.keys(Post.attributes);\n\n}\n```\n\nThat will ensure all attributes are immediately whitelisted with the serializer as they are added. **This approach is not recommended for applications dealing with _any_ sensitive data, which is likely most applications out there**.\n\n### Serializing relationships\n\nRelationships are slightly more complex than attributes, mostly because you need to tell the serializer whether to send the entire related model, or just the foriegn keys / references.\n\n```js\nexport default PostSerializer extends ApplicationSerializer {\n  relationships = {\n    comments: {\n      strategy: 'embed',\n      key: 'discussion',\n      serializer: PostCommentSerializer\n    }\n  }\n}\n```\n\nAs seen above, relationships have three main configuration options:\n\n - `strategy`: Valid options are `'embed'` (include the related model data in the response) or `'id'` (only include foreign keys / references). Some serializers may support custom strategies as well.\n - `key`: An override to use a different name for this relationship in the rendered response.\n - `serializer`: A custom serializer to use instead of the default one associated with the related model.\n\nAs a serializer renders the response and encounters relationships, it will\nuse these options, plus other potential custom options it defines, to turn\nyour models into JSON (or even other formats).\n\nWhen using the `'embed'` strategy, the serializer will attempt to lookup the serializer for the related model to ensure it uses the appropriate whitelists when rendering the contents of the related model.\n\n\n# Built-in Serializers\n\nDenali ships with two base serializers out of the box:\n\n  * **JSONSerializer**, which renders models as simple JSON objects or arrays of objects. Related records are directly embedded under their relationship name.\n\n  * **JSONAPISerializer**, a [JSON-API 1.0] compliant serializer with support\n  for meta, links, errors, and more.\n\n"
        },
        "guides/overview/app-structure": {
            "title": "App Structure",
            "contents": "\nDenali follows a \"layered conventions\" philosophy. This means that it\nattempts to provide robust, ergonomic behavior for most users, but allow\nthose with edge cases to drop down to lower levels of abstraction without\nsacrificing the rest of the framework.\n\nThis is reflected in the directory structure and file layout of a Denali\napplication or addon. A minimal app that follows all of Denali's standard\nconventions needs very little code beyond it's core business logic. But, if\nyou want to customize aspects of Denali's conventional behavior, most of that\nis accomplished through extending the right classes in the right files.\n\nThis guide will walk through a complete Denali application, showcasing every file and what it does. But if this is overwhelming - fear not. Most of these files will not be needed by most applications.\n\n## A complete application\n\n```\napp/\n  actions/\n  orm-adapters/\n  parsers/\n  serializers/\n  services/\n  views/\n  application.js\n  logger.js\n  router.js\nblueprints/\n  <blueprint name>/\n    files/\n    index.js\ncommands/\nconfig/\n  initializers/\ndocs/\nlib/\ntest/\n  acceptance/\n  unit/\ndenali-build.js\nindex.js\nresolver.js\n```\n\n## `app/`\n\nHolds the majority of your application code. This is where your actual\nbusiness logic tends to live. All files in this folder are automatically\nloaded into the container, and their directory name is used as the type (i.e.\n`app/foos/bar` would be loaded into the container under `foo:bar`).\n\n### `app/application.js` (optional)\n\nThis file exports the root Application class used by your entire app. You\ngenerally won't need to modify this file, it's typically advanced use cases\nonly.\n\n### `app/logger.js` (optional)\n\nThe logger to use for your app. Add this file and export a class that matches\nthe Denali core logger API to implement your own logging.\n\n### `app/router.js` (optional)\n\nThe router to use for your app. Add this file and export a class that matches\nthe Denali core router API to implement your own router. Note: implementing\nyour own router is **highly discouraged**. This is one of the most core\ncomponents of the Denali framework, and many addons may depend on it's\nexisting behavior. Override with caution.\n\n### `app/actions/`\n\nYour Actions are defined here, representing the controller layer of your application.\n\n### `app/orm-adapters/`\n\nORM Adapters teach Denali how to talk to an ORM library. Most applications\nwon't need to add any files here. When determining which ORM adapter to use,\nModels will look for one that corresponds to their own name (i.e. a `Post`\nmodel will look for `orm-adapters/post.js`). If that isn't found, they'll\nfall back to the `orm-adapters/application.js`. Most applications will only\nuse one ORM adapter, which would be installed as the default when installing\nthe ORM adapter addon.\n\nIn the less common case that you want to use different ORM adapters for\ndifferent models (i.e. you have multiple databases), or you want to customize\na community provided adapter, you can define your own here that will take\nprecedence.\n\n### `app/parsers/`\n\nParsers are responsible for taking incoming requests and transforming them\ninto a consistent format for the rest of your application to use.\n\n### `app/serializers/`\n\nSerializers are responsible for taking the result of your actions and\ntransforming it into a consistent format to send \"over the wire\" to the\nclient.\n\nTypically, you'll have a base ApplicationSerializer, and one Serializer for\neach Model in your application (all inheriting from that base\nApplicationSerializer). This approach allows you to tweak the app-wide\nserializer settings in one place (the base ApplicationSerializer) while\ncustomizing the attribute and relationship whitelists for each Model as\nneeded.\n\n### `app/services/`\n\nTODO ...\n\n### `app/views/`\n\nTODO ...\n\n# `config/`\n\nHolds the declarative and executable configuration for your app. \\*.js files\n(other than `environment.js` and `initializers/*.js`) in this folder will be\nautomatically loaded into the container under their filename (i.e.\n`config/foo.js` will be loaded under `config:foo`).\n\nConfiguration files in Denali tend to be JS files that export a function which\nreturns the configuration object. This gives the app developer greater\nflexibility in constructing configuration: it allows for inter-dependent values\n(i.e. option A depends on the value of option B), and easily using environment\nvariables via `process.env`.\n\nThird party addons can add their own configuration files this way as well.\n\n## `config/environment.js`\n\nThis file holds the configuration that varies per environment (i.e.\ndevelopment vs. staging vs. production database details).\n\n## `config/middleware.js`\n\nThis file exports a function which is invoked with the application's Router\nas its first argument. It lets you add generic Connect-compatible middleware\nto your application that will run _before_ the Router hands off to the\nappropriate action.\n\n## `config/routes.js`\n\nYou define your application's routes in this file. See the [Routing\nguide](fixme) for more details.\n\n# `test/`\n\nThe test suite for your app. See the [integration](../../testing/integration)\nand [unit](fixme) testing guides for more details.\n"
        },
        "guides/overview/introduction": {
            "title": "Introduction",
            "contents": "\nA layered conventions Node.js framework for building ambitious APIs with a\npowerful addon system, best-in-class developer experience, and extensive\ndocumentation.\n\nThere's several types of documentation for Denali:\n\n- **Guides**: these guides try to cover every aspect of building an application with Denali, in detail. Great if you want to learn more about an aspect of the framework.\n- **Quickstart**: walks through building a basic blog backend and covers the big, introductory concepts\n- **API Reference**: a comprehensive reference for all the various classes, methods, and Typescript interfaces exposed by Denali."
        },
        "guides/testing/acceptance": {
            "title": "Acceptance",
            "contents": "\nDenali comes with some testing helpers out of the box to make acceptance\ntesting simpler. Here's a quick sample of what an acceptance test might look\nlike:\n\n```js\nimport { setupAcceptanceTest } from 'denali';\n\nconst test = setupAcceptanceTest();\n\ntest('GET /posts/:id returns the requested post', async (t) => {\n  let app = t.context.app;\n  let { status, body } = await app.post('/posts', {\n    title: 'Climb the mountain!'\n  });\n\n  t.is(body.title, 'Climb the mountain!');\n});\n```\n\n## `setupAcceptanceTest()`\n\nThis is the starting point of the Denali test helpers. When defining an\nacceptance test suite, just add `const test = setupAcceptanceTest()` to the\ntop of the test file to set up your test suite:\n\n```js\nimport { setupAcceptanceTest } from 'denali';\n\nconst test = setupAcceptanceTest();\n\ntest('GET /posts/:id returns the requested post', async (t) => {\n  // ...\n```\n\n`setupAcceptanceTest()` will automatically handle the setup, initialization,\nand teardown of an instance of your Application. It also adds the\n`t.context.app` property to the test suite, and if your ORM adapters support\ntest transactions, will automatically start and rollback a transaction around\nyour test.\n\n## Making test requests\n\nIn your tests, `t.context.app` provides a simple API for interacting with\nyour app in the test environment. In particular, it exposes methods for each\nHTTP verb (i.e. `app.get()`, `app.post()`, etc) which let you simulate a\nrequest to your app.\n\nTo make a test request, it's as simple as:\n\n```js\ntest('lists posts', async (t) => {\n  let { status, body } = await t.context.app.get('/posts');\n  t.is(status, 200);\n  t.true(Array.isArray(body));\n});\n```\n\nThere's a few things to note here:\n\n  * The request method (`app.get`) returns a Promise. Don't forget to\n  await or return that Promise to make sure the test waits for your async\n  activity to finish!\n  * The promise resolves to an object with a `status` and `body` property\n  * If the app responds with a status code >= 500, the request method will\n  reject the promise. If it's < 500, it resolves it. This means that error\n  responses from your API like 401 Unauthorized will result in the test request\n  promise being _resolved_.\n\n### Headers\n\nOften when testing you'll need to manipulate the headers sent with the requests.\nThis is frequently done to manage login / logout state (via the Authorization\nheader). The test app provides a way to do this via `app.setHeader(name,\nvalue)`."
        },
        "guides/testing/unit": {
            "title": "Unit Testing",
            "contents": "\nDenali ships with helpers to quickly and easily setup unit tests for your application:\n\n```js\nimport { setupUnitTest } from 'denali';\n\nconst test = setupUnitTest(() => new FileService(), {\n  'service:aws': true\n});\n\ntest('it saves a file', async (t) => {\n  let { subject, inject, lookup } = t.context;\n  let aws = lookup('service:aws');\n  let fileService = subject();\n  await fileService.save({ ... })\n  t.is(await aws.countFiles(), 1);\n});\n```\n\n## `setupUnitTest()`\n\nThis helper will automatically handle the setup, initialization,\nand teardown of an instance of your unit test.\n\nDenali's approach is to easily allow you to dial in the right amount of isolation for your unit tests. Often, good unit tests end up needing to mock out other dependencies. Denali let's you use your actual app code rather than writing out a mock, if you are short on time:\n\n```js\nconst test = setupUnitTest(() => new FileService(), {\n  'service:aws': true // <-- The \"true\" tells Denali to use the _actual_ AWS service\n});\n```\n\nThen, once you have a mock ready to go, just drop it in:\n\n```js\nconst test = setupUnitTest(() => new FileService(), {\n  'service:aws': MockAWS // <-- now your FileService will get the mock!\n});\n```"
        },
        "guides/utilities/addons": {
            "title": "Addons",
            "contents": "\n**In progress ...**\n\nWe are hard at work fleshing out the remaining docs. Want to help? Just click\nthe \"Improve this page\" link and chip in!\n\n## Installing An Addon\n\nTo install an addon, it must first be published to npm. Once you know what\nthe addon is published as, you can use the install command.\n\n```sh\n$ denali install addon-name\n```\n\n## Generating An Addon\n\nTo generate a new addon project you can use the following command\n\n```sh\n$ denali addon my-addon\n```\n\nThis will create a new directory with all of the necessary files\nto get you started writing your first addon.\n\n## Addon Structure\n\nAddons use a similar structure to a regular app.\n\n- `app` - Anything in this directory will be available on the container in the consuming app.\n- `lib` - Anything you want to add here will have to be explicitly imported.\n"
        },
        "guides/utilities/instrumentation": {
            "title": "Instrumentation",
            "contents": "\n**Coming soon ...**\n\nWe are hard at work fleshing out the remaining docs. Want to help? Just click\nthe \"Improve this page\" link and chip in!\n"
        },
        "guides/utilities/mixins": {
            "title": "Mixins",
            "contents": "\n**Coming soon ...**\n\nWe are hard at work fleshing out the remaining docs. Want to help? Just click\nthe \"Improve this page\" link and chip in!\n"
        },
        "manifest": {
            "contents": "{\n  \"categories\": [\n    {\n      \"dir\": \"overview\",\n      \"name\": \"Overview\",\n      \"guides\": [\n        \"introduction\",\n        \"quickstart\",\n        \"app-structure\"\n      ]\n    },\n    {\n      \"dir\": \"application\",\n      \"name\": \"Application\",\n      \"guides\": [\n        \"routing\",\n        \"actions\",\n        \"services\",\n        \"container\",\n        \"errors\"\n      ]\n    },\n    {\n      \"dir\": \"data\",\n      \"name\": \"Data\",\n      \"guides\": [\n        \"models\",\n        \"serializers\",\n        \"orm-adapters\"\n      ]\n    },\n    {\n      \"dir\": \"testing\",\n      \"name\": \"Testing\",\n      \"guides\": [\n        \"acceptance\",\n        \"unit\"\n      ]\n    },\n    {\n      \"dir\": \"configuration\",\n      \"name\": \"Configuration\",\n      \"guides\": [\n        \"environment\",\n        \"middleware\",\n        \"initializers\"\n      ]\n    },\n    {\n      \"dir\": \"utilities\",\n      \"name\": \"Utilities\",\n      \"guides\": [\n        \"mixins\",\n        \"addons\",\n        \"instrumentation\"\n      ]\n    }\n  ]\n}\n"
        },
        "quickstart": {
            "title": "Quickstart",
            "contents": "\n# Getting Started\n\nIt's everyone's favorite first project for a server side framework: let's build\na basic blogging application!\n\n## Installation\n\nFirst off, let's install the Denali CLI.\n\n```sh\n# Installing with npm\n$ npm install -g @denali-js/cli\n# or, install with yarn\n$ yarn global add @denali-js/cli\n```\n\n## Scaffolding our application\n\n> Note: Denali requires you to use Node 7.0 or greater.\n\nNext, let's use Denali's handy scaffolding tools to create a blank slate for us\nto start from:\n\n```sh\n$ denali new my-blog\ncli v0.0.25 [global]\n\ncreate my-blog/.babelrc\ncreate my-blog/.editorconfig\ncreate my-blog/.env\ncreate my-blog/.eslintignore\ncreate my-blog/.eslintrc\ncreate my-blog/.gitattributes\ncreate my-blog/.nvmrc\ncreate my-blog/.travis.yml\ncreate my-blog/CHANGELOG.md\ncreate my-blog/README.md\ncreate my-blog/app/actions/application.js\ncreate my-blog/app/actions/index.js\ncreate my-blog/app/application.js\ncreate my-blog/app/models/application.js\ncreate my-blog/app/parsers/application.js\ncreate my-blog/app/serializers/application.js\ncreate my-blog/config/environment.js\ncreate my-blog/config/initializers/.gitkeep\ncreate my-blog/config/middleware.js\ncreate my-blog/config/routes.js\ncreate my-blog/denali-build.js\ncreate my-blog/.gitignore\ncreate my-blog/index.js\ncreate my-blog/package.json\ncreate my-blog/test/acceptance/index-test.js\ncreate my-blog/test/unit/.gitkeep\n✔ Dependencies installed\n✔ Git repo initialized\n📦  my-blog created!\n\nTo launch your application, just run:\n\n  $ cd my-blog && denali server\n\n```\n\nGo ahead and follow that last instruction:\n\n```sh\n$ cd my-blog\n$ denali server\ncli v0.1.0 [local] | core v0.1.0 [local]\n✔ my-blog build complete (1.829s)\n[2017-01-12T17:36:52.437Z] INFO - my-blog@0.0.1 server up on port 3000\n```\n\nPerfect! You've got your first Denali app up and running. Now let's see it in\naction. Hit the root endpoint with curl:\n\n```sh\n$ curl localhost:3000\n{\n   \"message\": \"Welcome to Denali!\"\n}\n```\n\n> **Heads up!** Notice that we didn't visit that localhost URL in the browser.\n> That's because Denali is designed to build **APIs** rather than HTML\n> rendering applications. If you are looking for Node framework to build a\n> server rendered web application, you might want to try something like\n> Sails.js or Express.\n\nGreat, we got an app up and running! Now that's cool, but it's not _that_ cool.\nLet's crack open the scaffolded code to see how we got that welcome message, and\nhow to add our own code.\n\n\n### Directory structure\n\nThe `denali new` command did a lot of setup for us. It created the following\ndirectory structure:\n\n```txt\nmy-blog/\n  app/\n    actions/\n      application.js\n      index.js\n    models/\n      application.js\n    parsers/\n      application.js\n    serializers/\n      application.js\n    application.js\n  config/\n    initializers/\n    environment.js\n    middleware.js\n    routes.js\n  test/\n    acceptance/\n      index-test.js\n    helpers/\n    unit/\n    .eslintrc\n  .babelrc\n  .editorconfig\n  .env\n  .eslintignore\n  .eslintrc\n  .gitattributes\n  .gitignore\n  .nvmrc\n  .travis.yml\n  CHANGELOG.md\n  index.js\n  package.json\n  README.md\n```\n\nThere's a lot there, but for now, let's open up the `config/routes.js` to see\nhow that root endpoint is being handled:\n\n```js\n// config/routes.js\nexport default function drawRoutes(router) {\n\n  router.get('/', 'index');\n\n}\n```\n\nThis should look somewhat familiar if you used other web frameworks before.\nThe `router.get('/', 'index')` method tells Denali to respond to `GET /` with\nthe `index` action.\n\nIn `app/actions/index.js`, we can see how that is handled:\n\n```js\n// app/actions/index.js\nimport ApplicationAction from './application';\n\nexport default class IndexAction extends ApplicationAction {\n\n  respond() {\n    this.render(200, { message: 'Welcome to Denali!' }, { serializer: 'json' });\n  }\n\n}\n```\n\nLet's break down what's going on here:\n\n  * `import ApplicationAction from './application';` - we import the\n    `ApplicationAction` to use as our common base class. You could import the\n    base `Action` class from the `@denali-js/core` module directly, but having\n    a base class for all actions in your app is handy (and common convention).\n\n  * `respond()` - the `respond()` method is the meat of any action. It defines\n    how the action responds to an incoming request.\n\n  * `this.render(...)` - tells Denali to render the follow as the response. In\n    this case, it says to render an HTTP 200 status code, with the `message`\n    object as the response body payload.\n\nThe end result here is an action which will always respond with the same JSON\nobject that we saw above: `{ \"message\": \"Welcome to Denali!\" }`.\n\n## Adding a resource\n\nNow let's get a bit more creative. Our blog API is going to need to store and\nretrieve our blog posts. Let's create a `post` resource to enable that.\n\nTo start, let's use that handy scaffolding tool again:\n\n```sh\n$ denali generate resource post\n```\n\nThis scaffold creates several files:\n\n  * A set of **actions** in `app/actions/posts/` for this resource with the\n    basic CRUD operations stubbed out. These files are where you'll implement\n    your application logic to respond to a particular request. We saw these\n    above.\n\n  * A **serializer** to determine how your posts will be rendered in the\n    response. We'll learn more about this in a bit.\n\n  * A **model** to represent your post data structure.\n\n  * A placeholder **acceptance test suite** for this resource. Denali comes with\n    a first-class testing environment ready to go.\n\nIf we open up `app/actions/posts/list.js` now, you can see the stubbed out\nactions:\n\n```js\n  // app/actions/posts/list.js\n  import Post from '../../models/post';\n\n  export default class ListPosts extends ApplicationAction {\n\n    async respond() {\n      return Post.all();\n    }\n\n  }\n```\n\nGreat! So we've got basic CRUD operations ready for our `Post` model. But -\nwhere is all this data going to be stored?\n\n## Working with a database\n\nDenali takes a somewhat unique approach to handling databases. Most\nframeworks ship with some kind of Object Relational Mapper (ORM) baked right\nin, which handles talking to the database for you.\n\nFor a variety of reasons, Denali doesn't ship with it's own ORM. Instead, you\nsupply your own, and you can teach Denali how to use it by installing an ORM\nadapter addon. There's a variety of these for popular Node ORMs, and it's\neasy to make your own as well.\n\nFor now, to make things easier, we'll use the built-in MemoryAdapter.\n\n### The Memory Adapter\n\nTo help us get started, Denali ships with an in-memory ORM adapter, which can be\nuseful for testing and debugging use cases. It's the default ORM for newly\nscaffolded projects, so it's already setup and will be used by default. We'll\nuse it now to get going without needing to setup an actual database.\n\n> **Note:** The provided memory adapter should **not** be used for production\n> applications - data will not be saved across server restarts, and the\n> performance is likely quite poor. It's meant purely for testing and debugging\n> use cases.\n\nWhen you are ready to integrate with a real database, take a look at the various\n[ORM adapters available for Denali](../../data/orm-adapters) for details on\ninstalling and configuring each.\n\n## Working with models\n\nThe resource generator we ran above already added a blank Post model for us in\n`app/models/post.js`. Let's open that up, and add a `title` attribute so we can\nstore the title of each blog post:\n\n```js\n\nimport { attr } from '@denali-js/core';\nimport ApplicationModel from './application';\n\nexport default class Post extends ApplicationModel {\n\n  static schema = {\n    title: attr('strign') // <- add this\n  };\n\n}\n```\n\nOkay, let's break this one down.\n\n```js\nimport { attr } from '@denali-js/core';\nimport ApplicationModel from './application';\n```\n\nFirst up, we follow the same pattern of having a base \"Application\" class that\nwe did with Actions. We also import the `attr()` helper from Denali, which is\nused to define an attribute on the model:\n\n```js\n  static schema = {\n    title: attr('string') // <- add this\n  };\n```\n\nThe static `schema` property defines what attributes and relationships exist\non a Denali model. Here, we add a single attribute, `title`, and tell Denali\nto expect a string value for it.\n\nOver in our `actions/posts/create.js` action, we can let the user create new\nblog posts too. Notice how here we are taking the body of the incoming\nrequest and using that to populate our new Post record.\n\n```js\n  // app/actions/posts/create.js\n  respond({ body }) {\n    return Post.create({ body });\n  }\n```\n\nGreat! Now we can create and list all the Posts in our in-memory data store.\nLet's test it out by first creating a post:\n\n```sh\n$ curl localhost:3000/posts -X POST -d '{\"title\": \"My first post!\"}'\n\n{\n  \"id\": 1\n}\n```\n\nLooks like our Post was created! But if we look closely - our post's title (`\"My\nfirst post!\") wasn't returned. And if we check the post listing endpoint (`GET\n/posts`):\n\n```sh\n$ curl localhost:3000/posts\n\n[\n  {\n    \"id\": 1\n  }\n]\n```\n\nIt's missing there too! **What's going on here?**\n\n## Working with Serializers\n\nThe reason our `title` field was missing was because we didn't tell Denali that\nwe wanted it returned. We do this with serializers.\n\nIn Denali, a serializer takes a payload object (or array), and transforms it\ninto the string of JSON to send back in the response.\n\nBy default, serializers are configured with a whitelist of allowed attributes.\nSince we haven't touched our `post` serializer yet, the `title` attribute isn't\nin that whitelist, so it gets stripped out of all our responses by default.\n\nLet's fix that now by adding it to the whitelist:\n\n```js\n// app/serializers/post.js\nimport ApplicationSerializer from './application';\n\nexport default class PostSerializer extends ApplicationSerializer {\n\n  attributes = [ 'title' ];\n\n}\n```\n\nAnd now let's try to list the posts again:\n\n```sh\n$ curl localhost:3000/posts\n\n[\n  {\n    \"id\": 1,\n    \"title\": \"My first post!\"\n  }\n]\n```\n\nThere it is! Our blog is off to a promising start.\n\n## Next Steps\n\nCongrats, you made it through the quickstart guide. From here, you can:\n\n* Check out the rest of the guides to learn more about the different parts of\n  the framework\n* Dive into the API documentation to get into the gritty details\n* Explore the [heavily commented source\n  code](https://github.com/denali-js/denali)\n"
        }
    },
    "api": {
        "packages": {
            "@denali-js/core": {
                "classes": {
                    "ErrorAction": {
                        "name": "ErrorAction",
                        "description": "The default error action. When Denali encounters an error while processing a request, it will\nattempt to hand off that error to the `error` action, which can determine how to respond. This is\na good spot to do things like report the error to an error-tracking service, sanitize the error\nresponse based on environment (i.e. a full stack trace in dev, but limited info in prod), etc.",
                        "access": "public",
                        "deprecated": false,
                        "file": "app/actions/error.ts",
                        "line": 17,
                        "tags": [
                            {
                                "name": "export",
                                "value": true
                            },
                            {
                                "name": "class",
                                "value": "ErrorAction"
                            },
                            {
                                "name": "extends",
                                "value": "{Action}"
                            }
                        ],
                        "staticProperties": {
                            "after": {
                                "name": "after",
                                "description": "Invoked after the `respond()` method. The framework will invoke filters\nfrom parent classes and mixins in the same order the mixins were applied.\n\nFilters can be synchronous, or return a promise (which will pause the\nbefore/respond/after chain until it resolves).\n\nFilters must be defined as static properties to allow Denali to extract\nthe values. Instance fields are not visible until instantiation, so\nthere's no way to build an \"accumulated\" value from each step in the\ninheritance chain.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 139,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "FilterSpecifier[]",
                                "inherited": true
                            },
                            "before": {
                                "name": "before",
                                "description": "Invoked before the `respond()` method. The framework will invoke filters\nfrom parent classes and mixins in the same order the mixins were applied.\n\nFilters can be synchronous, or return a promise (which will pause the\nbefore/respond/after chain until it resolves).\n\nIf a before filter returns any value (or returns a promise which resolves\nto any value) other than null or undefined, Denali will attempt to render\nthat response and halt further processing of the request (including\nremaining before filters).\n\nFilters must be defined as static properties to allow Denali to extract\nthe values. Instance fields are not visible until instantiation, so\nthere's no way to build an \"accumulated\" value from each step in the\ninheritance chain.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 123,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "FilterSpecifier[]",
                                "inherited": true
                            }
                        },
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "actionPath": {
                                "name": "actionPath",
                                "description": "The path to this action, i.e. 'users/create'",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 187,
                                "tags": [],
                                "type": "string",
                                "inherited": true
                            },
                            "config": {
                                "name": "config",
                                "description": "Application config",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 146,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "ConfigService",
                                "inherited": true
                            },
                            "hasRendered": {
                                "name": "hasRendered",
                                "description": "Track whether or not we have rendered yet",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 182,
                                "tags": [],
                                "type": "boolean",
                                "inherited": true
                            },
                            "logger": {
                                "name": "logger",
                                "access": "public",
                                "deprecated": false,
                                "file": "app/actions/error.ts",
                                "line": 23,
                                "tags": [],
                                "type": "Logger",
                                "inherited": false
                            },
                            "parser": {
                                "name": "parser",
                                "access": "public",
                                "deprecated": false,
                                "file": "app/actions/error.ts",
                                "line": 24,
                                "tags": [],
                                "type": "JSONParser",
                                "inherited": false
                            },
                            "request": {
                                "name": "request",
                                "description": "The incoming Request that this Action is responding to.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 170,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Request",
                                "inherited": true
                            },
                            "response": {
                                "name": "response",
                                "description": "The outgoing HTTP server response",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 177,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "ServerResponse",
                                "inherited": true
                            },
                            "originalAction": {
                                "name": "originalAction",
                                "access": "public",
                                "deprecated": false,
                                "file": "app/actions/error.ts",
                                "line": 19,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "_buildFilterChain": {
                                "name": "_buildFilterChain",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 350,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "name": "stageName"
                                            },
                                            {
                                                "type": "Map<Action, Filter[]>",
                                                "name": "cache"
                                            },
                                            {
                                                "type": "Action[]",
                                                "name": "prototypes"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "_buildFilterChains": {
                                "name": "_buildFilterChains",
                                "description": "Walk the prototype chain of this Action instance to find all the `before`\nand `after` arrays to build the complete filter chains.\n\nCaches the result on the child Action class to avoid the potentially\nexpensive prototype walk on each request.\n\nThrows if it encounters the name of a filter method that doesn't exist.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 337,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "inline literal"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "_invokeFilters": {
                                "name": "_invokeFilters",
                                "description": "Invokes the filters in the supplied chain in sequence.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 310,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Filter[]",
                                                "name": "chain"
                                            },
                                            {
                                                "type": "ResponderParams",
                                                "name": "parsedRequest"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "render": {
                                "name": "render",
                                "description": "Render the response body",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 194,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "number",
                                                "name": "status"
                                            },
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "respond": {
                                "name": "respond",
                                "description": "Respond with JSON by default",
                                "access": "public",
                                "deprecated": false,
                                "file": "app/actions/error.ts",
                                "line": 29,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "inline literal",
                                                "name": "__namedParameters"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "run": {
                                "name": "run",
                                "description": "Invokes the action. Determines the best responder method for content\nnegotiation, then executes the filter/responder chain in sequence,\nhandling errors and rendering the response.\n\nYou shouldn't invoke this directly - Denali will automatically wire up\nyour routes to this method.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 255,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Request",
                                                "name": "request"
                                            },
                                            {
                                                "type": "ServerResponse",
                                                "name": "response"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    },
                    "IndexAction": {
                        "name": "IndexAction",
                        "access": "public",
                        "deprecated": false,
                        "file": "app/actions/index.ts",
                        "line": 3,
                        "tags": [],
                        "staticProperties": {
                            "after": {
                                "name": "after",
                                "description": "Invoked after the `respond()` method. The framework will invoke filters\nfrom parent classes and mixins in the same order the mixins were applied.\n\nFilters can be synchronous, or return a promise (which will pause the\nbefore/respond/after chain until it resolves).\n\nFilters must be defined as static properties to allow Denali to extract\nthe values. Instance fields are not visible until instantiation, so\nthere's no way to build an \"accumulated\" value from each step in the\ninheritance chain.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 139,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "FilterSpecifier[]",
                                "inherited": true
                            },
                            "before": {
                                "name": "before",
                                "description": "Invoked before the `respond()` method. The framework will invoke filters\nfrom parent classes and mixins in the same order the mixins were applied.\n\nFilters can be synchronous, or return a promise (which will pause the\nbefore/respond/after chain until it resolves).\n\nIf a before filter returns any value (or returns a promise which resolves\nto any value) other than null or undefined, Denali will attempt to render\nthat response and halt further processing of the request (including\nremaining before filters).\n\nFilters must be defined as static properties to allow Denali to extract\nthe values. Instance fields are not visible until instantiation, so\nthere's no way to build an \"accumulated\" value from each step in the\ninheritance chain.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 123,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "FilterSpecifier[]",
                                "inherited": true
                            }
                        },
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "actionPath": {
                                "name": "actionPath",
                                "description": "The path to this action, i.e. 'users/create'",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 187,
                                "tags": [],
                                "type": "string",
                                "inherited": true
                            },
                            "config": {
                                "name": "config",
                                "description": "Application config",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 146,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "ConfigService",
                                "inherited": true
                            },
                            "hasRendered": {
                                "name": "hasRendered",
                                "description": "Track whether or not we have rendered yet",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 182,
                                "tags": [],
                                "type": "boolean",
                                "inherited": true
                            },
                            "logger": {
                                "name": "logger",
                                "description": "Automatically inject the logger into all actions",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 163,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Logger",
                                "inherited": true
                            },
                            "parser": {
                                "name": "parser",
                                "description": "Force which parser should be used for parsing the incoming request.\n\nBy default it uses the application parser, but you can override with the\nname of the parser you'd rather use instead.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 156,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Parser",
                                "inherited": true
                            },
                            "request": {
                                "name": "request",
                                "description": "The incoming Request that this Action is responding to.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 170,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Request",
                                "inherited": true
                            },
                            "response": {
                                "name": "response",
                                "description": "The outgoing HTTP server response",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 177,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "ServerResponse",
                                "inherited": true
                            }
                        },
                        "methods": {
                            "_buildFilterChain": {
                                "name": "_buildFilterChain",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 350,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "name": "stageName"
                                            },
                                            {
                                                "type": "Map<Action, Filter[]>",
                                                "name": "cache"
                                            },
                                            {
                                                "type": "Action[]",
                                                "name": "prototypes"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "_buildFilterChains": {
                                "name": "_buildFilterChains",
                                "description": "Walk the prototype chain of this Action instance to find all the `before`\nand `after` arrays to build the complete filter chains.\n\nCaches the result on the child Action class to avoid the potentially\nexpensive prototype walk on each request.\n\nThrows if it encounters the name of a filter method that doesn't exist.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 337,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "inline literal"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "_invokeFilters": {
                                "name": "_invokeFilters",
                                "description": "Invokes the filters in the supplied chain in sequence.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 310,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Filter[]",
                                                "name": "chain"
                                            },
                                            {
                                                "type": "ResponderParams",
                                                "name": "parsedRequest"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "render": {
                                "name": "render",
                                "description": "Render the response body",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 194,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "number",
                                                "name": "status"
                                            },
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "respond": {
                                "name": "respond",
                                "access": "public",
                                "deprecated": false,
                                "file": "app/actions/index.ts",
                                "line": 5,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "run": {
                                "name": "run",
                                "description": "Invokes the action. Determines the best responder method for content\nnegotiation, then executes the filter/responder chain in sequence,\nhandling errors and rendering the response.\n\nYou shouldn't invoke this directly - Denali will automatically wire up\nyour routes to this method.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 255,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Request",
                                                "name": "request"
                                            },
                                            {
                                                "type": "ServerResponse",
                                                "name": "response"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    },
                    "MyAddonAddon": {
                        "name": "MyAddonAddon",
                        "access": "public",
                        "deprecated": false,
                        "file": "app/addon.ts",
                        "line": 3,
                        "tags": [],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {},
                        "methods": {}
                    },
                    "ErrorView": {
                        "name": "ErrorView",
                        "access": "public",
                        "deprecated": false,
                        "file": "app/views/error.ts",
                        "line": 59,
                        "tags": [],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {},
                        "methods": {
                            "render": {
                                "name": "render",
                                "access": "public",
                                "deprecated": false,
                                "file": "app/views/error.ts",
                                "line": 61,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "ServerResponse",
                                                "name": "response"
                                            },
                                            {
                                                "type": "any",
                                                "name": "error"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    },
                    "Resolver": {
                        "name": "Resolver",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/metal/resolver.ts",
                        "line": 18,
                        "tags": [],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "debug": {
                                "name": "debug",
                                "description": "The debug logger instance for this resolver - we create a separate\ninstance per resolver to make it easier to trace resolutions.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 29,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "loader": {
                                "name": "loader",
                                "description": "The loader scope to retrieve from",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 23,
                                "tags": [],
                                "type": "Loader",
                                "inherited": false
                            },
                            "name": {
                                "name": "name",
                                "description": "The name of this resolver - typically the addon name",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 36,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "registry": {
                                "name": "registry",
                                "description": "The internal cache of available references",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 41,
                                "tags": [],
                                "type": "Registry",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "_availableForType": {
                                "name": "_availableForType",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 145,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "prefix"
                                            }
                                        ],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "_retrieve": {
                                "name": "_retrieve",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 90,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "string",
                                                "name": "entry"
                                            },
                                            {
                                                "type": "string",
                                                "name": "relativepath"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "availableForApp": {
                                "name": "availableForApp",
                                "description": "App files are found in `app/*`",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 162,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "string",
                                                "name": "entry"
                                            }
                                        ],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "availableForConfig": {
                                "name": "availableForConfig",
                                "description": "Config files are found in the `config/` folder. Initializers are _not_ included in this group",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 169,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            }
                                        ],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "availableForInitializer": {
                                "name": "availableForInitializer",
                                "description": "Initializers files are found in the `config/initializers/` folder",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 176,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            }
                                        ],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "availableForOther": {
                                "name": "availableForOther",
                                "description": "Unknown types are assumed to exist in the `app/` folder",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 155,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            }
                                        ],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "availableForType": {
                                "name": "availableForType",
                                "description": "Returns an array of entry names that are available from this resolver for\nthe given type.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 129,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "register": {
                                "name": "register",
                                "description": "Manually add a member to this resolver. Manually registered members take\nprecedence over any retrieved from the filesystem. This same pattern\nexists at the container level, but having it here allows an addon to\nspecify a manual override _for it's own scope_, but not necessarily force\nit onto the consuming application",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 59,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "specifier"
                                            },
                                            {
                                                "type": "any",
                                                "name": "value"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "retrieve": {
                                "name": "retrieve",
                                "description": "Fetch the member matching the given parsedName. First checks for any\nmanually registered members, then falls back to type specific retrieve\nmethods that typically find the matching file on the filesystem.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 71,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "specifier"
                                            }
                                        ],
                                        "return": {
                                            "type": "T"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "retrieveApp": {
                                "name": "retrieveApp",
                                "description": "App files are found in `app/*`",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 105,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "string",
                                                "name": "entry"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "retrieveConfig": {
                                "name": "retrieveConfig",
                                "description": "Config files are found in `config/`",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 112,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "string",
                                                "name": "entry"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "retrieveInitializer": {
                                "name": "retrieveInitializer",
                                "description": "Initializer files are found in `config/initializers/`",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 119,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "string",
                                                "name": "entry"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "retrieveOther": {
                                "name": "retrieveOther",
                                "description": "Unknown types are assumed to exist underneath the `app/` folder",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/resolver.ts",
                                "line": 98,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "string",
                                                "name": "entry"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "View": {
                        "name": "View",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/render/view.ts",
                        "line": 5,
                        "tags": [],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {},
                        "methods": {
                            "render": {
                                "name": "render",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/view.ts",
                                "line": 7,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "ServerResponse",
                                                "name": "response"
                                            },
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    },
                    "ConfigService": {
                        "name": "ConfigService",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/config.ts",
                        "line": 5,
                        "tags": [],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "_config": {
                                "name": "_config",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 7,
                                "tags": [],
                                "type": "AppConfig",
                                "inherited": false
                            },
                            "environment": {
                                "name": "environment",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 9,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "get": {
                                "name": "get",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 14,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "T3",
                                                "name": "p3"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2][T3]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "T3",
                                                "name": "p3"
                                            },
                                            {
                                                "type": "T4",
                                                "name": "p4"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2][T3][T4]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "T3",
                                                "name": "p3"
                                            },
                                            {
                                                "type": "T4",
                                                "name": "p4"
                                            },
                                            {
                                                "type": "T5",
                                                "name": "p5"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2][T3][T4][T5]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "T3",
                                                "name": "p3"
                                            },
                                            {
                                                "type": "T4",
                                                "name": "p4"
                                            },
                                            {
                                                "type": "T5",
                                                "name": "p5"
                                            },
                                            {
                                                "type": "T6",
                                                "name": "p6"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2][T3][T4][T5][T6]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "T3",
                                                "name": "p3"
                                            },
                                            {
                                                "type": "T4",
                                                "name": "p4"
                                            },
                                            {
                                                "type": "T5",
                                                "name": "p5"
                                            },
                                            {
                                                "type": "T6",
                                                "name": "p6"
                                            },
                                            {
                                                "type": "T7",
                                                "name": "p7"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2][T3][T4][T5][T6][T7]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "getWithDefault": {
                                "name": "getWithDefault",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 28,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "any",
                                                "name": "defaultValue"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "any",
                                                "name": "defaultValue"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "T3",
                                                "name": "p3"
                                            },
                                            {
                                                "type": "any",
                                                "name": "defaultValue"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2][T3]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "T3",
                                                "name": "p3"
                                            },
                                            {
                                                "type": "T4",
                                                "name": "p4"
                                            },
                                            {
                                                "type": "any",
                                                "name": "defaultValue"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2][T3][T4]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "T3",
                                                "name": "p3"
                                            },
                                            {
                                                "type": "T4",
                                                "name": "p4"
                                            },
                                            {
                                                "type": "T5",
                                                "name": "p5"
                                            },
                                            {
                                                "type": "any",
                                                "name": "defaultValue"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2][T3][T4][T5]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "T3",
                                                "name": "p3"
                                            },
                                            {
                                                "type": "T4",
                                                "name": "p4"
                                            },
                                            {
                                                "type": "T5",
                                                "name": "p5"
                                            },
                                            {
                                                "type": "T6",
                                                "name": "p6"
                                            },
                                            {
                                                "type": "any",
                                                "name": "defaultValue"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2][T3][T4][T5][T6]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "T1",
                                                "name": "p1"
                                            },
                                            {
                                                "type": "T2",
                                                "name": "p2"
                                            },
                                            {
                                                "type": "T3",
                                                "name": "p3"
                                            },
                                            {
                                                "type": "T4",
                                                "name": "p4"
                                            },
                                            {
                                                "type": "T5",
                                                "name": "p5"
                                            },
                                            {
                                                "type": "T6",
                                                "name": "p6"
                                            },
                                            {
                                                "type": "T7",
                                                "name": "p7"
                                            },
                                            {
                                                "type": "any",
                                                "name": "defaultValue"
                                            }
                                        ],
                                        "return": {
                                            "type": "S[T1][T2][T3][T4][T5][T6][T7]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    }
                },
                "interfaces": {
                    "ContainerOptions": {
                        "name": "ContainerOptions",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/metal/container.ts",
                        "line": 14,
                        "tags": [],
                        "properties": {
                            "fallbacks": {
                                "name": "fallbacks",
                                "description": "What should the container fallback to if it's unable to find a specific\nentry under the given type? This is used to allow for the common\n\"application\" fallback entry, i.e. if you don't define a model-specific\nORM adapter, then because the `orm-adapter` type has `fallbacks: [\n'application' ]`, the container will return the ApplicationORMAdapter\ninstead.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 28,
                                "tags": [],
                                "type": "string[]",
                                "inherited": false
                            },
                            "singleton": {
                                "name": "singleton",
                                "description": "The container should treat the member as a singleton. If true, the\ncontainer will create that singleton on the first lookup.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 19,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "MixinApplicator": {
                        "name": "MixinApplicator",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/metal/mixin.ts",
                        "line": 3,
                        "tags": [],
                        "properties": {
                            "_args": {
                                "name": "_args",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/mixin.ts",
                                "line": 5,
                                "tags": [],
                                "type": "any[]",
                                "inherited": false
                            },
                            "_factory": {
                                "name": "_factory",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/mixin.ts",
                                "line": 6,
                                "tags": [],
                                "type": "MixinFactory<T, U>",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "MixinFactory": {
                        "name": "MixinFactory",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/metal/mixin.ts",
                        "line": 9,
                        "tags": [],
                        "properties": {},
                        "methods": {}
                    },
                    "AvailableForTypeMethod": {
                        "name": "AvailableForTypeMethod",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/metal/resolver.ts",
                        "line": 12,
                        "tags": [],
                        "properties": {},
                        "methods": {}
                    },
                    "Context": {
                        "name": "Context",
                        "description": "Used internally to simplify passing arguments required by all functions.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/render/json-api.ts",
                        "line": 37,
                        "tags": [],
                        "properties": {
                            "action": {
                                "name": "action",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 38,
                                "tags": [],
                                "type": "Action",
                                "inherited": false
                            },
                            "body": {
                                "name": "body",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 39,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "document": {
                                "name": "document",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 41,
                                "tags": [],
                                "type": "JSONAPI.Document",
                                "inherited": false
                            },
                            "options": {
                                "name": "options",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 40,
                                "tags": [],
                                "type": "Options",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "Options": {
                        "name": "Options",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/render/json-api.ts",
                        "line": 16,
                        "tags": [],
                        "properties": {
                            "attributes": {
                                "name": "attributes",
                                "description": "Override which attributes should be serialized.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 67,
                                "tags": [],
                                "type": "string[]",
                                "inherited": true
                            },
                            "included": {
                                "name": "included",
                                "description": "An array of Models you want to ensure are included in the \"included\" sideload. Note that the\nspec requires \"full-linkage\" - i.e. any Models you include here must be referenced by a\nresource identifier elsewhere in the payload - to maintain full compliance.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 22,
                                "tags": [],
                                "type": "Model[]",
                                "inherited": false
                            },
                            "links": {
                                "name": "links",
                                "description": "Any top level links to send with the response.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 30,
                                "tags": [],
                                "type": "JSONAPI.Links",
                                "inherited": false
                            },
                            "meta": {
                                "name": "meta",
                                "description": "Any top level metadata to send with the response.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 26,
                                "tags": [],
                                "type": "JSONAPI.Meta",
                                "inherited": false
                            },
                            "relationships": {
                                "name": "relationships",
                                "description": "Override which relationships should be serialized.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 71,
                                "tags": [],
                                "type": "RelationshipConfigs",
                                "inherited": true
                            },
                            "serializer": {
                                "name": "serializer",
                                "description": "Explicitly set the name of the serializer that should be used to render\nthis response. If not provided, and the response body is a Model or array\nof Models, it will try to find a matching serializer and use that. If it\ncan't find the matching serializer, or if the response body is another\nkind of object, it will fall back to the application serializer.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 63,
                                "tags": [],
                                "type": "string",
                                "inherited": true
                            },
                            "view": {
                                "name": "view",
                                "description": "The view class that should be used to render this response. Overrides the\n`serializer` setting. This is useful if you want complete, low-level\ncontrol over the rendering process - you'll have direct access to the\nresponse object, and can use it to render however you want. Render with a\nstreaming JSON renderer, use an HTML templating engine, a binary protocol,\netc.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 55,
                                "tags": [],
                                "type": "string",
                                "inherited": true
                            }
                        },
                        "methods": {}
                    },
                    "RelationshipConfig": {
                        "name": "RelationshipConfig",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/render/serializer.ts",
                        "line": 8,
                        "tags": [],
                        "properties": {
                            "key": {
                                "name": "key",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 10,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "serializer": {
                                "name": "serializer",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 11,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "strategy": {
                                "name": "strategy",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 9,
                                "tags": [],
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "RelationshipConfigs": {
                        "name": "RelationshipConfigs",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/render/serializer.ts",
                        "line": 14,
                        "tags": [],
                        "properties": {},
                        "methods": {}
                    },
                    "Filter": {
                        "name": "Filter",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/action.ts",
                        "line": 78,
                        "tags": [],
                        "properties": {},
                        "methods": {}
                    },
                    "RenderOptions": {
                        "name": "RenderOptions",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/action.ts",
                        "line": 46,
                        "tags": [],
                        "properties": {
                            "attributes": {
                                "name": "attributes",
                                "description": "Override which attributes should be serialized.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 67,
                                "tags": [],
                                "type": "string[]",
                                "inherited": false
                            },
                            "relationships": {
                                "name": "relationships",
                                "description": "Override which relationships should be serialized.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 71,
                                "tags": [],
                                "type": "RelationshipConfigs",
                                "inherited": false
                            },
                            "serializer": {
                                "name": "serializer",
                                "description": "Explicitly set the name of the serializer that should be used to render\nthis response. If not provided, and the response body is a Model or array\nof Models, it will try to find a matching serializer and use that. If it\ncan't find the matching serializer, or if the response body is another\nkind of object, it will fall back to the application serializer.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 63,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "view": {
                                "name": "view",
                                "description": "The view class that should be used to render this response. Overrides the\n`serializer` setting. This is useful if you want complete, low-level\ncontrol over the rendering process - you'll have direct access to the\nresponse object, and can use it to render however you want. Render with a\nstreaming JSON renderer, use an HTML templating engine, a binary protocol,\netc.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 55,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "Responder": {
                        "name": "Responder",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/action.ts",
                        "line": 21,
                        "tags": [],
                        "properties": {},
                        "methods": {}
                    },
                    "ResponderParams": {
                        "name": "ResponderParams",
                        "description": "The parser determines the exact shape and structure of the arguments object\npassed into your Action's respond method. However, the common convention is\nto at least expose the properties listed below.\n\n*Note for Typescript users:*\n\nIt's possible to have a parser that returns a query object with non-string\nproperties (i.e. your parser automatically converts the `page=4` query param\ninto a number). In that case, you should probably define your own interface\nthat extends from this, and use that interface to type your respond method\nargument.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/action.ts",
                        "line": 38,
                        "tags": [],
                        "properties": {
                            "body": {
                                "name": "body",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 39,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "headers": {
                                "name": "headers",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 41,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "params": {
                                "name": "params",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 42,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "query": {
                                "name": "query",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 40,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "AddonConfigBuilder": {
                        "name": "AddonConfigBuilder",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/application.ts",
                        "line": 19,
                        "tags": [],
                        "properties": {},
                        "methods": {}
                    },
                    "AppConfigBuilder": {
                        "name": "AppConfigBuilder",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/application.ts",
                        "line": 15,
                        "tags": [],
                        "properties": {},
                        "methods": {}
                    },
                    "Initializer": {
                        "name": "Initializer",
                        "description": "Initializers are run before the application starts up. You are given the\napplication instance, and if you need to perform async operations, you can\nreturn a Promise. You can configure initializer order by specifying the\nnames of initializers that should come before or after your initializer.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/application.ts",
                        "line": 39,
                        "tags": [
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "properties": {
                            "after": {
                                "name": "after",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 42,
                                "tags": [],
                                "inherited": false
                            },
                            "before": {
                                "name": "before",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 41,
                                "tags": [],
                                "inherited": false
                            },
                            "name": {
                                "name": "name",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 40,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "initialize": {
                                "name": "initialize",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 43,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Application",
                                                "name": "application"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "MiddlewareBuilder": {
                        "name": "MiddlewareBuilder",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/application.ts",
                        "line": 23,
                        "tags": [],
                        "properties": {},
                        "methods": {}
                    },
                    "RoutesMap": {
                        "name": "RoutesMap",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/application.ts",
                        "line": 27,
                        "tags": [],
                        "properties": {},
                        "methods": {}
                    },
                    "AppConfig": {
                        "name": "AppConfig",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/config.ts",
                        "line": 45,
                        "tags": [],
                        "properties": {
                            "cookies": {
                                "name": "cookies",
                                "description": "Cookie parser configuration - see cookie-parser for details",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 74,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "cors": {
                                "name": "cors",
                                "description": "CORS configuration - see cors middleware package for details",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 79,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "database": {
                                "name": "database",
                                "description": "Connection and configuration for your ORM adapter - see your ORM adapter docs for\ndetails",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 120,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "environment": {
                                "name": "environment",
                                "description": "The name of the current environment, i.e. 'developement', 'test', 'production'",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 49,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "logging": {
                                "name": "logging",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 51,
                                "tags": [],
                                "type": "inline literal",
                                "inherited": false
                            },
                            "migrations": {
                                "name": "migrations",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 81,
                                "tags": [],
                                "type": "inline literal",
                                "inherited": false
                            },
                            "server": {
                                "name": "server",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/config.ts",
                                "line": 90,
                                "tags": [],
                                "type": "inline literal",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "MiddlewareFn": {
                        "name": "MiddlewareFn",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/router.ts",
                        "line": 33,
                        "tags": [],
                        "properties": {},
                        "methods": {}
                    },
                    "ResourceOptions": {
                        "name": "ResourceOptions",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/router.ts",
                        "line": 37,
                        "tags": [],
                        "properties": {
                            "except": {
                                "name": "except",
                                "description": "A list of action types to _not_ generate.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 49,
                                "tags": [],
                                "type": "string[]",
                                "inherited": false
                            },
                            "only": {
                                "name": "only",
                                "description": "A list of action types that should be the _only_ ones generated.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 53,
                                "tags": [],
                                "type": "string[]",
                                "inherited": false
                            },
                            "related": {
                                "name": "related",
                                "description": "Should routes for related resources be generated? If true, routes will be\ngenerated following the JSON-API recommendations for relationship URLs.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 45,
                                "tags": [
                                    {
                                        "name": "see",
                                        "value": "{@link http://jsonapi.org/recommendations/#urls-relationships|JSON-API URL\nRecommendatiosn}"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "RouterDSL": {
                        "name": "RouterDSL",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/router.ts",
                        "line": 56,
                        "tags": [],
                        "properties": {},
                        "methods": {
                            "delete": {
                                "name": "delete",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 61,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "pattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "action"
                                            },
                                            {
                                                "type": "__type",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "get": {
                                "name": "get",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 57,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "pattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "action"
                                            },
                                            {
                                                "type": "__type",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "head": {
                                "name": "head",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 62,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "pattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "action"
                                            },
                                            {
                                                "type": "__type",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "options": {
                                "name": "options",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 63,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "pattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "action"
                                            },
                                            {
                                                "type": "__type",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "patch": {
                                "name": "patch",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 60,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "pattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "action"
                                            },
                                            {
                                                "type": "__type",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "post": {
                                "name": "post",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 58,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "pattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "action"
                                            },
                                            {
                                                "type": "__type",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "put": {
                                "name": "put",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 59,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "pattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "action"
                                            },
                                            {
                                                "type": "__type",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "resource": {
                                "name": "resource",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 64,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "resourceName"
                                            },
                                            {
                                                "type": "ResourceOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "RoutesCache": {
                        "name": "RoutesCache",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/router.ts",
                        "line": 22,
                        "tags": [],
                        "properties": {
                            "DELETE": {
                                "name": "DELETE",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 27,
                                "tags": [],
                                "type": "Route[]",
                                "inherited": false
                            },
                            "GET": {
                                "name": "GET",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 23,
                                "tags": [],
                                "type": "Route[]",
                                "inherited": false
                            },
                            "HEAD": {
                                "name": "HEAD",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 28,
                                "tags": [],
                                "type": "Route[]",
                                "inherited": false
                            },
                            "OPTIONS": {
                                "name": "OPTIONS",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 29,
                                "tags": [],
                                "type": "Route[]",
                                "inherited": false
                            },
                            "PATCH": {
                                "name": "PATCH",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 26,
                                "tags": [],
                                "type": "Route[]",
                                "inherited": false
                            },
                            "POST": {
                                "name": "POST",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 24,
                                "tags": [],
                                "type": "Route[]",
                                "inherited": false
                            },
                            "PUT": {
                                "name": "PUT",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 25,
                                "tags": [],
                                "type": "Route[]",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "AcceptanceTestContext": {
                        "name": "AcceptanceTestContext",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/test/acceptance-test.ts",
                        "line": 13,
                        "tags": [],
                        "properties": {
                            "app": {
                                "name": "app",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 14,
                                "tags": [],
                                "type": "AcceptanceTest",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "MockMessageOptions": {
                        "name": "MockMessageOptions",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/test/mock-request.ts",
                        "line": 9,
                        "tags": [],
                        "properties": {
                            "body": {
                                "name": "body",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 16,
                                "tags": [],
                                "inherited": false
                            },
                            "headers": {
                                "name": "headers",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 12,
                                "tags": [],
                                "type": "IncomingHttpHeaders",
                                "inherited": false
                            },
                            "httpVersion": {
                                "name": "httpVersion",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 14,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "json": {
                                "name": "json",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 15,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "method": {
                                "name": "method",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 10,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "trailers": {
                                "name": "trailers",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 13,
                                "tags": [],
                                "type": "Dict<string>",
                                "inherited": false
                            },
                            "url": {
                                "name": "url",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 11,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    }
                },
                "functions": [
                    {
                        "name": "attr",
                        "description": "Syntax sugar factory method for creating Attributes",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/data/descriptors.ts",
                        "line": 65,
                        "tags": [],
                        "signatures": [
                            {
                                "parameters": [
                                    {
                                        "type": "BaseAttributeTypes",
                                        "name": "datatype"
                                    },
                                    {
                                        "type": "any",
                                        "name": "options"
                                    }
                                ],
                                "return": {
                                    "type": "AttributeDescriptor"
                                }
                            }
                        ]
                    },
                    {
                        "name": "hasMany",
                        "description": "Syntax sugar factory function for creating HasManyRelationships",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/data/descriptors.ts",
                        "line": 122,
                        "tags": [],
                        "signatures": [
                            {
                                "parameters": [
                                    {
                                        "type": "string",
                                        "name": "relatedModelName"
                                    },
                                    {
                                        "type": "any",
                                        "name": "options"
                                    }
                                ],
                                "return": {
                                    "type": "HasManyRelationshipDescriptor"
                                }
                            }
                        ]
                    },
                    {
                        "name": "hasOne",
                        "description": "Syntax sugar factory function for creating HasOneRelationships",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/data/descriptors.ts",
                        "line": 178,
                        "tags": [],
                        "signatures": [
                            {
                                "parameters": [
                                    {
                                        "type": "string",
                                        "name": "relatedModelName"
                                    },
                                    {
                                        "type": "any",
                                        "name": "options"
                                    }
                                ],
                                "return": {
                                    "type": "HasOneRelationshipDescriptor"
                                }
                            }
                        ]
                    },
                    {
                        "name": "createMixin",
                        "description": "Creates a mixin factory function wrapper. These wrapper functions have the\nspecial property that they can be invoked an arbitrary number of times, and\neach time will cache the arguments to be handed off to the actual factory\nfunction.\n\nThis is useful to allow per-use options for your mixin. For example:\n\n    class ProtectedAction extends Action.mixin(authenticate({ ... })) {\n\nIn that example, the optons object provided to the `authenticate` mixin\nfunction will be cached, and once the mixin factory function is invoked, it\nwill be provided as an additional argument:\n\n    createMixin((BaseClass, options) => {",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/metal/mixin.ts",
                        "line": 79,
                        "tags": [],
                        "signatures": [
                            {
                                "parameters": [
                                    {
                                        "type": "MixinFactory<T, U>",
                                        "name": "mixinFactory"
                                    }
                                ],
                                "return": {
                                    "type": "MixinApplicator<T, U>"
                                }
                            }
                        ]
                    },
                    {
                        "name": "mixin",
                        "description": "ES6 classes don't provide any native syntax or support for compositional\nmixins. This helper method provides that support:\n\nimport { mixin } from '@denali-js/core';\n    import MyMixin from '../mixins/my-mixin';\n    import ApplicationAction from './application';\n\n    export default class MyAction extends mixin(ApplicationAction, MyMixin) {\n      // ...\n    }\n\nObjects that extend from Denali's Object class automatically get a static\n`mixin` method to make the syntax a bit more familiar:\n\n    export default class MyAction extends ApplicationAction.mixin(MyMixin) {\n\n## How it works\n\nSince ES6 classes are based on prototype chains, and protoype chains are\npurely linear (you can't have two prototypes of a single object), we\nimplement mixins by creating anonymous intermediate subclasses for each\napplied mixin.\n\nMixins are defined as factory functions that take a base class and extend it\nwith their own mixin properties/methods. When these mixin factory functions\nare applied, they are called in order, with the result of the last mixin\nfeeding into the base class of the next mixin factory.\n\n## Use sparingly!\n\nMixins can be useful in certain circumstances, but use them sparingly. They\nadd indirection that can be surprising or confusing to later developers who\nencounter the code. Wherever possible, try to find alternatives that make\nthe various dependencies of your code clear.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/metal/mixin.ts",
                        "line": 52,
                        "tags": [],
                        "signatures": [
                            {
                                "parameters": [
                                    {
                                        "type": "Function",
                                        "name": "baseClass"
                                    },
                                    {
                                        "type": "any[]",
                                        "name": "mixins"
                                    }
                                ],
                                "return": {
                                    "type": "any"
                                }
                            }
                        ]
                    }
                ]
            },
            "data": {
                "classes": {
                    "AttributeDescriptor": {
                        "name": "AttributeDescriptor",
                        "description": "The Attribute class is used to tell Denali what the available attributes are\non your Model. You shouldn't use the Attribute class directly; instead,\nimport the `attr()` method from Denali, and use it to define an attribute:\n\nimport { attr } from '@denali-js/core';\n    class Post extends ApplicationModel {\n      static title = attr('text');\n    }\n\nNote that attributes must be defined as `static` properties on your Model\nclass.\n\nThe `attr()` method takes two arguments:\n\n  * `type` - a string indicating the type of this attribute. Denali doesn't\n  care what this string is. Your ORM adapter should specify what types it\n  expects.\n  * `options` - any additional options for this attribute. At the moment,\n  these are used solely by your ORM adapter, there are no additional options\n  that Denali expects itself.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/data/descriptors.ts",
                        "line": 44,
                        "tags": [
                            {
                                "name": "package",
                                "value": "data"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "datatype": {
                                "name": "datatype",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 53,
                                "tags": [],
                                "inherited": false
                            },
                            "isAttribute": {
                                "name": "isAttribute",
                                "description": "Convenience flag for checking if this is an attribute",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 51,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": false
                            },
                            "options": {
                                "name": "options",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 13,
                                "tags": [],
                                "type": "Dict<any>",
                                "inherited": true
                            }
                        },
                        "methods": {}
                    },
                    "Descriptor": {
                        "name": "Descriptor",
                        "description": "Base Descriptor class",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/data/descriptors.ts",
                        "line": 8,
                        "tags": [
                            {
                                "name": "package",
                                "value": "data"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "options": {
                                "name": "options",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 13,
                                "tags": [],
                                "type": "Dict<any>",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "HasManyRelationshipDescriptor": {
                        "name": "HasManyRelationshipDescriptor",
                        "description": "The HasManyRelationship class is used to describe a 1 to many or many to\nmany relationship on your Model. You shouldn't use the HasManyRelationship\nclass directly; instead, import the `hasMany()` method from Denali, and use\nit to define a relationship:\n\nimport { hasMany } from '@denali-js/core';\n    class Post extends ApplicationModel {\n      static comments = hasMany('comment');\n    }\n\nNote that relationships must be defined as `static` properties on your Model\nclass.\n\nThe `hasMany()` method takes two arguments:\n\n  * `type` - a string indicating the type of model for this relationship.\n  * `options` - any additional options for this attribute. At the moment,\n  these are used solely by your ORM adapter, there are no additional options\n  that Denali expects itself.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/data/descriptors.ts",
                        "line": 94,
                        "tags": [
                            {
                                "name": "package",
                                "value": "data"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "isRelationship": {
                                "name": "isRelationship",
                                "description": "Convenience flag for checking if this is a relationship",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 101,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": false
                            },
                            "mode": {
                                "name": "mode",
                                "description": "Relationship mode, i.e. 1 -> 1 or 1 -> N",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 108,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "options": {
                                "name": "options",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 13,
                                "tags": [],
                                "type": "Dict<any>",
                                "inherited": true
                            },
                            "relatedModelName": {
                                "name": "relatedModelName",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 110,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "HasOneRelationshipDescriptor": {
                        "name": "HasOneRelationshipDescriptor",
                        "description": "The HasOneRelationship class is used to describe a 1 to many or 1 to 1\nrelationship on your Model. You shouldn't use the HasOneRelationship class\ndirectly; instead, import the `hasOne()` method from Denali, and use it to\ndefine a relationship:\n\nimport { hasOne } from '@denali-js/core';\n    class Post extends ApplicationModel {\n      static author = hasOne('user');\n    }\n\nNote that relationships must be defined as `static` properties on your Model\nclass.\n\nThe `hasOne()` method takes two arguments:\n\n  * `type` - a string indicating the type of model for this relationship.\n  * `options` - any additional options for this attribute. At the moment,\n  these are used solely by your ORM adapter, there are no additional options\n  that Denali expects itself.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/data/descriptors.ts",
                        "line": 150,
                        "tags": [
                            {
                                "name": "package",
                                "value": "data"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "isRelationship": {
                                "name": "isRelationship",
                                "description": "Convenience flag for checking if this is a relationship",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 157,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": false
                            },
                            "mode": {
                                "name": "mode",
                                "description": "Relationship mode, i.e. 1 -> 1 or 1 -> N",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 164,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "options": {
                                "name": "options",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 13,
                                "tags": [],
                                "type": "Dict<any>",
                                "inherited": true
                            },
                            "relatedModelName": {
                                "name": "relatedModelName",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/descriptors.ts",
                                "line": 166,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "MemoryAdapter": {
                        "name": "MemoryAdapter",
                        "description": "An in-memory ORM adapter for getting started quickly, testing, and\ndebugging. Should **not** be used for production data.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/data/memory.ts",
                        "line": 23,
                        "tags": [
                            {
                                "name": "package",
                                "value": "data"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "_cache": {
                                "name": "_cache",
                                "description": "An in-memory cache of records. Top level objects are collections of\nrecords by type, indexed by record id.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 30,
                                "tags": [],
                                "type": "inline literal",
                                "inherited": false
                            },
                            "testTransaction": {
                                "name": "testTransaction",
                                "description": "The current test transaction, if applicable. See `startTestTransaction()`\nfor details",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 40,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "any",
                                "inherited": true
                            }
                        },
                        "methods": {
                            "_cacheFor": {
                                "name": "_cacheFor",
                                "description": "Get the collection of records for a given type, indexed by record id. If\nthe collection doesn't exist yet, create it and return the empty\ncollection.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 37,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            }
                                        ],
                                        "return": {
                                            "type": "inline literal"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "addRelated": {
                                "name": "addRelated",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 116,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "string",
                                                "name": "relationship"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "relatedModel"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "all": {
                                "name": "all",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 54,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any[]>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "buildRecord": {
                                "name": "buildRecord",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 62,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "any",
                                                "name": "data"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "defineModels": {
                                "name": "defineModels",
                                "description": "Takes an array of Denali Models and defines an ORM specific model class,\nand/or any other ORM specific setup that might be required for that Model.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 207,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "T[]",
                                                "name": "models"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "deleteAttribute": {
                                "name": "deleteAttribute",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 87,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "string",
                                                "name": "property"
                                            }
                                        ],
                                        "return": {
                                            "type": "true"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "deleteRecord": {
                                "name": "deleteRecord",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 138,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "find": {
                                "name": "find",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 46,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "number",
                                                "name": "id"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "getAttribute": {
                                "name": "getAttribute",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 78,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "string",
                                                "name": "property"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "getRelated": {
                                "name": "getRelated",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 92,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "string",
                                                "name": "relationship"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            },
                                            {
                                                "type": "any",
                                                "name": "query"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "idFor": {
                                "name": "idFor",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 67,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "query": {
                                "name": "query",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 58,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "any",
                                                "name": "query"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any[]>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "queryOne": {
                                "name": "queryOne",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 50,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "any",
                                                "name": "query"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "removeRelated": {
                                "name": "removeRelated",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 124,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "string",
                                                "name": "relationship"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "relatedModel"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "rollbackTestTransaction": {
                                "name": "rollbackTestTransaction",
                                "description": "Roll back the test transaction.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 225,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "saveRecord": {
                                "name": "saveRecord",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 128,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setAttribute": {
                                "name": "setAttribute",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 82,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "string",
                                                "name": "property"
                                            },
                                            {
                                                "type": "any",
                                                "name": "value"
                                            }
                                        ],
                                        "return": {
                                            "type": "true"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setId": {
                                "name": "setId",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 71,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "number",
                                                "name": "value"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setRelated": {
                                "name": "setRelated",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/memory.ts",
                                "line": 107,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "string",
                                                "name": "relationship"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            },
                                            {
                                                "name": "relatedModels"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "startTestTransaction": {
                                "name": "startTestTransaction",
                                "description": "Start a transaction that will wrap a test, and be rolled back afterwards.\nIf the data store doesn't support transactions, just omit this method. Only\none test transaction will be opened per process, and the ORM adapter is\nresponsible for keeping track of that transaction so it can later be rolled\nback.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 218,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    },
                    "Model": {
                        "name": "Model",
                        "description": "The Model class is the core of Denali's unique approach to data and ORMs. It\nacts as a wrapper and translation layer that provides a unified interface to\naccess and manipulate data, but translates those interactions into ORM\nspecific operations via ORM adapters.\n\nThe primary purpose of having Models in Denali is to allow Denali addons to\naccess a common interface for manipulating data. Importantly, the goal is\n**not** to let you swap different ORMs / databases with little effort. Don't\nbe surprised if you find your app littered with ORM specific code - that is\nexpected and even encouraged. For more on this concept, check out the Denali\nblog.\n\nTODO: link to blog post on ^",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/data/model.ts",
                        "line": 34,
                        "tags": [
                            {
                                "name": "package",
                                "value": "data"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {
                            "abstract": {
                                "name": "abstract",
                                "description": "Marks the Model as an abstract base model, so ORM adapters can know not to\ncreate tables or other supporting infrastructure.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 42,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": false
                            },
                            "schema": {
                                "name": "schema",
                                "description": "The schema definition for this model. Keys are the field names, and values\nshould be either `attr(...)', `hasOne(...)`, or `hasMany(...)`",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 48,
                                "tags": [],
                                "type": "Dict<SchemaDescriptor>",
                                "inherited": false
                            },
                            "adapter": {
                                "name": "adapter",
                                "description": "The ORM adapter specific to this model type. Defaults to the application's\nORM adapter if none for this specific model type is found.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 214,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "ORMAdapter",
                                "inherited": false
                            },
                            "attributes": {
                                "name": "attributes",
                                "description": "Returns the schema filtered down to just the attribute fields",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 53,
                                "tags": [],
                                "type": "Dict<AttributeDescriptor>",
                                "inherited": false
                            },
                            "modelName": {
                                "name": "modelName",
                                "description": "The name of this Model type. Used in a variety of use cases, including\nserialization.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 224,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "relationships": {
                                "name": "relationships",
                                "description": "Returns the schema filtered down to just the relationship fields",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 62,
                                "tags": [],
                                "type": "Dict<RelationshipDescriptor>",
                                "inherited": false
                            }
                        },
                        "staticMethods": {
                            "_augmentWithSchemaAccessors": {
                                "name": "_augmentWithSchemaAccessors",
                                "access": "private",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 68,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "all": {
                                "name": "all",
                                "description": "Fetch all records of this type",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 189,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "name": "this"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options",
                                                "description": "An options object passed through to the ORM adapter"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<T[]>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "build": {
                                "name": "build",
                                "description": "Builds a new Model instance from an already existing ORM record reference",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 129,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Constructor<T>",
                                                "name": "this"
                                            },
                                            {
                                                "type": "any",
                                                "name": "record",
                                                "description": "The ORM adapter record object"
                                            }
                                        ],
                                        "return": {
                                            "type": "T"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "create": {
                                "name": "create",
                                "description": "Create a new Model instance with the supplied data, and immediately\npersist it",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 203,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "name": "this"
                                            },
                                            {
                                                "type": "any",
                                                "name": "data",
                                                "description": "Data to populate the new Model instance with"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options",
                                                "description": "An options object passed through to the ORM adapter"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<T>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "find": {
                                "name": "find",
                                "description": "Retrieve a single record by it's id",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 142,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "name": "this"
                                            },
                                            {
                                                "type": "any",
                                                "name": "id",
                                                "description": "The id of the record you want to lookup"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options",
                                                "description": "Options passed through to the ORM adapter"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "query": {
                                "name": "query",
                                "description": "Fetch all records matching the given query",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 176,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "name": "this"
                                            },
                                            {
                                                "type": "any",
                                                "name": "query",
                                                "description": "The query to pass through to the ORM adapter"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options",
                                                "description": "An options object passed through to the ORM adapter"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<T[]>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "queryOne": {
                                "name": "queryOne",
                                "description": "Retrieve the first record matching the given query",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 159,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "name": "this"
                                            },
                                            {
                                                "type": "any",
                                                "name": "query",
                                                "description": "The query to pass through to the ORM adapter"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options",
                                                "description": "An options object passed through to the ORM adapter"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<>"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        },
                        "properties": {
                            "record": {
                                "name": "record",
                                "description": "The underlying ORM adapter record. An opaque value to Denali, handled\nentirely by the ORM adapter.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 239,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "any",
                                "inherited": false
                            },
                            "id": {
                                "name": "id",
                                "description": "The id of the record",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 256,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "any",
                                "inherited": false
                            },
                            "modelName": {
                                "name": "modelName",
                                "description": "The name of this Model type. Used in a variety of use cases, including\nserialization.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 247,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "addRelated": {
                                "name": "addRelated",
                                "description": "Add a related record to a hasMany relationship.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 327,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "relationshipName"
                                            },
                                            {
                                                "type": "T",
                                                "name": "relatedModel"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "delete": {
                                "name": "delete",
                                "description": "Delete this model.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 288,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "getRelated": {
                                "name": "getRelated",
                                "description": "Returns the related record(s) for the given relationship.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 298,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "relationshipName"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "inspect": {
                                "name": "inspect",
                                "description": "Return an human-friendly string representing this Model instance, with a\nsummary of it's attributes",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 348,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "string"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "removeRelated": {
                                "name": "removeRelated",
                                "description": "Remove the given record from the hasMany relationship",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 337,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "relationshipName"
                                            },
                                            {
                                                "type": "T",
                                                "name": "relatedModel"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "save": {
                                "name": "save",
                                "description": "Persist this model.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 277,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<this>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setRelated": {
                                "name": "setRelated",
                                "description": "Replaces the related records for the given relationship with the supplied\nrelated records.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 317,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "relationshipName"
                                            },
                                            {
                                                "name": "relatedModels"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "toString": {
                                "name": "toString",
                                "description": "Return an human-friendly string representing this Model instance",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/model.ts",
                                "line": 361,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "string"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "ORMAdapter": {
                        "name": "ORMAdapter",
                        "description": "The ORMAdapter class is responsible for enabling Denali to communicate with\nthe ORM of your choice. It does this by boiling down the possible actions\nthat a user might before against a Model that would involve persistence into\na set of basic operations. Your adapter then implements these operations,\nand Denali can build on top of that.\n\nMost of the values passed between your application code and the underlying\nORM are opaque to Denali. This means that Denali has no idea what that\n`query` object looks like or does - it just blindly hands it off to your\nORM adapter, which can plug it into the ORM interface appropriately.\n\nMost instance-level methods are given a reference to the Denali Model\ninstance that is being acted upon. Most ORM adapters will use that model\ninstance to access `model.record`, which is the slot used to store the\ninstance of the ORM's record. However, the full Model instance is supplied\nto provide the adapter with maximum flexibility.\n\nThe ORM adapter interface was designed to be a high enough abstraction that\nmost data stores should support most of the operations. However, it is not\nrequired that an adapter support all of the operations - for example, not\nall data stores support changing a record's ID. In those cases, the adapter\nmethod may simply throw.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/data/orm-adapter.ts",
                        "line": 32,
                        "tags": [
                            {
                                "name": "package",
                                "value": "data"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "testTransaction": {
                                "name": "testTransaction",
                                "description": "The current test transaction, if applicable. See `startTestTransaction()`\nfor details",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 40,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "any",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "addRelated": {
                                "name": "addRelated",
                                "description": "Add related record(s) to a hasMany relationship. Existing related records\nshould remain unaltered.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 167,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model",
                                                "description": "The model whose related records are being altered"
                                            },
                                            {
                                                "type": "string",
                                                "name": "relationship",
                                                "description": "The name of the relationship on the model that should\nbe altered"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor",
                                                "description": "The RelationshipDescriptor of the relationship being\naltered"
                                            },
                                            {
                                                "name": "related",
                                                "description": "The related record(s) that should be linked to the given\nrelationship"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "all": {
                                "name": "all",
                                "description": "Find all records of this type.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 61,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any[]>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "buildRecord": {
                                "name": "buildRecord",
                                "description": "Build an internal record instance of the given type with the given data.\nNote that this method should return the internal, ORM representation of\nthe record, not a Denali Model.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 92,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "any",
                                                "name": "data"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "defineModels": {
                                "name": "defineModels",
                                "description": "Takes an array of Denali Models and defines an ORM specific model class,\nand/or any other ORM specific setup that might be required for that Model.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 207,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "T[]",
                                                "name": "models"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "deleteAttribute": {
                                "name": "deleteAttribute",
                                "description": "Delete the value for the given attribute on the given record. The\nsemantics of this may behave slightly differently depending on backend -\nSQL databases may NULL out the value, while document stores like Mongo may\nactually delete the key from the document (rather than just nulling it\nout). It is up to the adapter to decide what \"deletion\" means in this\ncontext, and ideally should document such behavior.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 120,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "string",
                                                "name": "attribute"
                                            }
                                        ],
                                        "return": {
                                            "type": "boolean",
                                            "description": "returns true if delete operation was successful"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "deleteRecord": {
                                "name": "deleteRecord",
                                "description": "Delete the supplied model from the persistent data store.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 199,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "find": {
                                "name": "find",
                                "description": "Find a single record by it's id.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 47,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "any",
                                                "name": "id"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "getAttribute": {
                                "name": "getAttribute",
                                "description": "Return the value for the given attribute on the given record.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 99,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "string",
                                                "name": "attribute"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "getRelated": {
                                "name": "getRelated",
                                "description": "Return the related record(s) for the given relationship.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 131,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model",
                                                "description": "The model whose related records are being fetched"
                                            },
                                            {
                                                "type": "string",
                                                "name": "relationship",
                                                "description": "The name of the relationship on the model that should be fetched"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor",
                                                "description": "The RelationshipDescriptor of the relationship being fetch"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "idFor": {
                                "name": "idFor",
                                "description": "Return the id for the given model.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 75,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "query": {
                                "name": "query",
                                "description": "Find all records that match the given query.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 68,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "any",
                                                "name": "query"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any[]>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "queryOne": {
                                "name": "queryOne",
                                "description": "Find a single record that matches the given query.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 54,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            },
                                            {
                                                "type": "any",
                                                "name": "query"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "removeRelated": {
                                "name": "removeRelated",
                                "description": "Remove related record(s) from a hasMany relationship. Note: The removed\nrelated records should be \"unlinked\" in their relationship. Whether that\nresults in the deletion of those old records is up to the ORM adapter,\nalthough it is recommended that they not be deleted unless the user has\nexplicitly expressed that intent.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 185,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model",
                                                "description": "The model whose related records are being altered"
                                            },
                                            {
                                                "type": "string",
                                                "name": "relationship",
                                                "description": "The name of the relationship on the model that should\nbe altered"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor",
                                                "description": "The RelationshipDescriptor of the relationship being\naltered"
                                            },
                                            {
                                                "name": "related",
                                                "description": "The related record(s) that should be removed from the\nrelationship; if not provided, then all related records should be removed"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "rollbackTestTransaction": {
                                "name": "rollbackTestTransaction",
                                "description": "Roll back the test transaction.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 225,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "saveRecord": {
                                "name": "saveRecord",
                                "description": "Persist the supplied model.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 192,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setAttribute": {
                                "name": "setAttribute",
                                "description": "Set the value for the given attribute on the given record.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 107,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "string",
                                                "name": "attribute"
                                            },
                                            {
                                                "type": "any",
                                                "name": "value"
                                            }
                                        ],
                                        "return": {
                                            "type": "boolean",
                                            "description": "returns true if set operation was successful"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setId": {
                                "name": "setId",
                                "description": "Set the id for the given model. If the ORM does not support updating ids,\nthis method may throw.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 83,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "any",
                                                "name": "value"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setRelated": {
                                "name": "setRelated",
                                "description": "Set the related record(s) for the given relationship. Note: for has-many\nrelationships, the entire set of existing related records should be\nreplaced by the supplied records. The old related records should be\n\"unlinked\" in their relationship. Whether that results in the deletion of\nthose old records is up to the ORM adapter, although it is recommended\nthat they not be deleted unless the user has explicitly expressed that\nintent in some way (i.e. via configuration flags on the model class, or\nthe supplied options object)",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 152,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model",
                                                "description": "The model whose related records are being altered"
                                            },
                                            {
                                                "type": "string",
                                                "name": "relationship",
                                                "description": "The name of the relationship on the model that should\nbe altered"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor",
                                                "description": "The RelationshipDescriptor of the relationship being\naltered"
                                            },
                                            {
                                                "type": "any",
                                                "name": "related",
                                                "description": "The related record(s) that should be linked to the given\nrelationship"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "startTestTransaction": {
                                "name": "startTestTransaction",
                                "description": "Start a transaction that will wrap a test, and be rolled back afterwards.\nIf the data store doesn't support transactions, just omit this method. Only\none test transaction will be opened per process, and the ORM adapter is\nresponsible for keeping track of that transaction so it can later be rolled\nback.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/data/orm-adapter.ts",
                                "line": 218,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    },
                    "JSONSerializer": {
                        "name": "JSONSerializer",
                        "description": "Renders the payload as a flat JSON object or array at the top level. Related\nmodels are embedded.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/render/json.ts",
                        "line": 21,
                        "tags": [
                            {
                                "name": "package",
                                "value": "data"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "attributes": {
                                "name": "attributes",
                                "description": "The list of attribute names that should be serialized. Attributes not\nincluded in this list will be omitted from the final rendered payload.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 41,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "inherited": true
                            },
                            "contentType": {
                                "name": "contentType",
                                "description": "The default content type to apply to responses formatted by this\nserializer",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 29,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "relationships": {
                                "name": "relationships",
                                "description": "An object with configuration on how to serialize relationships.\nRelationships that have no configuration present are omitted from the\nfinal rendered payload.\n\nOut of the box, one option is supported:\n\n**strategy**\n\nIt has one of two possible values:\n\n  * `embed`: embed all related records in the response payload\n  * `id`: include only the id of the related record(s)\n\nWhat the embedded records or ids look like is up to each serializer to\ndetermine.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 62,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "methods": {
                            "attributesToSerialize": {
                                "name": "attributesToSerialize",
                                "description": "Convenience method to encapsulate standard attribute whitelist behavior -\nrender options take precedence, then allow this.attributes to be a\nfunction or straight definition",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 71,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "relationshipsToSerialize": {
                                "name": "relationshipsToSerialize",
                                "description": "Convenience method to encapsulate standard relationship whitelist behavior\n- render options take precedence, then allow this.relationships to be a\nfunction or straight definition",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 82,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "render": {
                                "name": "render",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 86,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "ServerResponse",
                                                "name": "response"
                                            },
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "renderError": {
                                "name": "renderError",
                                "description": "Render an error payload",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 188,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "error"
                                            },
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "any",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderItem": {
                                "name": "renderItem",
                                "description": "If the primary data isn't a model, just render whatever it is directly",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 62,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "item"
                                            },
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderModel": {
                                "name": "renderModel",
                                "description": "Renders an individual model",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 74,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderPrimary": {
                                "name": "renderPrimary",
                                "description": "Renders a primary data payload (a model or array of models).",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 48,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "payload"
                                            },
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serialize": {
                                "name": "serialize",
                                "description": "Renders the payload, either a primary data model(s) or an error payload.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 36,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serializeAttributeName": {
                                "name": "serializeAttributeName",
                                "description": "Transform attribute names into their over-the-wire representation. Default\nbehavior uses the attribute name as-is.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 106,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "attributeName"
                                            }
                                        ],
                                        "return": {
                                            "type": "string"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serializeAttributeValue": {
                                "name": "serializeAttributeValue",
                                "description": "Take an attribute value and return the serialized value. Useful for\nchanging how certain types of values are serialized, i.e. Date objects.\n\nThe default implementation returns the attribute's value unchanged.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 118,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "value"
                                            },
                                            {
                                                "type": "string",
                                                "name": "key"
                                            },
                                            {
                                                "type": "any",
                                                "name": "model"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serializeAttributes": {
                                "name": "serializeAttributes",
                                "description": "Serialize the attributes for a given model",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 86,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serializeRelationship": {
                                "name": "serializeRelationship",
                                "description": "Serializes a relationship",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 149,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "relationship"
                                            },
                                            {
                                                "type": "RelationshipConfig",
                                                "name": "config"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serializeRelationshipName": {
                                "name": "serializeRelationshipName",
                                "description": "Transform relationship names into their over-the-wire representation.\nDefault behavior uses the relationship name as-is.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 179,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "string"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serializeRelationships": {
                                "name": "serializeRelationships",
                                "description": "Serialize the relationships for a given model",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json.ts",
                                "line": 127,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Model",
                                                "name": "model"
                                            },
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<inline literal>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    },
                    "JSONAPISerializer": {
                        "name": "JSONAPISerializer",
                        "description": "Renders the payload according to the JSONAPI 1.0 spec, including related\nresources, included records, and support for meta and links.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/render/json-api.ts",
                        "line": 51,
                        "tags": [
                            {
                                "name": "package",
                                "value": "data"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "attributes": {
                                "name": "attributes",
                                "description": "The list of attribute names that should be serialized. Attributes not\nincluded in this list will be omitted from the final rendered payload.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 41,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "inherited": true
                            },
                            "contentType": {
                                "name": "contentType",
                                "description": "The default content type to use for any responses rendered by this serializer.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 58,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "relationships": {
                                "name": "relationships",
                                "description": "An object with configuration on how to serialize relationships.\nRelationships that have no configuration present are omitted from the\nfinal rendered payload.\n\nOut of the box, one option is supported:\n\n**strategy**\n\nIt has one of two possible values:\n\n  * `embed`: embed all related records in the response payload\n  * `id`: include only the id of the related record(s)\n\nWhat the embedded records or ids look like is up to each serializer to\ndetermine.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 62,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "methods": {
                            "attributesForRecord": {
                                "name": "attributesForRecord",
                                "description": "Returns the JSONAPI attributes object representing this record's\nrelationships",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 206,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {
                                            "type": "JSONAPI.Attributes"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "attributesToSerialize": {
                                "name": "attributesToSerialize",
                                "description": "Convenience method to encapsulate standard attribute whitelist behavior -\nrender options take precedence, then allow this.attributes to be a\nfunction or straight definition",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 71,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "dataForRelatedRecord": {
                                "name": "dataForRelatedRecord",
                                "description": "Given a related record, return the resource object for that record, and\nsideload the record as well.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 314,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "string",
                                                "name": "name"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "relatedRecord"
                                            },
                                            {
                                                "type": "RelationshipConfig",
                                                "name": "config"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<JSONAPI.ResourceIdentifier>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "dataForRelationship": {
                                "name": "dataForRelationship",
                                "description": "Returns the serialized form of the related Models for the given record and\nrelationship.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 298,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "string",
                                                "name": "name"
                                            },
                                            {
                                                "type": "RelationshipConfig",
                                                "name": "config"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<JSONAPI.RelationshipData>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "dedupeIncluded": {
                                "name": "dedupeIncluded",
                                "description": "Remove duplicate entries from the sideloaded data.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 470,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "idForError": {
                                "name": "idForError",
                                "description": "Given an error, return a unique id for this particular occurence of the\nproblem.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 420,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "any",
                                                "name": "error"
                                            }
                                        ],
                                        "return": {
                                            "type": "string"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "includeRecord": {
                                "name": "includeRecord",
                                "description": "Sideloads a record into the top level \"included\" array",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 384,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "string",
                                                "name": "name"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "relatedRecord"
                                            },
                                            {
                                                "type": "RelationshipConfig",
                                                "name": "config"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "linksForError": {
                                "name": "linksForError",
                                "description": "Return a links object for an error. You could use this to link to a bug\ntracker report of the error, for example.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 461,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "any",
                                                "name": "error"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "linksForRecord": {
                                "name": "linksForRecord",
                                "description": "Returns links for a particular record, i.e. self: \"/books/1\". Default\nimplementation assumes the URL for a particular record maps to that type's\n`show` action, i.e. `books/show`.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 364,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {
                                            "type": "JSONAPI.Links"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "linksForRelationship": {
                                "name": "linksForRelationship",
                                "description": "Takes a relationship descriptor and the record it's for, and returns any\nlinks for that relationship for that record. I.e. '/books/1/author'",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 330,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "string",
                                                "name": "name"
                                            },
                                            {
                                                "type": "RelationshipConfig",
                                                "name": "config"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {
                                            "type": "JSONAPI.Links"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "metaForError": {
                                "name": "metaForError",
                                "description": "Return the meta for a given error object. You could use this for example,\nto return debug information in development environments.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 451,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "any",
                                                "name": "error"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "metaForRecord": {
                                "name": "metaForRecord",
                                "description": "Returns meta for a particular record.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 375,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "metaForRelationship": {
                                "name": "metaForRelationship",
                                "description": "Returns any meta for a given relationship and record. No meta included by\ndefault.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 353,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "string",
                                                "name": "name"
                                            },
                                            {
                                                "type": "RelationshipConfig",
                                                "name": "config"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "relationshipsForRecord": {
                                "name": "relationshipsForRecord",
                                "description": "Returns the JSONAPI relationships object representing this record's\nrelationships",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 249,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<JSONAPI.Relationships>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "relationshipsToSerialize": {
                                "name": "relationshipsToSerialize",
                                "description": "Convenience method to encapsulate standard relationship whitelist behavior\n- render options take precedence, then allow this.relationships to be a\nfunction or straight definition",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 82,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "render": {
                                "name": "render",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 86,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "ServerResponse",
                                                "name": "response"
                                            },
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "renderError": {
                                "name": "renderError",
                                "description": "Render the supplied error",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 400,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "any",
                                                "name": "error"
                                            }
                                        ],
                                        "return": {
                                            "type": "JSONAPI.ErrorObject"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderIncluded": {
                                "name": "renderIncluded",
                                "description": "Render any included records supplied by the options into the top level of\nthe document",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 137,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderLinks": {
                                "name": "renderLinks",
                                "description": "Render top level links object for a document. Defaults to the links\nsupplied in options.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 164,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderMeta": {
                                "name": "renderMeta",
                                "description": "Render top level meta object for a document. Default uses meta supplied in\noptions call to res.render().",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 152,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderPrimary": {
                                "name": "renderPrimary",
                                "description": "Render the primary payload for a JSONAPI document (either a model or array\nof models).",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 88,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderPrimaryArray": {
                                "name": "renderPrimaryArray",
                                "description": "Render the primary data for the document, either an array of Models or\nErrors",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 117,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "any",
                                                "name": "payload"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderPrimaryObject": {
                                "name": "renderPrimaryObject",
                                "description": "Render the primary data for the document, either a single Model or a\nsingle Error.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 103,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "any",
                                                "name": "payload"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderRecord": {
                                "name": "renderRecord",
                                "description": "Render the supplied record as a resource object.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 186,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<JSONAPI.ResourceObject>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "renderVersion": {
                                "name": "renderVersion",
                                "description": "Render the version of JSONAPI supported.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 175,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serialize": {
                                "name": "serialize",
                                "description": "Take a response body (a model, an array of models, or an Error) and render\nit as a JSONAPI compliant document",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 66,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<JSONAPI.Document>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serializeAttributeName": {
                                "name": "serializeAttributeName",
                                "description": "The JSONAPI spec recommends (but does not require) that property names be\ndasherized. The default implementation of this serializer therefore does\nthat, but you can override this method to use a different approach.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 227,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "string",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "string"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serializeAttributeValue": {
                                "name": "serializeAttributeValue",
                                "description": "Take an attribute value and return the serialized value. Useful for\nchanging how certain types of values are serialized, i.e. Date objects.\n\nThe default implementation returns the attribute's value unchanged.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 239,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "any",
                                                "name": "value"
                                            },
                                            {
                                                "type": "string",
                                                "name": "key"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serializeRelationship": {
                                "name": "serializeRelationship",
                                "description": "Takes the serializer config and the model's descriptor for a relationship,\nand returns the serialized relationship object. Also sideloads any full\nrecords if the relationship is so configured.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 284,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "string",
                                                "name": "name"
                                            },
                                            {
                                                "type": "RelationshipConfig",
                                                "name": "config"
                                            },
                                            {
                                                "type": "RelationshipDescriptor",
                                                "name": "descriptor"
                                            },
                                            {
                                                "type": "Model",
                                                "name": "record"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<JSONAPI.Relationship>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serializeRelationshipName": {
                                "name": "serializeRelationshipName",
                                "description": "Convert the relationship name to it's \"over-the-wire\" format. Defaults to\ndasherizing it.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 273,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "string",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "string"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "sourceForError": {
                                "name": "sourceForError",
                                "description": "Given an error, return a JSON Pointer, a URL query param name, or other\ninfo indicating the source of the error.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 441,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "any",
                                                "name": "error"
                                            }
                                        ],
                                        "return": {
                                            "type": "string"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "titleForError": {
                                "name": "titleForError",
                                "description": "A short, human-readable summary of the problem that SHOULD NOT change from\noccurrence to occurrence of the problem, except for purposes of\nlocalization.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/json-api.ts",
                                "line": 431,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Context",
                                                "name": "context"
                                            },
                                            {
                                                "type": "any",
                                                "name": "error"
                                            }
                                        ],
                                        "return": {
                                            "type": "string"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "Serializer": {
                        "name": "Serializer",
                        "description": "Serializers allow you to customize what data is returned in the response and\napply simple transformations to it. They allow you to decouple what data is\nsent from how that data is structured / rendered.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/render/serializer.ts",
                        "line": 26,
                        "tags": [
                            {
                                "name": "package",
                                "value": "data"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "attributes": {
                                "name": "attributes",
                                "description": "The list of attribute names that should be serialized. Attributes not\nincluded in this list will be omitted from the final rendered payload.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 41,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "inherited": false
                            },
                            "contentType": {
                                "name": "contentType",
                                "description": "The content type header to send back with the response",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 33,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "relationships": {
                                "name": "relationships",
                                "description": "An object with configuration on how to serialize relationships.\nRelationships that have no configuration present are omitted from the\nfinal rendered payload.\n\nOut of the box, one option is supported:\n\n**strategy**\n\nIt has one of two possible values:\n\n  * `embed`: embed all related records in the response payload\n  * `id`: include only the id of the related record(s)\n\nWhat the embedded records or ids look like is up to each serializer to\ndetermine.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 62,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "inherited": false
                            }
                        },
                        "methods": {
                            "attributesToSerialize": {
                                "name": "attributesToSerialize",
                                "description": "Convenience method to encapsulate standard attribute whitelist behavior -\nrender options take precedence, then allow this.attributes to be a\nfunction or straight definition",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 71,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "relationshipsToSerialize": {
                                "name": "relationshipsToSerialize",
                                "description": "Convenience method to encapsulate standard relationship whitelist behavior\n- render options take precedence, then allow this.relationships to be a\nfunction or straight definition",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 82,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "render": {
                                "name": "render",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 86,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "ServerResponse",
                                                "name": "response"
                                            },
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "serialize": {
                                "name": "serialize",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/render/serializer.ts",
                                "line": 97,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "Action",
                                                "name": "action"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    }
                },
                "interfaces": {},
                "functions": []
            },
            "metal": {
                "classes": {
                    "Container": {
                        "name": "Container",
                        "description": "The Container is the dependency injection solution for Denali. It is\nresponsible for managing the lifecycle of objects (i.e. singletons),\nas well as orchestrating dependency lookup. This provides two key benefits:\n\n* Apps can consume classes that originate from anywhere in the addon\n    dependency tree, without needing to care/specify where.\n  * We can more easily test parts of the framework by mocking out container\n    entries instead of dealing with hardcoding dependencies",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/metal/container.ts",
                        "line": 44,
                        "tags": [
                            {
                                "name": "package",
                                "value": "metal"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "loader": {
                                "name": "loader",
                                "description": "The top level loader for the entire bundle",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 67,
                                "tags": [],
                                "type": "Loader",
                                "inherited": false
                            },
                            "lookups": {
                                "name": "lookups",
                                "description": "Internal cache of lookup values",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 62,
                                "tags": [],
                                "type": "Dict<any>",
                                "inherited": false
                            },
                            "registry": {
                                "name": "registry",
                                "description": "Manual registrations that should override resolver retrieved values",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 49,
                                "tags": [],
                                "type": "Dict<any>",
                                "inherited": false
                            },
                            "resolvers": {
                                "name": "resolvers",
                                "description": "An array of resolvers used to retrieve container members. Resolvers are\ntried in order, first to find the member wins. Normally, each addon will\nsupply it's own resolver, allowing for addon order and precedence when\nlooking up container entries.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 57,
                                "tags": [],
                                "type": "Resolver[]",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "availableForType": {
                                "name": "availableForType",
                                "description": "Returns an array of entry names for all entries under this type.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 244,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            }
                                        ],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "clear": {
                                "name": "clear",
                                "description": "Empties the entire container, including removing all resolvers and the\nloader, as well as emptying all caches. The primary use case is for\nunit testing, when you want a clean slate environment to selectively\nadd things back to.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 293,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "clearCache": {
                                "name": "clearCache",
                                "description": "Clear any cached lookups for this specifier. You probably don't want to\nuse this. The only significant use case is for testing to allow test\ncontainers to override an already looked up value.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 283,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "specifier"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "getOption": {
                                "name": "getOption",
                                "description": "Return the value for the given option on the given specifier. Specifier\nmay be a full specifier or just a type.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 260,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "specifier"
                                            },
                                            {
                                                "type": "U",
                                                "name": "optionName"
                                            }
                                        ],
                                        "return": {
                                            "type": "ContainerOptions[U]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "instantiateSingletons": {
                                "name": "instantiateSingletons",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 191,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "specifier"
                                            },
                                            {
                                                "type": "T",
                                                "name": "entry"
                                            }
                                        ],
                                        "return": {
                                            "type": "T"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "loadBundle": {
                                "name": "loadBundle",
                                "description": "Take a top level bundle loader and load it into this container",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 90,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Loader",
                                                "name": "loader"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "loadBundleScope": {
                                "name": "loadBundleScope",
                                "description": "Load a bundle scope into the container. A bundle scope typically\ncorresponds to an addon. Each bundle scope can provide it's own resolver to\ntell the consuming app how to look things up within the bundle scope. If\nno resolver is supplied, Denali will use the default Denali resolver.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 106,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Loader",
                                                "name": "loader"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "lookup": {
                                "name": "lookup",
                                "description": "Lookup the given specifier in the container. If options.loose is true,\nfailed lookups will return undefined rather than throw.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 143,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "specifier"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "T"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "specifier"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "lookupAll": {
                                "name": "lookupAll",
                                "description": "Lookup all the entries for a given type in the container. This will ask\nall resolvers to eagerly load all classes for this type. Returns an object\nwhose keys are container specifiers and values are the looked up values\nfor those specifiers.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 233,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            }
                                        ],
                                        "return": {
                                            "type": "Dict<T>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "lookupRaw": {
                                "name": "lookupRaw",
                                "description": "Recursive lookup method that takes a specifier and fallback specifiers.\nChecks manual registrations first, then iterates through each resolver. If\nthe entry is still not found, it recurses through the fallback options\nbefore ultimatley throwing (or returning false if loose: true)",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 208,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "specifier"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "register": {
                                "name": "register",
                                "description": "Add a manual registration that will take precedence over any resolved\nlookups.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 124,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "specifier"
                                            },
                                            {
                                                "type": "any",
                                                "name": "entry"
                                            },
                                            {
                                                "type": "ContainerOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setOption": {
                                "name": "setOption",
                                "description": "Set the option for the given specifier or type.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 271,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "specifier"
                                            },
                                            {
                                                "name": "optionName"
                                            },
                                            {
                                                "type": "any",
                                                "name": "value"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "Given container-managed singletons a chance to cleanup on application\nshutdown",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/container.ts",
                                "line": 306,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "InstrumentationEvent": {
                        "name": "InstrumentationEvent",
                        "description": "The Instrumentation class is a low level class for instrumenting your app's\ncode. It allows you to listen to framework level profiling events, as well\nas creating and firing your own such events.\n\nFor example, if you wanted to instrument how long a particular action was\ntaking:\n\n    import { Instrumentation, Action } from '@denali-js/core';\n    export default class MyAction extends Action {\n      respond() {\n        let Post = this.modelFor('post');\n        return Instrumentation.instrument('post lookup', { currentUser: this.user.id }, () => {\n          Post.find({ user: this.user });\n        });\n      }\n    }",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/metal/instrumentation.ts",
                        "line": 24,
                        "tags": [
                            {
                                "name": "package",
                                "value": "metal"
                            }
                        ],
                        "staticProperties": {
                            "_emitter": {
                                "name": "_emitter",
                                "description": "The internal event emitter used for notifications",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/instrumentation.ts",
                                "line": 29,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            }
                        },
                        "staticMethods": {
                            "emit": {
                                "name": "emit",
                                "description": "Emit an InstrumentationEvent to subscribers",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/instrumentation.ts",
                                "line": 58,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "eventName"
                                            },
                                            {
                                                "type": "InstrumentationEvent",
                                                "name": "event"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "instrument": {
                                "name": "instrument",
                                "description": "Run the supplied function, timing how long it takes to complete. If the function returns a\npromise, the timer waits until that promise resolves. Returns a promise that resolves with the\nreturn value of the supplied function. Fires an event with the given event name and event data\n(the function result is provided as well).",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/instrumentation.ts",
                                "line": 51,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "eventName"
                                            },
                                            {
                                                "type": "any",
                                                "name": "data"
                                            }
                                        ],
                                        "return": {
                                            "type": "InstrumentationEvent"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "subscribe": {
                                "name": "subscribe",
                                "description": "Subscribe to be notified when a particular instrumentation block completes.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/instrumentation.ts",
                                "line": 34,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "eventName"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "callback"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "unsubscribe": {
                                "name": "unsubscribe",
                                "description": "Unsubscribe from being notified when a particular instrumentation block completes.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/instrumentation.ts",
                                "line": 41,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "eventName"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "callback"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        },
                        "properties": {
                            "data": {
                                "name": "data",
                                "description": "Additional data supplied for this event, either at the start or finish of the event.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/instrumentation.ts",
                                "line": 75,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "duration": {
                                "name": "duration",
                                "description": "The duration of the instrumentation event (calculated after calling `.finish()`)",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/instrumentation.ts",
                                "line": 70,
                                "tags": [],
                                "type": "number",
                                "inherited": false
                            },
                            "eventName": {
                                "name": "eventName",
                                "description": "The name of this instrumentation even",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/instrumentation.ts",
                                "line": 65,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "startTime": {
                                "name": "startTime",
                                "description": "High resolution start time of this event",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/metal/instrumentation.ts",
                                "line": 80,
                                "tags": [],
                                "inherited": false
                            }
                        },
                        "methods": {
                            "finish": {
                                "name": "finish",
                                "description": "Finish this event. Records the duration, and fires an event to any subscribers. Any data\nprovided here is merged with any previously provided data.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/instrumentation.ts",
                                "line": 92,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "data"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "DenaliObject": {
                        "name": "DenaliObject",
                        "description": "The base object class for Denali classes. Adds mixin support and a stubbed\n`teardown` method.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/metal/object.ts",
                        "line": 10,
                        "tags": [
                            {
                                "name": "package",
                                "value": "metal"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        },
                        "properties": {},
                        "methods": {
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    }
                },
                "interfaces": {},
                "functions": []
            },
            "parse": {
                "classes": {
                    "JSONParser": {
                        "name": "JSONParser",
                        "description": "Parses incoming request bodies as JSON payloads.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/parse/json.ts",
                        "line": 20,
                        "tags": [
                            {
                                "name": "package",
                                "value": "parse"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "inflate": {
                                "name": "inflate",
                                "description": "When set to true, then deflated (compressed) bodies will be inflated; when\nfalse, deflated bodies are rejected. Defaults to true.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 28,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": false
                            },
                            "jsonParserMiddleware": {
                                "name": "jsonParserMiddleware",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 78,
                                "tags": [],
                                "type": "RequestHandler",
                                "inherited": false
                            },
                            "limit": {
                                "name": "limit",
                                "description": "Controls the maximum request body size. If this is a number, then the\nvalue specifies the number of bytes; if it is a string, the value is\npassed to the bytes library for parsing. Defaults to '100kb'.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 37,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "reviver": {
                                "name": "reviver",
                                "description": "The reviver option is passed directly to JSON.parse as the second\nargument.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 45,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "inline literal",
                                "inherited": false
                            },
                            "strict": {
                                "name": "strict",
                                "description": "When set to true, will only accept arrays and objects; when false will\naccept anything JSON.parse accepts. Defaults to true.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 53,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": false
                            },
                            "type": {
                                "name": "type",
                                "description": "The type option is used to determine what media type the middleware will\nparse. This option can be a function or a string. If a string, type option\nis passed directly to the type-is library and this can be an extension\nname (like json), a mime type (like application/json), or a mime type with\na wildcard. If a function, the type option is called as fn(req) and the\nrequest is parsed if it returns a truthy value. Defaults to\napplication/json.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 66,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "verify": {
                                "name": "verify",
                                "description": "The verify option, if supplied, is called as verify(req, res, buf,\nencoding), where buf is a Buffer of the raw request body and encoding is\nthe encoding of the request. The parsing can be aborted by throwing an\nerror.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 76,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "inline literal",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "bufferAndParseBody": {
                                "name": "bufferAndParseBody",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 80,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Request",
                                                "name": "request"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "parse": {
                                "name": "parse",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 97,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Request",
                                                "name": "request"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<ResponderParams>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    },
                    "JSONAPIParser": {
                        "name": "JSONAPIParser",
                        "description": "Parses incoming request bodies according to the JSON-API specification. For\nincoming payloads with `included` arrays, the primary `data` is returned\nunder the `body` key, and `included` is moved to it's own property.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/parse/json-api.ts",
                        "line": 28,
                        "tags": [
                            {
                                "name": "package",
                                "value": "parse"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "inflate": {
                                "name": "inflate",
                                "description": "When set to true, then deflated (compressed) bodies will be inflated; when\nfalse, deflated bodies are rejected. Defaults to true.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 28,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": true
                            },
                            "jsonParserMiddleware": {
                                "name": "jsonParserMiddleware",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 78,
                                "tags": [],
                                "type": "RequestHandler",
                                "inherited": true
                            },
                            "limit": {
                                "name": "limit",
                                "description": "Controls the maximum request body size. If this is a number, then the\nvalue specifies the number of bytes; if it is a string, the value is\npassed to the bytes library for parsing. Defaults to '100kb'.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 37,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": true
                            },
                            "reviver": {
                                "name": "reviver",
                                "description": "The reviver option is passed directly to JSON.parse as the second\nargument.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 45,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "inline literal",
                                "inherited": true
                            },
                            "strict": {
                                "name": "strict",
                                "description": "When set to true, will only accept arrays and objects; when false will\naccept anything JSON.parse accepts. Defaults to true.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 53,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": true
                            },
                            "type": {
                                "name": "type",
                                "description": "The media type for JSON-API requests. If the incoming request doesn't have\nthis Content Type, the parser will immediately render a 400 Bad Request response",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json-api.ts",
                                "line": 34,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "verify": {
                                "name": "verify",
                                "description": "The verify option, if supplied, is called as verify(req, res, buf,\nencoding), where buf is a Buffer of the raw request body and encoding is\nthe encoding of the request. The parsing can be aborted by throwing an\nerror.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 76,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "inline literal",
                                "inherited": true
                            }
                        },
                        "methods": {
                            "bufferAndParseBody": {
                                "name": "bufferAndParseBody",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/parse/json.ts",
                                "line": 80,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Request",
                                                "name": "request"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "parse": {
                                "name": "parse",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/json-api.ts",
                                "line": 36,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Request",
                                                "name": "request"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<ResponderParams>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "parseAttributes": {
                                "name": "parseAttributes",
                                "description": "Parse a resource object's attributes. By default, this converts from the\nJSONAPI recommended dasheried keys to camelCase.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/parse/json-api.ts",
                                "line": 116,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "JSONAPIAttributesObject",
                                                "name": "attrs"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "parseId": {
                                "name": "parseId",
                                "description": "Parse a resource object id",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/parse/json-api.ts",
                                "line": 97,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "id"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "parseRelationships": {
                                "name": "parseRelationships",
                                "description": "Parse a resource object's relationships. By default, this converts from\nthe JSONAPI recommended dasheried keys to camelCase.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/parse/json-api.ts",
                                "line": 128,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "JSONAPIRelationshipsObject",
                                                "name": "relationships"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "parseResource": {
                                "name": "parseResource",
                                "description": "Parse a single resource object from a JSONAPI document. The resource\nobject could come from the top level `data` payload, or from the\nsideloaded `included` records.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/parse/json-api.ts",
                                "line": 84,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "JSONAPIResourceObject",
                                                "name": "resource"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "parseType": {
                                "name": "parseType",
                                "description": "Parse a resource object's type string",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/parse/json-api.ts",
                                "line": 106,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "type"
                                            }
                                        ],
                                        "return": {
                                            "type": "string"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    },
                    "Parser": {
                        "name": "Parser",
                        "description": "Denali's Parsers are responsible for taking the incoming request body of an\nHTTP request and transforming it into a consistent object structure that can\nbe used by Actions.\n\nFor example, if your app uses JSON-API, you can use the JSON-API parser to\ntransform the incoming JSON-API request body structure into something easier\nto work with in your Action layer.\n\nOther examples of common tasks include parsing and type casting query\nparams, and transforming keys (i.e. kebab-case to camelCase).",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/parse/parser.ts",
                        "line": 20,
                        "tags": [
                            {
                                "name": "package",
                                "value": "parse"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {},
                        "methods": {
                            "parse": {
                                "name": "parse",
                                "description": "Take an incoming request and return an object that will be passed in as\nthe argument to your Action.\n\nThe object should include some common properties:\n\n   body    - usually the primary data payload of the incoming request\n   query   - parsed and typecast query string parameters\n   headers - the headers of the incoming HTTP request\n   params  - parsed and typecast parameters from the dynamic segments of the\n             incoming request URL\n\nBeyond that, each parser can add it's own additional properties based on\nhow it parses. For example, the JSON-API parser adds any sideloaded\nrecords from the request body under the `included` property.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/parse/parser.ts",
                                "line": 40,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Request",
                                                "name": "request"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<ResponderParams>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    }
                },
                "interfaces": {},
                "functions": []
            },
            "runtime": {
                "classes": {
                    "Action": {
                        "name": "Action",
                        "description": "Actions form the core of interacting with a Denali application. They are the\ncontroller layer in the MVC architecture, taking in incoming requests,\nperforming business logic, and handing off to the renderer to send the\nresponse.\n\nWhen a request comes in, Denali will invoke the `respond` method on the\nmatching Action class. The return value (or resolved return value) of this\nmethod is used to render the response.\n\nActions also support filters. Simply define a method on your action, and add\nthe method name to the `before` or `after` array. Filters behave similar to\nresponders in that they receive the request params and can return a promise\nwhich will be waited on before continuing. Filters are inheritable, so child\nclasses will run filters added by parent classes.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/action.ts",
                        "line": 102,
                        "tags": [
                            {
                                "name": "package",
                                "value": "runtime"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {
                            "after": {
                                "name": "after",
                                "description": "Invoked after the `respond()` method. The framework will invoke filters\nfrom parent classes and mixins in the same order the mixins were applied.\n\nFilters can be synchronous, or return a promise (which will pause the\nbefore/respond/after chain until it resolves).\n\nFilters must be defined as static properties to allow Denali to extract\nthe values. Instance fields are not visible until instantiation, so\nthere's no way to build an \"accumulated\" value from each step in the\ninheritance chain.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 139,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "FilterSpecifier[]",
                                "inherited": false
                            },
                            "before": {
                                "name": "before",
                                "description": "Invoked before the `respond()` method. The framework will invoke filters\nfrom parent classes and mixins in the same order the mixins were applied.\n\nFilters can be synchronous, or return a promise (which will pause the\nbefore/respond/after chain until it resolves).\n\nIf a before filter returns any value (or returns a promise which resolves\nto any value) other than null or undefined, Denali will attempt to render\nthat response and halt further processing of the request (including\nremaining before filters).\n\nFilters must be defined as static properties to allow Denali to extract\nthe values. Instance fields are not visible until instantiation, so\nthere's no way to build an \"accumulated\" value from each step in the\ninheritance chain.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 123,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "FilterSpecifier[]",
                                "inherited": false
                            }
                        },
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "actionPath": {
                                "name": "actionPath",
                                "description": "The path to this action, i.e. 'users/create'",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 187,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "config": {
                                "name": "config",
                                "description": "Application config",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 146,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "ConfigService",
                                "inherited": false
                            },
                            "hasRendered": {
                                "name": "hasRendered",
                                "description": "Track whether or not we have rendered yet",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 182,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            },
                            "logger": {
                                "name": "logger",
                                "description": "Automatically inject the logger into all actions",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 163,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Logger",
                                "inherited": false
                            },
                            "parser": {
                                "name": "parser",
                                "description": "Force which parser should be used for parsing the incoming request.\n\nBy default it uses the application parser, but you can override with the\nname of the parser you'd rather use instead.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 156,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Parser",
                                "inherited": false
                            },
                            "request": {
                                "name": "request",
                                "description": "The incoming Request that this Action is responding to.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 170,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Request",
                                "inherited": false
                            },
                            "response": {
                                "name": "response",
                                "description": "The outgoing HTTP server response",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 177,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "ServerResponse",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "_buildFilterChain": {
                                "name": "_buildFilterChain",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 350,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "name": "stageName"
                                            },
                                            {
                                                "type": "Map<Action, Filter[]>",
                                                "name": "cache"
                                            },
                                            {
                                                "type": "Action[]",
                                                "name": "prototypes"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "_buildFilterChains": {
                                "name": "_buildFilterChains",
                                "description": "Walk the prototype chain of this Action instance to find all the `before`\nand `after` arrays to build the complete filter chains.\n\nCaches the result on the child Action class to avoid the potentially\nexpensive prototype walk on each request.\n\nThrows if it encounters the name of a filter method that doesn't exist.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 337,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "inline literal"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "_invokeFilters": {
                                "name": "_invokeFilters",
                                "description": "Invokes the filters in the supplied chain in sequence.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 310,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Filter[]",
                                                "name": "chain"
                                            },
                                            {
                                                "type": "ResponderParams",
                                                "name": "parsedRequest"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "render": {
                                "name": "render",
                                "description": "Render the response body",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 194,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "number",
                                                "name": "status"
                                            },
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "RenderOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "respond": {
                                "name": "respond",
                                "description": "The default responder method. You should override this method with\nwhatever logic is needed to respond to the incoming request.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 305,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "ResponderParams",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "run": {
                                "name": "run",
                                "description": "Invokes the action. Determines the best responder method for content\nnegotiation, then executes the filter/responder chain in sequence,\nhandling errors and rendering the response.\n\nYou shouldn't invoke this directly - Denali will automatically wire up\nyour routes to this method.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/action.ts",
                                "line": 255,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Request",
                                                "name": "request"
                                            },
                                            {
                                                "type": "ServerResponse",
                                                "name": "response"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    },
                    "Addon": {
                        "name": "Addon",
                        "description": "Addons are the fundamental unit of organization for Denali apps. The\nApplication class is just a specialized Addon, and each Addon can contain\nany amount of functionality - each one is essentially a mini Denali app.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/addon.ts",
                        "line": 14,
                        "tags": [
                            {
                                "name": "package",
                                "value": "runtime"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "environment": {
                                "name": "environment",
                                "description": "The current environment for the app, i.e. 'development'",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/addon.ts",
                                "line": 21,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "loader": {
                                "name": "loader",
                                "description": "The loader scope for this addon",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/addon.ts",
                                "line": 26,
                                "tags": [],
                                "type": "Loader",
                                "inherited": false
                            },
                            "name": {
                                "name": "name",
                                "description": "The name of the addon. Override this to use a different name than the\npackage name for your addon.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/addon.ts",
                                "line": 47,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "resolver": {
                                "name": "resolver",
                                "description": "The resolver for this addon's loader scope",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/addon.ts",
                                "line": 31,
                                "tags": [],
                                "type": "Resolver",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "shutdown": {
                                "name": "shutdown",
                                "description": "A hook to perform any shutdown actions necessary to gracefully exit the\napplication, i.e. close database/socket connections.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/addon.ts",
                                "line": 57,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Application",
                                                "name": "application"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "Application": {
                        "name": "Application",
                        "description": "Application instances are specialized Addons, designed to kick off the\nloading, mounting, and launching stages of booting up.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/application.ts",
                        "line": 52,
                        "tags": [
                            {
                                "name": "package",
                                "value": "runtime"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "addons": {
                                "name": "addons",
                                "description": "List of child addons for this app (one-level deep only, i.e. no\naddons-of-addons are included)",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 86,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Addon[]",
                                "inherited": false
                            },
                            "config": {
                                "name": "config",
                                "description": "The application config",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 66,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "ConfigService",
                                "inherited": false
                            },
                            "container": {
                                "name": "container",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 54,
                                "tags": [],
                                "type": "Container",
                                "inherited": false
                            },
                            "drainers": {
                                "name": "drainers",
                                "description": "Track servers that need to drain before application shutdown",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 71,
                                "tags": [],
                                "type": "inline literal[]",
                                "inherited": false
                            },
                            "environment": {
                                "name": "environment",
                                "description": "The current environment for the app, i.e. 'development'",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/addon.ts",
                                "line": 21,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": true
                            },
                            "loader": {
                                "name": "loader",
                                "description": "The loader scope for this addon",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/addon.ts",
                                "line": 26,
                                "tags": [],
                                "type": "Loader",
                                "inherited": true
                            },
                            "logger": {
                                "name": "logger",
                                "description": "The logger instance for the entire application",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 78,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Logger",
                                "inherited": false
                            },
                            "router": {
                                "name": "router",
                                "description": "The Router instance for this Application.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 59,
                                "tags": [],
                                "type": "Router",
                                "inherited": false
                            },
                            "name": {
                                "name": "name",
                                "description": "The name of the addon. Override this to use a different name than the\npackage name for your addon.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/addon.ts",
                                "line": 47,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": true
                            },
                            "resolver": {
                                "name": "resolver",
                                "description": "The resolver for this addon's loader scope",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/addon.ts",
                                "line": 31,
                                "tags": [],
                                "type": "Resolver",
                                "inherited": true
                            }
                        },
                        "methods": {
                            "compileRouter": {
                                "name": "compileRouter",
                                "description": "Assemble middleware and routes",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 152,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "createServer": {
                                "name": "createServer",
                                "description": "Creates an HTTP or HTTPS server, depending on whether or not SSL\nconfiguration is present in config/environment.js",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 190,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "number",
                                                "name": "port"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "generateConfig": {
                                "name": "generateConfig",
                                "description": "Take the loaded environment config functions, and execute them.\nApplication config is executed first, and the returned config object is\nhanded off to the addon config files, which add their configuration by\nmutating that same object.\n\nThe resulting final config is stored at `application.config`, and is\nregistered in the container under `config:environment`.\n\nThis is invoked before the rest of the addons are loaded for 2 reasons:\n\n- The config values for the application could theoretically impact the\n  addon loading process\n- Addons are given a chance to modify the application config, so it must\n  be loaded before they are.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 130,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "runInitializers": {
                                "name": "runInitializers",
                                "description": "Lookup all initializers and run them in sequence. Initializers can\noverride the default load order by including `before` or `after`\nproperties on the exported class (the name or array of names of the other\ninitializers it should run before/after).",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 216,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "shutdown": {
                                "name": "shutdown",
                                "description": "Shutdown the application gracefully (i.e. close external database\nconnections, drain in-flight requests, etc)",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 230,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "start": {
                                "name": "start",
                                "description": "Start the Denali server. Runs all initializers, creates an HTTP server,\nand binds to the port to handle incoming HTTP requests.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/application.ts",
                                "line": 177,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "Logger": {
                        "name": "Logger",
                        "description": "A simple Logger class that adds timestamps and supports multiple levels of\nlogging, colorized output, and control over verbosity.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/logger.ts",
                        "line": 17,
                        "tags": [
                            {
                                "name": "package",
                                "value": "runtime"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "colorize": {
                                "name": "colorize",
                                "description": "Specify if logs should be colorized.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/logger.ts",
                                "line": 31,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": false
                            },
                            "levels": {
                                "name": "levels",
                                "description": "Available log levels that can be used.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/logger.ts",
                                "line": 36,
                                "tags": [],
                                "type": "LogLevel[]",
                                "inherited": false
                            },
                            "loglevel": {
                                "name": "loglevel",
                                "description": "Default log level if none specified.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/logger.ts",
                                "line": 24,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "LogLevel",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "error": {
                                "name": "error",
                                "description": "Log at the 'error' level.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/logger.ts",
                                "line": 74,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "msg"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "info": {
                                "name": "info",
                                "description": "Log at the 'info' level.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/logger.ts",
                                "line": 56,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "msg"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "log": {
                                "name": "log",
                                "description": "Log a message to the logger at a specific log level.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/logger.ts",
                                "line": 81,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "LogLevel",
                                                "name": "level"
                                            },
                                            {
                                                "type": "string",
                                                "name": "msg"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "warn": {
                                "name": "warn",
                                "description": "Log at the 'warn' level.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/logger.ts",
                                "line": 65,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "any",
                                                "name": "msg"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "Request": {
                        "name": "Request",
                        "description": "The Request class represents an incoming HTTP request (specifically, Node's\nIncomingMessage).",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/request.ts",
                        "line": 23,
                        "tags": [
                            {
                                "name": "package",
                                "value": "runtime"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "_originalAction": {
                                "name": "_originalAction",
                                "description": "The name of the original action that was invoked - useful for error\nactions to create helpful debug messages.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 46,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "config": {
                                "name": "config",
                                "description": "A subset of the app config, the `config.server` namespace",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 60,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "inline literal",
                                "inherited": false
                            },
                            "id": {
                                "name": "id",
                                "description": "A UUID generated unqiue to this request. Useful for tracing a request\nthrough the application.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 31,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "incomingMessage": {
                                "name": "incomingMessage",
                                "description": "The underlying HTTP server's IncomingMessage instance",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 53,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "http.IncomingMessage",
                                "inherited": false
                            },
                            "params": {
                                "name": "params",
                                "description": "The params extracted from the router's dynamic segments",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 85,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "any",
                                "inherited": false
                            },
                            "route": {
                                "name": "route",
                                "description": "The route parser route that was matched",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 38,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Route",
                                "inherited": false
                            },
                            "hasBody": {
                                "name": "hasBody",
                                "description": "Does this request have a request body?",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 232,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            },
                            "headers": {
                                "name": "headers",
                                "description": "The headers for the incoming request",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 101,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Dict<>",
                                "inherited": false
                            },
                            "hostname": {
                                "name": "hostname",
                                "description": "Parse the \"Host\" header field to a hostname.\n\nWhen the \"trust proxy\" setting trusts the socket address, the\n\"X-Forwarded-Host\" header field will be trusted.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 177,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "ip": {
                                "name": "ip",
                                "description": "Return the remote address from the trusted proxy.\n\nThe is the remote address on the socket unless \"trust proxy\" is set.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 208,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "ips": {
                                "name": "ips",
                                "description": "When \"trust proxy\" is set, trusted proxy addresses + client.\n\nFor example if the value were \"client, proxy1, proxy2\" you would receive\nthe array `[\"client\", \"proxy1\", \"proxy2\"]` where \"proxy2\" is the furthest\ndown-stream and \"proxy1\" and \"proxy2\" were trusted.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 222,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string[]",
                                "inherited": false
                            },
                            "method": {
                                "name": "method",
                                "description": "The uppercase method name for the request, i.e. GET, POST, HEAD",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 67,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "path": {
                                "name": "path",
                                "description": "The requested path name",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 76,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string",
                                "inherited": false
                            },
                            "protocol": {
                                "name": "protocol",
                                "description": "Return the protocol string \"http\" or \"https\" when requested with TLS. When\nthe \"server.trustProxy\" setting trusts the socket address, the\n\"X-Forwarded-Proto\" header field will be trusted and used if present.\n\nIf you're running behind a reverse proxy that supplies https for you this\nmay be enabled.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 139,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "inherited": false
                            },
                            "query": {
                                "name": "query",
                                "description": "The query string, parsed into an object",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 92,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "Dict<>",
                                "inherited": false
                            },
                            "subdomains": {
                                "name": "subdomains",
                                "description": "Return subdomains as an array.\n\nSubdomains are the dot-separated parts of the host before the main domain\nof the app. By default, the domain of the app is assumed to be the last\ntwo parts of the host. This can be changed by setting\nconfig.server.subdomainOffset\n\nFor example, if the domain is \"tobi.ferrets.example.com\": If the subdomain\noffset is not set, req.subdomains is `[\"ferrets\", \"tobi\"]`. If the\nsubdomain offset is 3, req.subdomains is `[\"tobi\"]`.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 119,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "string[]",
                                "inherited": false
                            },
                            "xhr": {
                                "name": "xhr",
                                "description": "Check if the request was an _XMLHttpRequest_.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 164,
                                "tags": [
                                    {
                                        "name": "since",
                                        "value": "0.1.0"
                                    }
                                ],
                                "type": "boolean",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "accepts": {
                                "name": "accepts",
                                "description": "Check if the given `type(s)` is acceptable, returning the best match when\ntrue, otherwise `undefined`, in which case you should respond with 406\n\"Not Acceptable\".\n\nThe `type` value may be a single MIME type string such as\n\"application/json\", an extension name such as \"json\", a comma-delimited\nlist such as \"json, html, text/plain\", an argument list such as `\"json\",\n\"html\", \"text/plain\"`, or an array `[\"json\", \"html\", \"text/plain\"]`. When\na list or array is given, the _best_ match, if any is returned.\n\nExamples:\n\n    // Accept: text/html\n    req.accepts('html');\n    // => \"html\"\n\n    // Accept: text/*, application/json\n    req.accepts('html');\n    // => \"html\"\n    req.accepts('text/html');\n    // => \"text/html\"\n    req.accepts('json, text');\n    // => \"json\"\n    req.accepts('application/json');\n    // => \"application/json\"\n\n    // Accept: text/*, application/json\n    req.accepts('image/png');\n    req.accepts('png');\n    // => undefined\n\n    // Accept: text/*;q=.5, application/json\n    req.accepts(['html', 'json']);\n    req.accepts('html', 'json');\n    req.accepts('html, json');\n    // => \"json\"",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 304,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "string[]",
                                                "name": "type"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "acceptsCharsets": {
                                "name": "acceptsCharsets",
                                "description": "Check if the given `charset`s are acceptable, otherwise you should respond\nwith 406 \"Not Acceptable\".",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 331,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "string[]",
                                                "name": "charset"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "acceptsEncodings": {
                                "name": "acceptsEncodings",
                                "description": "Check if the given `encoding`s are accepted.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 316,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "string[]",
                                                "name": "encoding"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "acceptsLanguages": {
                                "name": "acceptsLanguages",
                                "description": "Check if the given `lang`s are acceptable, otherwise you should respond\nwith 406 \"Not Acceptable\".",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 346,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "type": "string[]",
                                                "name": "lang"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "getHeader": {
                                "name": "getHeader",
                                "description": "Return request header.\n\nThe `Referrer` header field is special-cased, both `Referrer` and\n`Referer` are interchangeable.\n\nExamples:\n\nreq.get('Content-Type'); // => \"text/plain\"\n\nreq.get('content-type'); // => \"text/plain\"\n\nreq.get('Something'); // => undefined\n\nAliased as `req.header()`.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 258,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "string"
                                        }
                                    },
                                    {
                                        "parameters": [
                                            {
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "is": {
                                "name": "is",
                                "description": "Check if the incoming request contains the \"Content-Type\" header field,\nand it contains the give mime `type`.\n\nExamples:\n\n     // With Content-Type: text/html; charset=utf-8\n     req.is('html');\n     req.is('text/html');\n     req.is('text/*');\n     // => true\n\n     // When Content-Type is application/json\n     req.is('json');\n     req.is('application/json');\n     req.is('application/*');\n     // => true\n\n     req.is('html');\n     // => false",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 406,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string[]",
                                                "name": "types"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "range": {
                                "name": "range",
                                "description": "Parse Range header field, capping to the given `size`.\n\nUnspecified ranges such as \"0-\" require knowledge of your resource length.\nIn the case of a byte range this is of course the total number of bytes. If\nthe Range header field is not given `undefined` is returned, `-1` when\nunsatisfiable, and `-2` when syntactically invalid.\n\nWhen ranges are returned, the array has a \"type\" property which is the type\nof range that is required (most commonly, \"bytes\"). Each array element is\nan object with a \"start\" and \"end\" property for the portion of the range.\n\nThe \"combine\" option can be set to `true` and overlapping & adjacent ranges\nwill be combined into a single range.\n\nNOTE: remember that ranges are inclusive, so for example \"Range: users=0-3\"\nshould respond with 4 users when available, not 3.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/request.ts",
                                "line": 375,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "number",
                                                "name": "size"
                                            },
                                            {
                                                "type": "parseRange.Options",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "Route": {
                        "name": "Route",
                        "description": "Extends the base RouteParser Route class with some additional properties\nthat Denali tacks on.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/route.ts",
                        "line": 11,
                        "tags": [
                            {
                                "name": "package",
                                "value": "runtime"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "action": {
                                "name": "action",
                                "description": "The Action class that should be invoked when a request hits this route",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/route.ts",
                                "line": 32,
                                "tags": [],
                                "type": "Constructor<Action>",
                                "inherited": false
                            },
                            "actionPath": {
                                "name": "actionPath",
                                "description": "The container name of the action",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/route.ts",
                                "line": 37,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "additionalParams": {
                                "name": "additionalParams",
                                "description": "You can define static data that should be included in the `params` passed\nto an action when you define a route in the config/routes.js file. This is\nuseful if you have a single action class whose behavior should vary based\non the endpoint hitting it (i.e. an authentication action whose logic is\nidentical, but needs to lookup different models based on the url)",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/route.ts",
                                "line": 27,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "spec": {
                                "name": "spec",
                                "description": "The spec for this route (just exposing this property in the type\ndefinition, since the RouteParser type definitions incorrectly don't\ninclude this property).",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/route.ts",
                                "line": 18,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            }
                        },
                        "methods": {}
                    },
                    "Router": {
                        "name": "Router",
                        "description": "The Router handles incoming requests, sending them to the appropriate\naction. It's also responsible for defining routes in the first place - it's\npassed into the `config/routes.js` file's exported function as the first\nargument.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/router.ts",
                        "line": 76,
                        "tags": [
                            {
                                "name": "package",
                                "value": "runtime"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {
                            "middleware": {
                                "name": "middleware",
                                "description": "The internal generic middleware handler, responsible for building and\nexecuting the middleware chain.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 95,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "config": {
                                "name": "config",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 97,
                                "tags": [],
                                "type": "ConfigService",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "delete": {
                                "name": "delete",
                                "description": "Shorthand for `this.route('delete', ...arguments)`",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 277,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "rawPattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "actionPath"
                                            },
                                            {
                                                "type": "any",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "get": {
                                "name": "get",
                                "description": "Shorthand for `this.route('get', ...arguments)`",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 241,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "rawPattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "actionPath"
                                            },
                                            {
                                                "type": "any",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "handle": {
                                "name": "handle",
                                "description": "Takes an incoming request and it's response from an HTTP server, prepares\nthem, runs the generic middleware first, hands them off to the appropriate\naction given the incoming URL, and finally renders the response.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 117,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "IncomingMessage",
                                                "name": "req"
                                            },
                                            {
                                                "type": "ServerResponse",
                                                "name": "res"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "handleError": {
                                "name": "handleError",
                                "description": "Takes a request, response, and an error and hands off to the generic\napplication level error action.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 165,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Request",
                                                "name": "request"
                                            },
                                            {
                                                "type": "ServerResponse",
                                                "name": "res"
                                            },
                                            {
                                                "type": "Error",
                                                "name": "error"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<any>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "head": {
                                "name": "head",
                                "description": "Shorthand for `this.route('head', ...arguments)`",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 286,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "rawPattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "actionPath"
                                            },
                                            {
                                                "type": "any",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "map": {
                                "name": "map",
                                "description": "Helper method to invoke the function exported by `config/routes.js` in the\ncontext of the current router instance.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 107,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "inline literal",
                                                "name": "fn"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "namespace": {
                                "name": "namespace",
                                "description": "Enables easy route namespacing. You can supply a method which takes a\nsingle argument that works just like the `router` argument in your\n`config/routes.js`, or you can use the return value just like the router.\n\nrouter.namespace('users', (namespace) => {\n    namespace.get('sign-in');\n  });\n  // or ...\n  let namespace = router.namespace('users');\n  namespace.get('sign-in');",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 389,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "namespace"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "fn"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "options": {
                                "name": "options",
                                "description": "Shorthand for `this.route('options', ...arguments)`",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 295,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "rawPattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "actionPath"
                                            },
                                            {
                                                "type": "any",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "patch": {
                                "name": "patch",
                                "description": "Shorthand for `this.route('patch', ...arguments)`",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 268,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "rawPattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "actionPath"
                                            },
                                            {
                                                "type": "any",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "post": {
                                "name": "post",
                                "description": "Shorthand for `this.route('post', ...arguments)`",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 250,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "rawPattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "actionPath"
                                            },
                                            {
                                                "type": "any",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "put": {
                                "name": "put",
                                "description": "Shorthand for `this.route('put', ...arguments)`",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 259,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "rawPattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "actionPath"
                                            },
                                            {
                                                "type": "any",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "resource": {
                                "name": "resource",
                                "description": "Create all the CRUD routes for a given resource and it's relationships.\nBased on the JSON-API recommendations for URL design.\n\nThe `options` argument lets you pass in `only` or `except` arrays to\ndefine exceptions. Action names included in `only` will be the only ones\ngenerated, while names included in `except` will be omitted.\n\nSet `options.related = false` to disable relationship routes.\n\nIf no options are supplied, the following routes are generated (assuming a\n'books' resource as an example):\n\n  * `GET /books`\n  * `POST /books`\n  * `GET /books/:id`\n  * `PATCH /books/:id`\n  * `DELETE /books/:id`\n  * `GET /books/:id/:relation`\n  * `GET /books/:id/relationships/:relation`\n  * `PATCH /books/:id/relationships/:relation`\n  * `POST /books/:id/relationships/:relation`\n  * `DELETE /books/:id/relationships/:relation`\n\nSee http://jsonapi.org/recommendations/#urls for details.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 327,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "resourceName"
                                            },
                                            {
                                                "type": "ResourceOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "route": {
                                "name": "route",
                                "description": "Add a route to the application. Maps a method and URL pattern to an\naction, with optional additional parameters.\n\nURL patterns can use:\n\n* Dynamic segments, i.e. `'foo/:bar'` * Wildcard segments, i.e.\n  `'foo/*bar'`, captures the rest of the URL up to the querystring\n* Optional groups, i.e. `'foo(/:bar)'`",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 195,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "method"
                                            },
                                            {
                                                "type": "string",
                                                "name": "rawPattern"
                                            },
                                            {
                                                "type": "string",
                                                "name": "actionPath"
                                            },
                                            {
                                                "type": "any",
                                                "name": "params"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            },
                            "urlFor": {
                                "name": "urlFor",
                                "description": "Returns the URL for a given action. You can supply a params object which\nwill be used to fill in the dynamic segements of the action's route (if\nany).",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 220,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "actionPath"
                                            },
                                            {
                                                "type": "any",
                                                "name": "data"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "use": {
                                "name": "use",
                                "description": "Add the supplied middleware function to the generic middleware stack that\nruns prior to action handling.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/runtime/router.ts",
                                "line": 179,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MiddlewareFn",
                                                "name": "middleware"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "Service": {
                        "name": "Service",
                        "description": "Services are typically used to represent either external systems (i.e. a\ncaching service) or a cross-cutting, reusable piece of application logic\n(i.e. an authorization / roles service).\n\nServices are mostly conventional - they are just singletons with no\nspecial behavior. The common base class ensures they are\nsingletons, makes user intent clear, and paves the way for introducing\nadditional common functionality in future versions of Denali.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/runtime/service.ts",
                        "line": 15,
                        "tags": [
                            {
                                "name": "package",
                                "value": "runtime"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "mixin": {
                                "name": "mixin",
                                "description": "Apply mixins using this class as the base class. Pure syntactic sugar for\nthe `mixin` helper.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 16,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "MixinApplicator<any, any>[]",
                                                "name": "mixins"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        },
                        "properties": {},
                        "methods": {
                            "teardown": {
                                "name": "teardown",
                                "description": "A hook invoked when an application is torn down. Only invoked on\nsingletons stored in the container.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/metal/object.ts",
                                "line": 24,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": true
                            }
                        }
                    }
                },
                "interfaces": {},
                "functions": []
            },
            "test": {
                "classes": {
                    "AcceptanceTest": {
                        "name": "AcceptanceTest",
                        "description": "The AppAcceptance class represents an app acceptance test. It spins up an\nin-memory instance of the application under test, and exposes methods to\nsubmit simulated requests to the application, and get the response. This\nhelps keep acceptance tests lightweight and easily parallelizable, since\nthey don't need to bind to an actual port.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/test/acceptance-test.ts",
                        "line": 27,
                        "tags": [
                            {
                                "name": "package",
                                "value": "test"
                            },
                            {
                                "name": "since",
                                "value": "0.1.0"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {
                            "setupTest": {
                                "name": "setupTest",
                                "description": "A helper method for setting up an app acceptance test. Adds\nbeforeEach/afterEach hooks to the current ava test suite which will setup\nand teardown the acceptance test. They also setup a test transaction and\nroll it back once the test is finished (for the ORM adapters that support\nit), so your test data won't pollute the database.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 39,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        },
                        "properties": {
                            "_injections": {
                                "name": "_injections",
                                "description": "An internal registry of container injections.",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 75,
                                "tags": [],
                                "type": "inline literal",
                                "inherited": false
                            },
                            "application": {
                                "name": "application",
                                "description": "The application instance under test",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 54,
                                "tags": [],
                                "type": "Application",
                                "inherited": false
                            },
                            "container": {
                                "name": "container",
                                "description": "The container instance for this test",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 59,
                                "tags": [],
                                "type": "Container",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "delete": {
                                "name": "delete",
                                "description": "Send a simulated DELETE request",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 181,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "url"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<inline literal>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "get": {
                                "name": "get",
                                "description": "Send a simulated GET request",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 165,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "url"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<inline literal>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "getHeader": {
                                "name": "getHeader",
                                "description": "Get the current value of a default header",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 214,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "T",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "head": {
                                "name": "head",
                                "description": "Send a simulated HEAD request",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 173,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "url"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<inline literal>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "inject": {
                                "name": "inject",
                                "description": "Overwrite an entry in the test application container. Use `restore()` to\nrestore the original container entry later.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 252,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "name"
                                            },
                                            {
                                                "type": "any",
                                                "name": "value"
                                            },
                                            {
                                                "type": "ContainerOptions",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "lookup": {
                                "name": "lookup",
                                "description": "Lookup an entry in the test application container",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 242,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "any"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "patch": {
                                "name": "patch",
                                "description": "Send a simulated PATCH request",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 205,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "url"
                                            },
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<inline literal>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "post": {
                                "name": "post",
                                "description": "Send a simulated POST request",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 189,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "url"
                                            },
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<inline literal>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "put": {
                                "name": "put",
                                "description": "Send a simulated PUT request",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 197,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "url"
                                            },
                                            {
                                                "type": "any",
                                                "name": "body"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<inline literal>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "removeHeader": {
                                "name": "removeHeader",
                                "description": "Remove a default header value",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 233,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "request": {
                                "name": "request",
                                "description": "Submit a simulated HTTP request to the application.",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 126,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "inline literal",
                                                "name": "options"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<inline literal>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "restore": {
                                "name": "restore",
                                "description": "Restore the original container entry for an entry that was previously\noverwritten by `inject()`",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 264,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setHeader": {
                                "name": "setHeader",
                                "description": "Set a default header value",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 224,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "T",
                                                "name": "name"
                                            },
                                            {
                                                "type": "U",
                                                "name": "value"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setup": {
                                "name": "setup",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 86,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "AcceptanceTestContext",
                                                "name": "context"
                                            }
                                        ],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "shutdown": {
                                "name": "shutdown",
                                "description": "Shut down the test application, cleaning up any resources in use",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 274,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "start": {
                                "name": "start",
                                "description": "Start the application (note: this won't actually start the HTTP server, but performs all the\nother startup work for you).",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 117,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "teardown": {
                                "name": "teardown",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/acceptance-test.ts",
                                "line": 99,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "Promise<void>"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "MockRequest": {
                        "name": "MockRequest",
                        "description": "A mock request used to simluate an HTTP request to the application during\ntests. You shouldn't need to instantiate these directly - instead, use an\nAppAcceptance test.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/test/mock-request.ts",
                        "line": 26,
                        "tags": [
                            {
                                "name": "package",
                                "value": "test"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "connection": {
                                "name": "connection",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 36,
                                "tags": [],
                                "type": "Socket",
                                "inherited": false
                            },
                            "headers": {
                                "name": "headers",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 41,
                                "tags": [],
                                "type": "IncomingHttpHeaders",
                                "inherited": false
                            },
                            "httpVersion": {
                                "name": "httpVersion",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 28,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "method": {
                                "name": "method",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 51,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "readable": {
                                "name": "readable",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 59,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            },
                            "trailers": {
                                "name": "trailers",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 54,
                                "tags": [],
                                "type": "Dict<string>",
                                "inherited": false
                            },
                            "url": {
                                "name": "url",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 52,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "httpVersionMajor": {
                                "name": "httpVersionMajor",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 29,
                                "tags": [],
                                "type": "number",
                                "inherited": false
                            },
                            "httpVersionMinor": {
                                "name": "httpVersionMinor",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 32,
                                "tags": [],
                                "type": "number",
                                "inherited": false
                            },
                            "rawHeaders": {
                                "name": "rawHeaders",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 42,
                                "tags": [],
                                "type": "string[]",
                                "inherited": false
                            },
                            "rawTrailers": {
                                "name": "rawTrailers",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 55,
                                "tags": [],
                                "type": "string[]",
                                "inherited": false
                            },
                            "socket": {
                                "name": "socket",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 37,
                                "tags": [],
                                "type": "Socket",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "destroy": {
                                "name": "destroy",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 110,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setTimeout": {
                                "name": "setTimeout",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-request.ts",
                                "line": 107,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "number",
                                                "name": "msecs"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "callback"
                                            }
                                        ],
                                        "return": {
                                            "type": "this"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    },
                    "MockResponse": {
                        "name": "MockResponse",
                        "description": "A mock response used to simluate the server response to mock requests during\ntests. You shouldn't need to instantiate these directly - instead, use an\nAppAcceptance test.",
                        "access": "public",
                        "deprecated": false,
                        "file": "lib/test/mock-response.ts",
                        "line": 13,
                        "tags": [
                            {
                                "name": "package",
                                "value": "test"
                            }
                        ],
                        "staticProperties": {},
                        "staticMethods": {},
                        "properties": {
                            "_body": {
                                "name": "_body",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 37,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "_customStatusMessage": {
                                "name": "_customStatusMessage",
                                "access": "protected",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 35,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            },
                            "_headers": {
                                "name": "_headers",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 20,
                                "tags": [],
                                "type": "OutgoingHttpHeaders",
                                "inherited": false
                            },
                            "_json": {
                                "name": "_json",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 38,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "chunkedEncoding": {
                                "name": "chunkedEncoding",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 24,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            },
                            "connection": {
                                "name": "connection",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 33,
                                "tags": [],
                                "type": "any",
                                "inherited": false
                            },
                            "finished": {
                                "name": "finished",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 30,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            },
                            "headersSent": {
                                "name": "headersSent",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 31,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            },
                            "sendDate": {
                                "name": "sendDate",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 27,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            },
                            "shouldKeepAlive": {
                                "name": "shouldKeepAlive",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 25,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            },
                            "statusCode": {
                                "name": "statusCode",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 16,
                                "tags": [],
                                "type": "number",
                                "inherited": false
                            },
                            "upgrading": {
                                "name": "upgrading",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 23,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            },
                            "useChunkedEncodingByDefault": {
                                "name": "useChunkedEncodingByDefault",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 26,
                                "tags": [],
                                "type": "boolean",
                                "inherited": false
                            },
                            "statusMessage": {
                                "name": "statusMessage",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 17,
                                "tags": [],
                                "type": "string",
                                "inherited": false
                            }
                        },
                        "methods": {
                            "_implicitHeader": {
                                "name": "_implicitHeader",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 64,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "addTrailers": {
                                "name": "addTrailers",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 83,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "name": "headers"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "assignSocket": {
                                "name": "assignSocket",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 100,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Socket",
                                                "name": "socket"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "detachSocket": {
                                "name": "detachSocket",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 101,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "Socket",
                                                "name": "socket"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "flushHeaders": {
                                "name": "flushHeaders",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 86,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "getHeader": {
                                "name": "getHeader",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 68,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {}
                                    }
                                ],
                                "inherited": false
                            },
                            "getHeaderNames": {
                                "name": "getHeaderNames",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 74,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "string[]"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "getHeaders": {
                                "name": "getHeaders",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 71,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "OutgoingHttpHeaders"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "hasHeader": {
                                "name": "hasHeader",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 77,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "boolean"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "removeHeader": {
                                "name": "removeHeader",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 80,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "name"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setHeader": {
                                "name": "setHeader",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 65,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "string",
                                                "name": "name"
                                            },
                                            {
                                                "name": "value"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "setTimeout": {
                                "name": "setTimeout",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 102,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "number",
                                                "name": "msecs"
                                            },
                                            {
                                                "type": "inline literal",
                                                "name": "callback"
                                            }
                                        ],
                                        "return": {
                                            "type": "this"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "write": {
                                "name": "write",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 52,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "name": "chunk"
                                            },
                                            {
                                                "name": "encoding"
                                            },
                                            {
                                                "type": "Function",
                                                "name": "cb"
                                            }
                                        ],
                                        "return": {
                                            "type": "boolean"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "writeContinue": {
                                "name": "writeContinue",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 98,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            },
                            "writeHead": {
                                "name": "writeHead",
                                "access": "public",
                                "deprecated": false,
                                "file": "lib/test/mock-response.ts",
                                "line": 88,
                                "tags": [],
                                "signatures": [
                                    {
                                        "parameters": [
                                            {
                                                "type": "number",
                                                "name": "statusCode"
                                            },
                                            {
                                                "name": "statusMessage"
                                            },
                                            {
                                                "type": "OutgoingHttpHeaders",
                                                "name": "headers"
                                            }
                                        ],
                                        "return": {
                                            "type": "void"
                                        }
                                    }
                                ],
                                "inherited": false
                            }
                        }
                    }
                },
                "interfaces": {},
                "functions": []
            }
        }
    },
    "documenter": {
        "version": "1.0"
    }
  }
];
