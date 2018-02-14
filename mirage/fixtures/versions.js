import { faker } from 'ember-cli-mirage';
export default [
  {
    id: '@denali-js:core@v0.1.x',
    version: 'v0.1.x',
    displayName: 'v0.1.x',
    compiledAt: faker.date.recent,
    addonId: '@denali-js:core',
  },
  {
    id: '@denali-js:core@latest',
    version: 'v0.1.x',
    displayName: 'latest',
    compiledAt: faker.date.recent,
    addonId: '@denali-js:core',
  }
]