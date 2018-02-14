import { helper } from '@ember/component/helper';

export function isObjectEmpty([ object ]) {
  return Object.keys(object).length === 0;
}

export default helper(isObjectEmpty);