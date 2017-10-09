import { Factory, faker } from 'ember-cli-mirage';

const names = [
  'babel',
  'try',
  'loader',
  'resolver',
  'eslint',
  'moment',
  'concurrency',
  'stateful',
  'deploy-opsworks',
  'graph-data',
  'test-selectors',
  'browserify',
  'typescript',
  'tslint',
  'pagination',
  'fetch',
  'state-services',
  'redirect',
  'versioned-api',
  'stripe',
  'protobuf',
  'retry',
  'throttle'
];
const namePicker = faker.list.cycle(...names);

export default Factory.extend({
  id() { return this.name; },
  name(i) {
    if (i > names.length - 1) {
      throw new Error("I don't have that many addon names to work with");
    }
    return `denali-${ namePicker(i) }`;
  },
  graphic() {
    if (Math.random() > 0.8) {
      return faker.image.imageUrl();
    }
    return null;
  },
  description: faker.lorem.paragraph,
  featured(i) {
    return i < 6;
  }
});
