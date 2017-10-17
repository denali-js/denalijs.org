import Ember from 'ember';

const computed = Ember.computed;

export default Ember.Component.extend({

  guidesByGroup: computed('guides', function() {
    let guides = this.get('guides');
    return guides.reduce((groups, guide) => {
      let groupName = guide.get('group');
      let group = groups[groupName] = groups[groupName] || [];
      group.push(guide);
      return groups;
    }, {});
  })

});
