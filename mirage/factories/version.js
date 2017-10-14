import { Factory, faker } from 'ember-cli-mirage';

const channels = [
  'canary',
  'beta',
  'stable',
  'lts'
];

const names = [
  'Switchback',
  'Blackburn',
  'Trailhead',
  'Approach',
  'Belay',
  'Moraine',
  'Timberline',
  'Tagia',
  'Northwood',
  'Foraker',
  'Silverthrone',
];

export default Factory.extend({
  id() { return this.semver; },
  semver: faker.system.semver,
  channel(i) {
    if (i < channels.length) {
      return channels.pop();
    }
  },
  publishedAt: faker.date.recent,
  name: faker.list.cycle(...names)
});
