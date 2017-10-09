import Ember from 'ember';
import { task, timeout } from 'ember-concurrency';

const computed = Ember.computed;
const { alias, empty } = Ember.computed;
const { service } = Ember.inject;

export default Ember.Component.extend({

  store: service(),

  init() {
    this._super(...arguments);
    this.get('search').perform(this.get('searchTerm'));
  },

  featuredAddons: computed(function() {
    this.get('store').query('addon', { filter: { featured: true } });
  }),

  searchTermEmpty: empty('searchTerm'),

  search: task(function * (searchTerm) {
    if (searchTerm && searchTerm.trim().length > 0 && searchTerm !== this.get('searchTerm')) {
      yield timeout(200);
      searchTerm = searchTerm.trim();
      this.set('searchTerm', searchTerm);
      return yield this.get('store').query('addon', { query: searchTerm });
    } else {
      this.set('searchTerm', null);
    }
  }).restartable(),
  searchResults: alias('search.lastSuccessful.value')

});
