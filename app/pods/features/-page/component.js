/* eslint-disable ember/avoid-leaking-state-in-ember-objects */
import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  featureSections: [
    {
      headline: 'Developer Experience',
      subhead: 'Features that make Denali a joy to build with.',
      features: [
        {
          icon: 'open-lock',
          headline: 'Layered Conventions',
          description: `
            Layered conventions means that the framework attempts to
            provide good defaults for most users, but also exposes lower
            level abstractions as escape valves when you need it.
          `,
          link: 'blog.post',
          linkModel1: 'fixme',
          linkText: 'Read the blog post'
        },
        {
          icon: 'open-lock',
          headline: 'Write in any language',
          description: `
            Want to use Typescript, Flow, or something more exotic? Denali
            apps can be written in any language that compiles down to
            JavaScript. It's just an addon install away.
          `,
          link: 'addons',
          linkText: 'Browse language addons'
        },
        {
          icon: 'open-lock',
          headline: 'Extensive documentation',
          description: `
            Denali is thoroughly documented, and Denali addons generate
            automatic API documentation out of the box, making good docs for
            community libraries a trivial effort.
          `,
          link: 'docs.quickstart',
          linkModel1: 'latest',
          linkText: 'Start with the Quickstart'
        },
        {
          icon: 'open-lock',
          headline: 'Powerful CLI',
          description: `
            The Denali CLI will automatically watch your source files and
            rebuild on changes in development (for addons too!). It also
            supports in debug mode, even for running production servers!
          `,
          link: 'docs.guide',
          linkModel1: 'latest',
          linkModel2: 'cli/overview',
          linkText: 'Learn more about the CLI'
        }
      ]
    },
    {
      headline: 'Extensibility',
      subhead: 'Leverage the experience of the community to move faster and build better apps.',
      features: [
        {
          icon: 'open-lock',
          headline: 'ORM Agnostic',
          description: `
            Don't tie yourself down to a single "blessed" ORM or database. Denali
            understands that modern apps are often data polyglots, and lets you
            choose the right tool for the job.
          `,
          link: 'addons',
          linkText: 'Explore ORM addons'
        },
        {
          icon: 'open-lock',
          headline: 'Addons',
          description: `
            Like mini, self-contained apps, addons let you leverage a growing
            ecosystem of community solutions, freeing you to focus on
            building what matters: your app.
          `,
          link: 'addons',
          linkText: 'Browse addons'
        },
        {
          icon: 'open-lock',
          headline: 'Express Middleware',
          description: `
            Drop in support for Express middleware lets you get all the benefits of Denali, while
            tapping into the massive Express ecosystem when you need it.
          `,
          link: 'docs.guide',
          linkModel1: 'latest',
          linkModel2: 'application/middleware',
          linkText: 'Learn about middleware'
        }
      ]
    },
    {
      headline: 'Testing',
      subhead: 'Testing is a first-class citizen in Denali, with powerful tools that make writing & maintaining tests easy.',
      features: [
        {
          icon: 'open-lock',
          headline: 'Acceptance Testing',
          description: `
            Built in testing primitives let you simulate requests to your app
            end-to-end with ease. And support for snapshot testing makes getting
            good coverage even easier.
          `,
          link: 'docs.guide',
          linkModel1: 'latest',
          linkModel2: 'testing/acceptance',
          linkText: 'Learn about acceptance testing'
        },
        {
          icon: 'open-lock',
          headline: 'Unit Testing',
          description: `
            Easily inject mocks and stubs with Denali's unit test primitives,
            while precisely dialing in the level of isolation needed. Start
            off leaning on your app code, then gradually mock those
            dependencies over time.
          `,
          link: 'docs.guide',
          linkModel1: 'latest',
          linkModel2: 'testing/unit',
          linkText: 'Learn about unit testing'
        },
        {
          icon: 'open-lock',
          headline: 'Parallel & Isolated Tests',
          description: `
            Automaticlly parallelized tests with process level isolation help
            you maintain a tight testing feedback loop and clean, leak free
            tests.
          `,
          link: 'docs.guide',
          linkModel1: 'latest',
          linkModel2: 'testing/parallelization',
          linkText: 'Learn about testing'
        }
      ]
    },
    {
      headline: 'Parsing & Rendering',
      subhead: 'Move data in and out of your app with ease. Drop in support for standards like JSON-API, or go fully custom.',
      features: [
        {
          icon: 'open-lock',
          headline: 'Serializers',
          description: `
            Serializers give you fine grained control over your API
            responses, as well as help protect sensitive data from leaking.
          `,
          link: 'docs.guide',
          linkModel1: 'latest',
          linkModel2: 'application/serializers',
          linkText: 'Get started with Serializers'
        },
        {
          icon: 'open-lock',
          headline: 'JSON-API 1.0 Support',
          description: `
            Denali ships out of the box with a standard JSONSerializer for
            a simple response format, as well as a JSON-API 1.0 compliant
            Serializer.
          `,
          link: 'docs.api',
          linkModel1: 'latest',
          linkModel2: 'render/classes/JSONAPISerializer',
          linkText: 'Customize the JSONAPISerializer'
        },
        {
          icon: 'open-lock',
          headline: 'Parsers',
          description: `
            The twin sibling to Serializers, Parsers give you the ability
            precisely control how incoming requests are translated into
            something your Actions can use.
          `,
          link: 'docs.guide',
          linkModel1: 'latest',
          linkModel2: 'application/parsers',
          linkText: 'Get started with Parsers'
        }
      ]
    },
    {
      headline: 'Community',
      subhead: "Feel welcome, get help, and contribute back. At the end of the day, it's all about the people",
      features: [
        {
          icon: 'open-lock',
          headline: 'Get help on Slack',
          description: `
            Come hang out on our community Slack. Get help starting with
            Denali, provide feedback on the roadmap, learn best practices,
            and contribute back!
          `,
          link: 'community',
          linkText: 'Join the conversation'
        },
        {
          icon: 'open-lock',
          headline: 'Core contributor office hours',
          description: `
            Each week, core contributors graciously spend time in office
            hours. Got a particularly tough problem to crack, or looking
            to understand the best way to handle something in Denali? Stop
            by and ask!
          `,
          link: 'community',
          linkText: 'Schedule a time'
        },
        {
          icon: 'open-lock',
          headline: 'Be treated with respect',
          description: `
            Our core community tenet is: "Treat everyone with respect."
            Feel welcome from day one, and don't hesitate to ask for help!
          `,
          link: 'community',
          linkText: 'Get involved'
        }
      ]
    },
    {
      headline: 'Coming Soon',
      subhead: "We're constantly working to ship new features and improvements. Here's a sneak peek of what's on our radar.",
      features: [
        {
          icon: 'open-lock',
          headline: 'HTTPS Support',
          description: `
            No more fighting SSL certificates: easily run your
            development server with HTTPS locally thanks to devcert, and
            in production with LetsEncrypt support baked in.
          `,
          link: 'roadmap',
          linkText: 'Check out the roadmap'
        },
        {
          icon: 'open-lock',
          headline: 'Websockets',
          description: `
            Leverage Node's powerful evented model to handle Websockets
            with ease. Built in primitives for soft-realtime socket
            communication make modern apps a breeze.
          `,
          link: 'roadmap',
          linkText: 'Check out the roadmap'
        },
        {
          icon: 'open-lock',
          headline: 'Advanced Testing',
          description: `
            Use built in primitives for discovering performance regressions,
            diagnosing memory leaks, and load testing.
          `,
          link: 'roadmap',
          linkText: 'Check out the roadmap'
        }
      ]
    }
  ],

  comparisons: [
    {
      logo: 'rails.png',
      name: 'Ruby on Rails (Ruby)',
      shortName: 'Rails',
      summary: `
        Rails and Denali have very similar approachs and philosophy (though
        not exactly the same). Most of the difference here comes down to
        maturity vs. runtime. The biggest advantage by far for Rails is the
        size of it's ecosystem, while Denali's is the Node runtime.
      `,
      pros: [
        `Write your app in JavaScript - a single language throughout your stack`,
        `Node's evented model, and JavaScript's async nature, are much better suited to handling the concurrency of modern web applications`
      ],
      cons: [
        `Rails is a vastly larger ecosystem, with lots of mature solutions, help, and talent`
      ]
    },
    {
      logo: 'phoenix.png',
      name: 'Phoenix (Elixir)',
      shortName: 'Phoenix',
      summary: `
        Phoenix and Denali share some philosophy and approach, but the
        implementations can be vastly different. Elixir and the Erlang VM
        offer impressive concurrency abilities, but can come with a steeper
        learning curve if you come from more traditional web development
        backgrounds.
      `,
      pros: [
        `Write your app in JavaScript - a single language throughout your stack`,
        `Denali is ORM agnostic - bring any ORM or datastore you want to the table`,
        `JavaScript is a multi-paradigm language - use functional or object-oriented style when it makes sense`,
        `Denali is an API-first framework, so it doesn't carry the mental overhead of server rendering`,
      ],
      cons: [
        `Elixir is one of the few languages/runtimes that handles concurrency better than Node. If you truly need a million concurrent requests on one box, Elixir handles it better`,
        `Elixir is a functional language first and foremost, and so offers a better functional experience.`,
        `If you want to server-render your HTML, Denali doesn't support this out of the box like Elixir does`
      ]
    },
    {
      logo: 'sails.png',
      name: 'Sails.js (Node)',
      shortName: 'Sails',
      summary: `
        Often self-described as "Rails for Node", Sails takes a conventional
        approach much like Denali. But in some cases it ends up running
        against the grain of typical Node patterns (i.e. global variables).
        It's also tightly bound to Waterline, which can be limiting for many
        applications.
      `,
      pros: [
        `Write your app in any compile-to-JavaScript language. Typescript? No problem.`,
        `Denali is ORM agnostic - bring any ORM or datastore you want to the table`,
        `Denali's Addons are a powerful tool for sharing solutions and code`,
        `Denali is an API-first framework, so it doesn't carry the mental overhead of server rendering`,
      ],
      cons: [
        `Sails has been around longer, and is the more mature project`,
        `If you want to server-render your HTML, Denali doesn't support this out of the box like Sails.js does`
      ]
    },
    {
      logo: 'express.png',
      name: 'Express (Node)',
      shortName: 'Express',
      summary: `
        Often the defacto choice for building Node apps, comparing Express to
        Denali isn't quite apples-to-apples. Express primarily handles
        routing and the bare minimum of rendering. Denali, on the other hand,
        hands the full application lifecycle. Express and Denali can often
        compliment, rather than compete, with each other.
      `,
      pros: [
        `Write your app in any compile-to-JavaScript language. Typescript? No problem.`,
        `Denali's Addons are a powerful tool for sharing solutions and code`,
        `Denali's strong conventions make it easy to leverage shared solutions, onboard new devs, and move between codebases`,
      ],
      cons: [
        `The scope of Express is much smaller, therefore it's quicker to learn`,
        `Express is by far the most used tool for building apps in Node, so you'll find lots more help for it`
      ]
    }
  ],
  activeComparisonIndex: 0,
  activeComparison: computed('comparisons', 'activeComparisonIndex', function() {
    return this.get('comparisons').objectAt(this.get('activeComparisonIndex'));
  }),

  doctrinePoints: [
    {
      headline: 'Optimize for developer productivity',
      paragraphs: [
        `
          Using Denali is a user experience - and we should treat it as such.
          We should be continually asking ourselves: what can Denali do to help
          developers work faster, smarter, happier?
        `,
        `
          A great user experience is one that feels effortless. It anticpates
          failure scenarios and handles them gracefully. It leaves the user
          with a clear picture of "what's next", of how to solve the problem,
          and how to accomplish their goals. With each aspect of Denali, try to
          keep this at the heart.
        `
      ]
    },
    {
      headline: 'Find the right abstractions',
      paragraphs: [
        `
          Denali is a framework for leveraging shared solutions to shared
          problems. The way to leverage shared solutions is to find the right
          abstractions. The right abstraction exposes just the right levers
          in just the right places; too many levers, and you haven't fully
          captured the <em>shared</em> aspect of the solution. Too few, and
          you've over-simplified the problem.
        `,
        `
          Put differently, a good abstraction minimizes accidental complexity
          while maximizing control over essential complexity. It provides a
          simple approach to solving the common use cases, while exposing
          more power to those that need it.
        `,
        `
          Finding the right abstraction is hard; inventing it from whole
          cloth is even harder. Instead, Denali tries to leverage it's
          core/userland model (see #3) to allow for experimentation to
          <em>discover</em> the best abstractions through real world
          application, without subjecting users to too much API churn.
        `
      ]
    },
    {
      headline: 'Stability without stagnation',
      paragraphs: [
        `
          Denali aims to foster a stable core, while encouraging progress,
          experimentation, and innovation through "userland" addons.
        `,
        `
          We often talk about “core” versus “userland”, terms inspired by
          language used to describe an operating system kernel. “Core” (or,
          "kernel" in OS-talk) is a minimal set of highly trusted, rock solid
          code that exposes basic primitives (the right abstractions - see
          #2). “Userland”, meanwhile, refers to Denali apps and addons, which
          are less bound by the strict stability guarantees of core. This
          reduce stability guarantee in turn allows for greater experimentation.
        `,
        `
          By allowing userland code to experiment and move quickly, we can
          uncover the right abstractions, even occasionally adopting them
          back into core, without excessive API churn.
        `
      ]
    },
    {
      headline: 'Follow the 80/18 rule',
      paragraphs: [
        `
          Denali attempts to solve 80% of use cases well. We should plan
          features and interfaces with this group in mind, and aim make their
          experience delightful.
        `,
        `
          For most of the remaining 20% (the “18%”), we make sure to provide
          “escape hatches”. These use cases might not be the principal ones we
          design around, but they should be possible to accomplish without
          feeling like you are fighting the framework.
        `,
        `
          We purposefully leave out the remaining small fraction of use cases
          (the “2%”). This is an admission that we’re never going to solve
          every use case, nor should we. There are other choices out there
          besides Denali that are likely better suited.
        `
      ]
    },
    {
      headline: 'Marketing matters',
      paragraphs: [
        `
          Most of us would like to think that technology adoption is a purely
          rational, well thought out process of weighing tradeoffs and picking
          the best technical solution. Unfortunately, that’s usually not reality.
        `,
        `
          This can be frustrating: vanity metrics and microbenchmarks often
          don't measure realistic metrics, and most users would never come
          close to those limits in any case. It's tempting to dismiss such
          discussion as "unimportant", and instead focus on a "purer"
          implementation of Denali.
        `,
        `
           We reject this approach. Perception and marketing matter, to some
           extent. To phrase it more concretely: Denali will probably never
           be the fastest web framework out there by any microbenchmark
           standard. But we at least want to show up on the same graph.
        `
      ]
    },
    {
      headline: 'Respect',
      paragraphs: [
        `
          The Internet is a challenging place to foster great culture, so we
          have to be intentional about it. A great culture can help a project
          like Denali blossom and thrive - and a caustic one will kill it off
          before it can even germinate.
        `,
        `
          The cardinal rule for participating in Denali's community is: treat
          everyone with respect. Behavior to the contrary is not welcome here.
        `,
        `
          We aim to treat everyone with respect, to always remember the human
          on the other side of the keyboard, to start with the assumption of
          good faith motivation, and the always argue the best intepretation.
        `
      ]
    }
  ]

});