import Route from '@ember/routing/route';

export default Route.extend({

  model(params) {
    return this.store.find('version', `@denali-js:core@${ params.version_id }`).then((version) => {
      return version.get('doc').then((doc) => {
        return { version, doc };
      });
    });
  }

})

