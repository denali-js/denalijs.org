import Ember from 'ember';

export default Ember.Route.extend({

  model({ addonName }) {
    return this.store.find('addon', addonName);
  }

})