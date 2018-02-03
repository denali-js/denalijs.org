import Route from '@ember/routing/route';

export default Route.extend({

  model({ version }) {
    return this.store.queryRecord('version', { version });
  }

})

