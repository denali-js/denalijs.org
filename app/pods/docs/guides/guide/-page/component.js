import Ember from 'ember';

const service = Ember.inject.service;

export default Ember.Component.extend({

  router: service(),

  click(e) {
    if (this.$(e.target).is('.api-peek')) {
      e.preventDefault();
      this.get('router').transitionTo('docs.apis.api', 'stable', this.$(e.target).data('api-id'));
    }
  }

});
