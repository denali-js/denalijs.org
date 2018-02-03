import Component from '@ember/component';
import { computed } from '@ember/object';
import { mapValues, sortBy } from 'lodash';

export default Component.extend({

  groupByPackage: computed({
    get() {
      let value = window.localStorage.getItem('denali.preferences.showApiNavGroupedByPackage');
      return value == null || value === 'true';
    },
    set(key, value) {
      window.localStorage.setItem('denali.preferences.showApiNavGroupedByPackage', value ? 'true' : 'false');
      return value;
    }
  }),

  byPackage: computed('api', function() {
    let { classes, functions, interfaces } = this.get('api').getProperties('classes', 'functions', 'interfaces');
    let pkgs = {};
    classes.forEach((klass) => {
      ensurePkg(klass.get('pkg'));
      pkgs[klass.get('pkg')].push(klass);
    });
    functions.forEach((klass) => {
      ensurePkg(klass.get('pkg'));
      pkgs[klass.get('pkg')].push(klass);
    });
    interfaces.forEach((klass) => {
      ensurePkg(klass.get('pkg'));
      pkgs[klass.get('pkg')].push(klass);
    });
    pkgs = mapValues(pkgs, (entries) => {
      return sortBy(entries, (e) => e.get('name').toLowerCase());
    });
    return pkgs;
    function ensurePkg(pkgName) {
      if (!pkgs[pkgName]) {
        pkgs[pkgName] = [];
      }
    }
  }),

  ungrouped: computed('api.{classes,functions,interfaces}', function() {
    let classes = this.get('api.classes');
    let functions = this.get('api.functions');
    let interfaces = this.get('api.interfaces');
    return sortBy(classes.concat(functions).concat(interfaces), (e) => e.get('name').toLowerCase());
  })

});
