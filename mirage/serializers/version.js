import { JSONAPISerializer } from 'ember-cli-mirage';

export default JSONAPISerializer.extend({
  serializeIds: 'always',
  links(version) {
    return {
      doc: {
          related: `/versions/${ version.id }/doc`
      }
    }
  }
});