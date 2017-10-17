import Ember from 'ember';

export default Ember.Route.extend({

  model({ slug }) {
    let version = this.modelFor('docs').version.id;
    let [ kind, pkg, name ] = slug.split('/');
    return this.store.findRecord(`api-${ kind }`, [ version, pkg, name ].join(':'));
  },

  serialize(api) {
    let kind = api.constructor.modelName.split('-')[1];
    let pkg = api.get('pkg');
    let name = api.get('name');
    return { slug: [ kind, pkg, name ].join('/') };
  }

});
