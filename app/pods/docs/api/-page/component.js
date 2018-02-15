import { forEach, map, isEmpty } from 'lodash';
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

  isOverview: computed('slug', function() {
    return this.get('slug') === 'overview';
  }),

  apiNav: computed('doc.api', function() {
    let api = this.get('doc.api');
    return {
      children: map(api.packages, (pkg, packageName) => {
        return {
          title: packageName,
          slug: packageName,
          children: map(pkg.classes, (_, className) => {
            return {
              title: className,
              slug: `classes/${ className }`,
              kind: 'class'
            };
          }).concat(pkg.functions.map(({ name }) => {
            return {
              title: name,
              slug: `functions/${ name }`,
              kind: 'function'
            };
          })).concat(map(pkg.interfaces, (_, interfaceName) => {
            return {
              title: interfaceName,
              slug: `interfaces/${ interfaceName }`,
              kind: 'interface'
            };
          }))
        }
      })
    };
  }),

  outlineNav: computed('api', 'kind', function() {
    let api = this.get('api');
    let kind = this.get('kind');
    if (kind === 'function') {
      return null;
    }
    let outline = [];
    if (kind === 'class') {
      // Static properties
      if (!isEmpty(api.staticProperties)) {
        outline.push({
          title: 'Static Properties',
          children: map(api.staticProperties, (property, name) => {
            return {
              slug: slugify([ name ]),
              title: name,
              level: 1
            };
          })
        });
      }
      // Static methods
      if (!isEmpty(api.staticMethods)) {
        outline.push({
          title: 'Static Methods',
          children: map(api.staticMethods, (property, name) => {
            return {
              slug: slugify([ name ]),
              title: `${ name }()`,
              level: 1
            };
          })
        });
      }
    }
    // Instance properties
    if (!isEmpty(api.properties)) {
      outline.push({
        title: 'Properties',
        children: map(api.properties, (property, name) => {
          return {
            slug: slugify([ name ]),
            title: name,
            level: 1
          };
        })
      });
    }
    // Instance methods
    if (!isEmpty(api.methods)) {
      outline.push({
        title: 'Methods',
        children: map(api.methods, (property, name) => {
          return {
            slug: slugify([ name ]),
            title: `${ name }()`,
            level: 1
          };
        })
      });
    }
    return { children: outline };
  })

});
