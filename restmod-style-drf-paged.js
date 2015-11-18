'use strict';

angular.module('restmod.styles.drfPaged', [
  'restmod'
])
  .factory('DjangoDRFPagedApi', function (restmod, inflector) {
    var singleRoot = 'root';
    var manyRoot = 'results';

    return restmod.mixin('DefaultPacker', {
      $config: {
        style: 'DjangoDRFPagedApi',
        primaryKey: 'id',
        jsonMeta: '.',
        jsonLinks: '.',
        jsonRootMany: manyRoot,
        jsonRootSingle: singleRoot
      },

      $extend: {
        Collection: {
          $page: 1,
          $totalCount: 0
        },

        // convert backend snake_case to frontend camelCase
        Model: {
          decodeName: inflector.camelize,
          encodeName: function(_v) { return inflector.parameterize(_v, '_'); },
          encodeUrlName: inflector.parameterize
        }
      },

      $hooks: {
        /**
         * Ensure all request paths end with a slash.
         */
        'before-request': function (_req) {
          var urlParts = _req.url.split('?');
          var path = urlParts[0];
          var query = urlParts.length > 1 ? urlParts[1] : '';

          if (!path.match(/\/$/)) {
            _req.url = path + '/' + query;
          }
        },
        /**
         * Add a paging parameter before fetching a collection.
         */
        'before-fetch-many': function (_req) {
          if (_.isUndefined(_req.params)) {
            _req.params = {};
          }
          _req.params.page = this.$page || 1;
        },
        /**
         * Ensure that the data is located under the right key for restmod's
         *  DefaultPacker.
         */
        'after-request': function (_req) {
          if (!_.isUndefined(_req.data)) {
            if (_.isArray(_req.data)) {
              // raw data is an array, pack it under manyRoot
              var reqData = _req.data;
              _req.data = {};
              _req.data[manyRoot] = reqData;
            } else if (
                _.isUndefined(_req.data[manyRoot]) &&
                _.isUndefined(_req.data[singleRoot])) {
              // raw data wasn't pre-packed on the backend with a manyRoot key,
              //  raw data is a singular object, pack it under singleRoot
              var reqData = _req.data;
              _req.data = {};
              _req.data[singleRoot] = reqData;
            }
          }
        },
        /**
         * Add a total count property after fetching a collection.
         */
        'after-fetch-many': function (_req) {
          this.$totalCount = _req.data.count;
        }
      }
    });
  });
