import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { empty, alias } from '@ember/object/computed';
import { computed } from '@ember/object';
import { task, timeout } from 'ember-concurrency';

export default Component.extend({

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
