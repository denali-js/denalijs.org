import { forEach, isEmpty } from 'lodash';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { lookupApi } from 'denali/helpers/lookup-api';
import { slugify } from 'denali/helpers/slugify';
import { singularize } from 'ember-inflector';


export default Component.extend({

  api: computed('doc', 'slug', function() {
    return lookupApi([ this.get('doc.api'), this.get('slug') ]);
  }),

  kind: computed('slug', function() {
    return singularize(this.get('slug').split('/')[1]);
  }),

  kindComponentName: computed('kind', function() {
    let kind = this.get('kind');
    return `-ui/docs/api-body/${ kind }`;
  }),

  outline: computed('api', 'kind', function() {
    let api = this.get('api');
    let kind = this.get('kind');
    if (kind === 'function') {
      return null;
    }
    let outline = [];
    if (kind === 'class') {
      // Static properties
      if (!isEmpty(api.staticProperties)) {
        outline.push({ text: 'Static Properties' });
        forEach(api.staticProperties, (property, name) => {
          outline.push({
            slug: slugify([ name ]),
            text: name,
            level: 1
          });
        });
      }
      // Static methods
      if (!isEmpty(api.staticMethods)) {
        outline.push({ text: 'Static Methods' });
        forEach(api.staticMethods, (property, name) => {
          outline.push({
            slug: slugify([ name ]),
            text: `${ name }()`,
            level: 1
          });
        });
      }
    }
    // Instance properties
    if (!isEmpty(api.properties)) {
      outline.push({ text: 'Properties' });
      forEach(api.properties, (property, name) => {
        outline.push({
          slug: slugify([ name ]),
          text: name,
          level: 1
        });
      });
    }
    // Instance methods
    if (!isEmpty(api.methods)) {
      outline.push({ text: 'Methods' });
      forEach(api.methods, (property, name) => {
        outline.push({
          slug: slugify([ name ]),
          text: `${ name }()`,
          level: 1
        });
      });
    }
    return outline;
  })

});
