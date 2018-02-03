import LinkComponent from '@ember/routing/link-component';
import { inject as service } from '@ember/service';

export default LinkComponent.extend({

  router: service(),

  didReceiveAttrs() {
    this._super(...arguments);

    let models = [];

    let replacements = this.get('models');
    replacements.unshift(this.get('targetRouteName'));
    let replacementsBySegment = {};
    for(let i = 0; i < replacements.length; i += 2) {
      replacementsBySegment[replacements[i]] = replacements[i + 1];
    }

    this.set('targetRouteName', this.get('router.currentRouteName'));

    let handlerInfos = this.get('router._router.currentState.routerJsState.handlerInfos');
    handlerInfos.forEach((info) => {
      info.handler._names.forEach((segmentName) => {
        let segmentValue = replacementsBySegment[segmentName] || info.params[segmentName];
        models.push(segmentValue);        
      });
    });

    this.set('models', models);
  }

})