import Ember from 'ember';

const computed = Ember.computed;
const service = Ember.inject.service;

export default Ember.Component.extend({

  store: service(),

  classNames: [ 'version-menu' ],

  init() {
    this._super(...arguments);
    this.get('versions');
  },

  versions: computed(function() {
    return this.get('store').findAll('version');
  })

});

