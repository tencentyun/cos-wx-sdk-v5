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

var request = function (params, callback) {
    var filePath = params.filePath;
    var headers = params.headers || {};
    var url = params.url;
    var method = params.method;
    var onProgress = params.onProgress;
    var requestTask;

    var cb = function (err, response) {
        callback(err, {statusCode: response.statusCode, headers: response.header}, response.data);
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
        ];
        for (var i in params.headers) {
            if (params.headers.hasOwnProperty(i) && (i.indexOf('x-cos-meta-') > -1 || headerKeys.indexOf(i) > -1)) {
                formData[i] = params.headers[i];
            }
        }
        headers['x-cos-acl'] && (formData.acl = headers['x-cos-acl']);
        !formData['Content-Type'] && (formData['Content-Type'] = '');

        var responseHeader = {};
        requestTask = wx.uploadFile({
            url: url,
            method: method,
            name: 'file',
            filePath: filePath,
            formData: formData,
            success: function (response) {
                !response.header && (response.header = responseHeader);
                cb(null, response);
            },
            fail: function (response) {
                cb(response.errMsg, response);
            }
        });

        requestTask.onHeadersReceived && requestTask.onHeadersReceived(function(res){
            responseHeader = res.header;
        });

        requestTask.onProgressUpdate(function (res) {
            onProgress({
                loaded: res.totalBytesSent,
                total: res.totalBytesExpectedToSend,
                progress: res.progress / 100
            });
        });
    } else {
        var qsStr = params.qs && obj2str(params.qs) || '';
        if (qsStr) {
            url += (url.indexOf('?') > -1 ? '&' : '?') + qsStr;
        }
        headers['Content-Length'] && (delete headers['Content-Length']);
        wx.request({
            url: url,
            method: method,
            header: headers,
            dataType: 'text',
            data: params.body,
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