import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  classNames: 'graphic',

  firstLetter: computed('addon.name', function() {
    let name = this.get('addon.name') || '?';
    if (name.indexOf('denali-') === 0) {
      name = name.slice('denali-'.length);
    } else if (name.indexOf('@denali-js/') === 0) {
      name = name.slice('@denali-js/'.length);
    }
    return name.charAt(0).toLowerCase();
  })

});

