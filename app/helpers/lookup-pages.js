import { helper } from '@ember/component/helper';
import { pickBy } from 'lodash';

export function lookupPages([ pages, slug ]) {
  if (!pages) {
    return null;
  }
  return pickBy(pages, (value, key) => {
    return key.indexOf(slug) === 0;
  });
}

export default helper(lookupPages);