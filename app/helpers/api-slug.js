import { helper } from '@ember/component/helper';
import { pluralize } from 'ember-inflector';

export function apiSlug([ packageName, kind, itemName ]) {
  return `${ packageName }/${ pluralize(kind) }/${ itemName }`;
}

export default helper(apiSlug);