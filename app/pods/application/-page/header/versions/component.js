import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({

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

