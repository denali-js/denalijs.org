import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({

  store: service(),

  addon: computed('addonId', function() {
    return this.get('store').find('addon', this.get('addonId'));
  }),

});
