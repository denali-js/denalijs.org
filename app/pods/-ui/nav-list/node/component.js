import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  classNames: [ 'nav-list-node' ],

  isGroupExpanded: true,

  slug: computed('parentSlug', 'node.slug', function() {
    let parentSlug = this.get('parentSlug');
    let selfSlug = this.get('node.slug');
    if (parentSlug) {
      return [ parentSlug, selfSlug ].join('/');
    }
    return selfSlug;
  })

});
