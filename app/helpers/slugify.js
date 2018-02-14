import { helper } from '@ember/component/helper';

export function slugify([ string ]) {
  return string.replace(/[^A-z0-9]/g, '');
}

export default helper(slugify);