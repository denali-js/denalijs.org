import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({

  store: service(),

  categories: computed(function() {
    return this.get('store').findAll('category');
  }),

});
