import { JSONAPISerializer } from 'ember-cli-mirage';

export default JSONAPISerializer.extend({
  include: [ 'addon' ],
  serializeIds: 'always',
  links(version) {
    return {
      doc: {
          related: `/versions/${ version.id }/doc`
      }
    }
  }
});