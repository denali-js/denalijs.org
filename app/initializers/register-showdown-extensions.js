/* global hljs */
import showdown from 'showdown';

export function initialize(/* application */) {

  showdown.extension('peek-syntax', function() {
    return [
      {
        type: 'lang',
        regex: /\[([^\]]+)\]\(api:\/\/([^)]+)\)/g,
        replace: '<a href="/docs/stable/api/$2" data-api-id="$2" class="api-peek">$1</a>'
      }
    ];
  });

  showdown.extension('highlight', function () {
    function htmlunencode(text) {
      return (
        text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
      );
    }
    const left = '<pre><code\\b[^>]*>'
    const right = '</code></pre>'
    const flags = 'g'
    function replacement(_wholeMatch, match, left, right) {
      // unescape match to prevent double escaping
      match = htmlunencode(match);
      return left + hljs.highlightAuto(match).value + right;
    }
    return [
      {
        type: 'output',
        filter: function (text) {
          return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags);
        }
      }
    ];
  });
}

export default {
  initialize
};
