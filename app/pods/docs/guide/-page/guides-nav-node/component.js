import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  classNames: [ 'guide-node' ],

  isGroupExpanded: true,

  slug: computed('parentSlug', 'node.slug', function() {
    let root = this.get('root');
    if (root) {
      return null;
    }
    let parentSlug = this.get('parentSlug');
    let slug = this.get('node.slug');
    if (parentSlug === null) {
      return slug;
    }
    return `${ parentSlug }/${ slug }`;
  })

});

