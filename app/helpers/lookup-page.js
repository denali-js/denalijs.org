import { helper } from '@ember/component/helper';

export function lookupPage([ pages, slug ]) {
  if (!pages) {
    return null;
  }
  return pages[slug];
}

export default helper(lookupPage);