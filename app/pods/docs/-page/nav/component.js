import Ember from 'ember';

export default Ember.Component.extend({

  tagName: 'nav',
  classNames: [ 'docs-nav' ],

  activeNavMenu: null,

  click(e) {
    let $target = this.$(e.target);
    if ($target.is('a')) {
      this.set('activeNavMenu', null);
    }
  },

  actions: {
    toggleNavMenu(menuToToggle, e) {
      let openMenu = this.$('.menu-dropdown').get(0);
      if (openMenu && (openMenu === e.target || $.contains(openMenu, e.target))) {
        return;
      }
      let active = this.get('activeNavMenu');
      if (active === menuToToggle) {
        this.set('activeNavMenu', null);
      } else {
        this.set('activeNavMenu', menuToToggle);
      }
    }
  }

});