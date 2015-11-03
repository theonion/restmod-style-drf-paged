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

        // special snakecase to camelcase renaming
        Model: {
          decodeName: inflector.camelize,
          encodeName: function(_v) { return inflector.parameterize(_v, '_'); },
          encodeUrlName: inflector.parameterize
        }
      },

      $hooks: {
        'before-request': function (_req) {
          if (!_req.url.match(/\/$/)) {
            _req.url += '/';
          }
        },
        'before-fetch-many': function (_req) {
          // add paging parameter here based on collection's $page property
          if (_.isUndefined(_req.params)) {
            _req.params = {};
          }
          _req.params.page = this.$page || 1;
        },
        'after-request': function (_req) {
          // check that response has data we need
          if (!_.isUndefined(_req.data) && _.isUndefined(_req.data[manyRoot])) {
            // a dirty hack so we don't have to copy/modify the DefaultPacker:
            // this is not a collection, make it so the single root is accessible by the packer
            var newData = {};
            // check the type of data coming back to properly repack it
            if (_.isArray(_req.data)) {
              // dealing with an array, use many root
              newData[manyRoot] = _req.data;
            } else {
              // dealing with a single record, use single root
              newData[singleRoot] = _req.data;
            }
            _req.data = newData;
          }
        },
        'after-fetch-many': function (_req) {
          this.$totalCount = _req.data.count;
        }
      }
    });
  });
