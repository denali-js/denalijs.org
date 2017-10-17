import Ember from 'ember';

const computed = Ember.computed;
const service = Ember.inject.service;

export default Ember.Component.extend({

  router: service(),

  classNameBindings: [ 'isFixedWidth:fixed-width:full-width' ],

  isFixedWidth: computed('router.currentRouteName', function() {
    return this.get('router.currentRouteName').indexOf('docs.apis') !== 0;
  })

})