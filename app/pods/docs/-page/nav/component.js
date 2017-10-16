import Ember from 'ember';

const computed = Ember.computed;

export default Ember.Component.extend({

  tagName: 'nav',
  classNames: [ 'docs-nav' ],

  activeNavMenu: null,

  guidesByGroup: computed('guides', function() {
    let guides = this.get('guides');
    return guides.reduce((groups, guide) => {
      let groupName = guide.get('group');
      let group = groups[groupName] = groups[groupName] || [];
      group.push(guide);
      return groups;
    }, {});
  }),

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