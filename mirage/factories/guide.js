import { Factory } from 'ember-cli-mirage';
import { kebabCase } from 'lodash';

export default Factory.extend({
  id() { return this.version.id + ':' + this.slug; },
  title: null,
  body: null,
  group: null,
  slug() {
    let group = kebabCase(this.group.toLowerCase());
    let title = kebabCase(this.title.toLowerCase());
    return `${ group }/${ title }`;
  }
});
