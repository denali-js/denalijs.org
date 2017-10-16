import Ember from 'ember';

const RSVP = Ember.RSVP;

export default Ember.Route.extend({

  model({ version }) {
    return this.store.queryRecord('version', { version }).then((version) => {
      return RSVP.hash({
        version,
        guides: version.get('guides'),
        api: version.get('api')
      });
    });
  }

})

