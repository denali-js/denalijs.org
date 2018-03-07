import { faker } from 'ember-cli-mirage';
export default [
  {
    id: 1,
    version: 'v0.1.x',
    displayName: 'v0.1.x',
    compiledAt: faker.date.recent,
    addonId: '@denali-js/core',
  },
  {
    id: 2,
    version: 'latest',
    displayName: 'master',
    compiledAt: faker.date.recent,
    addonId: '@denali-js/core',
    docsUrl: 'https://fileserver.example.com/docs/@denali-js:core/master'
  }
]