import Ember from 'ember';

const computed = Ember.computed;

export default Ember.Component.extend({

  classNames: 'graphic',

  firstLetter: computed('addon.name', function() {
    let name = this.get('addon.name') || '?';
    if (name.indexOf('denali-') === 0) {
      name = name.slice('denali-'.length);
    }
    return name.charAt(0).toLowerCase();
  })

});

