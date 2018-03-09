import Component from '@ember/component';
import { computed } from '@ember/object';
import { startCase, toPairs, dropRight, last } from 'lodash';

function findFolder(parentFolder, childFolderName) {
  return parentFolder.children.find((f) => f.title === startCase(childFolderName));
}

export default Component.extend({

  guides: computed('docs.pages', function() {
    let pages = toPairs(this.get('docs.pages'));
    let structuredPages = pages.reduce((result, [ guidePath, guideContents ]) => {
      let fullpath = guidePath.split('/');
      let basename = last(fullpath);
      let dirname = dropRight(fullpath);
      let parentFolder = result;
      let childFolderName;
      // eslint-disable-next-line no-cond-assign
      while (childFolderName = dirname.shift()) {
        if (!findFolder(parentFolder, childFolderName)) {
          parentFolder.children.push({
            title: startCase(childFolderName),
            slug: childFolderName,
            children: []
          });
        }
        parentFolder = findFolder(parentFolder, childFolderName);
      }
      parentFolder.children.push(Object.assign({ slug: basename, title: startCase(basename) }, guideContents));
      return result;
    }, { children: [] });
    return findFolder(structuredPages, 'Guides');
  })

});
