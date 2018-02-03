import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  primarySignature: computed('method.signatures', function() {
    return this.get('method.signatures.firstObject');
  }),

  overloads: computed('method.signatures', function() {
    return this.get('method.signatures').slice(1);
  })

})