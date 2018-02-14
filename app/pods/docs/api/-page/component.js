import Component from '@ember/component';
import { computed } from '@ember/object';
import lookupAPI from 'denali/helpers/lookup-api';
import { singularize } from 'ember-inflector';


export default Component.extend({

  api: computed('doc', 'slug', function() {
    return lookupAPI(this.get('doc.api'), this.get('slug'));
  }),

  kind: computed('slug', function() {
    return singularize(this.get('slug').split('/')[1]);
  }),

  kindComponentName: computed('kind', function() {
    let kind = this.get('kind');
    return `-ui/docs/api-body/${ kind }`;
  })

});
