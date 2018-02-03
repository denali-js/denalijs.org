import Route from '@ember/routing/route';
import { hash } from 'rsvp';

export default Route.extend({

  model({ slug }) {
    let version = this.modelFor('docs');
    let [ kind, pkg, name ] = slug.split('/');
    let type = `api-${ kind }`;
    let id = [ version.id, pkg, name ].join(':');
    return hash({
      entry: this.store.findRecord(type, id),
      version
    });
  },

  serialize(api) {
    return { slug: api.get('slug') };
  }

});
