import Ember from 'ember';

export default Ember.Component.extend({

  tagName: 'nav',
  classNames: [ 'docs-nav' ],

  activeNavMenu: null,

  actions: {
    toggleNavMenu(menuToToggle) {
      let active = this.get('activeNavMenu');
      if (active === menuToToggle) {
        this.set('activeNavMenu', null);
      } else {
        this.set('activeNavMenu', menuToToggle);
      }
    }
  }

});