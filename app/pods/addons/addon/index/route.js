import Ember from 'ember';

export default Ember.Route.extend({
  
  model() {
    let addonName = this.modelFor('addon').get('name');
    return this.store.find('overview', addonName);    
  }

});