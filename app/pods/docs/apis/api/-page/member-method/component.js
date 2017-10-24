import Ember from 'ember';

const computed = Ember.computed;

export default Ember.Component.extend({

  primarySignature: computed('method.signatures', function() {
    return this.get('method.signatures.firstObject');
  }),

  overloads: computed('method.signatures', function() {
    return this.get('method.signatures').slice(1);
  })

})