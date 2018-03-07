import Route from '@ember/routing/route';

export default Route.extend({

  model(params) {
    return this.store.queryRecord('version', { addon: '@denali-js/core', version: params.version_id }).then((version) => {
      return version.getDocs().then((docs) => {
        return { version, docs };
      });
    });
  }

})

