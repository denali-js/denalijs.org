import { helper } from '@ember/component/helper';

export function lookupApi([ api, slug ]) {
  if (!api) {
    return null;
  }
  let [ pkg, kind, id ] = slug.split('/');
  try {
    let allOfKind = api.packages[pkg][kind]
    if (Array.isArray(allOfKind)) {
      return allOfKind.find((item) => item.name === id)
    }
    return allOfKind[id];
  } catch (e) {
    return null;
  }
}

export default helper(lookupApi);