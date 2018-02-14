import { helper } from '@ember/component/helper';

export function lookupApi([ api, slug ]) {
  if (!api) {
    return null;
  }
  let [ pkg, kind, id ] = slug.split('/');
  try {
    return api.packages[pkg][kind][id];
  } catch (e) {
    return null;
  }
}

export default helper(lookupApi);