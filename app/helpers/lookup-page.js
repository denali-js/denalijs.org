import { helper } from '@ember/component/helper';

export function lookupPage([ pages, slug ]) {
  if (!pages) {
    return null;
  }
  let parts = slug.split('/');
  let pointer = pages;
  let part;
  while(part = parts.shift()) { //eslint-disable-line
    pointer = (pointer.children || []).find((child) => child.slug === part);
    if (!pointer) {
      throw new Error(`Unable to find ${ slug } page in ${ pages }`);
    }
  }
  return pointer;
}

export default helper(lookupPage);