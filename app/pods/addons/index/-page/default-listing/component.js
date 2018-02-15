import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({

  store: service(),

  groups: computed(function() {
    return [
      {
        headline: 'Language Compilers',
        description: `
          Write your app in your favorite compile-to-JS language. Use the latest
          JavaScript langauge features with Babel. Or add robust type checking with
          Typescript. Or go for something more exotic!
        `,
        examples: [ '@denali-js:babel', '@denali-js:typescript' ]
      },
      {
        headline: 'Linting',
        description: `
          Make sure you app conforms to code styles and rules your whole team can
          argue about for an excessive amount of time.
        `,
        examples: [ '@denali-js:eslint' ]
      },
      {
        headline: 'Database & ORMs',
        description: `
          Plug-n-play database integrations via the best ORMs in Node. Use the right
          tool for the job, even at your data layer.
        `,
        examples: [ 'denali-objection' ]
      }
    ]
  }),

});
