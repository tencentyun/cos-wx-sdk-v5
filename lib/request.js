var obj2str = function (obj) {
    var i, key, val;
    var list = [];
    var keyList = Object.keys(obj);
    for (i = 0; i < keyList.length; i++) {
        key = keyList[i];
        val = obj[key] || '';
        list.push(key + '=' + encodeURIComponent(val));
    }
    return list.join('&');
};

var stringifyPrimitive = function(v) {
  switch (typeof v) {
      case 'string':
          return v;
      case 'boolean':
          return v ? 'true' : 'false';
      case 'number':
          return isFinite(v) ? v : '';
      default:
          return '';
  }
};

var queryStringify = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
      obj = undefined;
  }
  if (typeof obj === 'object') {
      return Object.keys(obj).map(function(k) {
          var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
          if (Array.isArray(obj[k])) {
              return obj[k].map(function(v) {
                  return ks + encodeURIComponent(stringifyPrimitive(v));
              }).join(sep);
          } else {
              return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
          }
      }).filter(Boolean).join(sep);

  }
  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
      encodeURIComponent(stringifyPrimitive(obj));
};

var request = function (params, callback) {
    var filePath = params.filePath;
    var headers = params.headers || {};
    var url = params.url || params.Url;
    var method = params.method;
    var onProgress = params.onProgress;
    var requestTask;

    var cb = function (err, response) {
        var H = response.header
        var headers = {};
        if (H) for (var key in H) {
            if (H.hasOwnProperty(key)) headers[key.toLowerCase()] = H[key];
        }
        callback(err, {statusCode: response.statusCode, headers: headers}, response.data);
    };

    if (filePath) {
        var fileKey;
        var m = url.match(/^(https?:\/\/[^/]+\/)([^/]*\/?)(.*)$/);
        if (params.pathStyle) {
            fileKey = decodeURIComponent(m[3] || '');
            url = m[1] + m[2];
        } else {
            fileKey = decodeURIComponent(m[2] + m[3] || '');
            url = m[1];
        }

        // 整理 postObject 参数
        var formData = {
            'key': fileKey,
            'success_action_status': 200,
            'Signature': headers.Authorization,
        };
        var headerKeys = [
            'Cache-Control',
            'Content-Type',
            'Content-Disposition',
            'Content-Encoding',
            'Expires',
            'x-cos-storage-class',
            'x-cos-security-token',
            'x-ci-security-token',
        ];
        for (var i in params.headers) {
            if (params.headers.hasOwnProperty(i) && (i.indexOf('x-cos-meta-') > -1 || headerKeys.indexOf(i) > -1)) {
                formData[i] = params.headers[i];
            }
        }
        headers['x-cos-acl'] && (formData.acl = headers['x-cos-acl']);
        !formData['Content-Type'] && (formData['Content-Type'] = '');

        requestTask = wx.uploadFile({
            url: url,
            method: method,
            name: 'file',
            header: headers,
            filePath: filePath,
            formData: formData,
            timeout: params.timeout,
            success: function (response) {
                cb(null, response);
            },
            fail: function (response) {
                cb(response.errMsg, response);
            }
        });
        requestTask.onProgressUpdate(function (res) {
            onProgress && onProgress({
                loaded: res.totalBytesSent,
                total: res.totalBytesExpectedToSend,
                progress: res.progress / 100
            });
        });
    } else {
        var qsStr = params.qs && queryStringify(params.qs) || '';
        if (qsStr) {
            url += (url.indexOf('?') > -1 ? '&' : '?') + qsStr;
        }
        headers['Content-Length'] && (delete headers['Content-Length']);
        requestTask = wx.request({
            url: url,
            method: method,
            header: headers,
            dataType: 'text',
            data: params.body,
            timeout: params.timeout,
            success: function (response) {
                cb(null, response);
            },
            fail: function (response) {
                cb(response.errMsg, response);
            }
        });
    }

    return requestTask;
};

module.exports = request;
