//index.js
var demo = require('../../demo');

var option = {
    data: {
        list: []
    },
};

for (var key in demo) {
    if (demo.hasOwnProperty(key)) {
        option.data.list.push(key);
        option[key] = demo[key];
    }
}

option.simpleUpload = function () {
    // 请求用到的参数
    var Bucket = 'test-1250000000';
    var Region = 'ap-guangzhou';
    var prefix = 'https://' + Bucket + '.cos.' + Region + '.myqcloud.com/';

    // 计算签名
    var getAuthorization = function (options, callback) {
        wx.request({
            method: 'GET',
            url: 'https://example.com/auth.php', // 服务端签名，参考 server 目录下的两个签名例子
            data: {
                method: options.method.toLowerCase(),
                pathname: options.pathname
            },
            dataType: 'text',
            success: function (result) {
                callback(result.data);
            }
        });
    };

    // 上传文件
    var uploadFile = function (filePath) {
        var Key = filePath.substr(filePath.lastIndexOf('/') + 1);
        getAuthorization({method: 'post', pathname: '/'}, function (Authorization) {
            var requestTask = wx.uploadFile({
                url: prefix,
                name: 'file',
                filePath: filePath,
                formData: {
                    'key': Key,
                    'success_action_status': 200,
                    'Signature': Authorization
                },
                success: function (res) {
                    if (!res || res.data.indexOf('<Error>') > -1) {
                        console.log('上传失败', res);
                    } else {
                        console.log('上传成功', res);
                    }
                },
                fail: function (res) {
                    console.log('上传失败', res);
                }
            });
            requestTask.onProgressUpdate(function (res) {
                console.log('正在进度:', res);
            });
        });
    };

    // 选择文件
    wx.chooseImage({
        count: 1, // 默认9
        sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        success: function (res) {
            uploadFile(res.tempFilePaths[0]);
        }
    })
};

//获取应用实例
Page(option);
