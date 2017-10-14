import fixtures from '../fixtures/denali';
import { forEach } from 'lodash';

export default function(server) {

  server.createList('addon', 20);
  
  forEach(fixtures.versions, (versionData, semver) => {
    let version = server.create('version', {
      id: semver,
      semver,
      name: versionData.name,
      channel: versionData.channel,
      publishedAt: versionData.publishedAt
    });
    
    forEach(versionData.pages.guides, (guideData) => {
      server.create('guide', {
        title: guideData.title,
        body: guideData.body,
        group: guideData.group,
        version
      });
    });
  })

}
