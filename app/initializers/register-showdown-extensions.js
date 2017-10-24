import showdown from 'showdown';

export function initialize(/* application */) {
  showdown.extension('create-sections-from-headers', function() {
    return [
      {
        type: 'output',
        filter: function (source) {
          let sectioned = source.replace(/(<h\d[^>]*>)/gi, function (match, header) {
            return `</section><section>${ header }`;
          });
          return `<section>${ sectioned }</section>`;
        }
      }
    ];
  });
  showdown.extension('peek-syntax', function() {
    return [
      {
        type: 'lang',
        regex: /\[([^\]]+)\]\(api:\/\/([^)]+)\)/g,
        replace: '<a href="/docs/stable/api/$2" data-api-id="$2" class="api-peek">$1</a>'
      }
    ];
  });
}

export default {
  initialize
};
