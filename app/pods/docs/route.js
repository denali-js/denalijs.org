import Ember from 'ember';

export default Ember.Route.extend({

  model({ version }) {
    return this.store.queryRecord('version', { version });
  }

})

