import Ember from 'ember';

export default Ember.Route.extend({

  model() {
    return this.store.query('addon', { filter: { featured: true } });
  }

})
