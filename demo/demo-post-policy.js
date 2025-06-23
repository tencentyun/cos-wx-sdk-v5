var config = require('./config');

var uploadFile = function () {
  // 对更多字符编码的 url encode 格式
  var camSafeUrlEncode = function (str) {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  };

  // 获取临时密钥
  var getCredentials = function (options, callback) {
    wx.request({
      method: 'GET',
      url: 'http://127.0.0.1:3000/post-policy?ext=' + options.ext, // 服务端签名，参考 server 目录下的两个签名例子
      dataType: 'json',
      success: function (result) {
        var data = result.data;
        if (data) {
          callback(data);
        } else {
          wx.showModal({ title: '临时密钥获取失败', content: JSON.stringify(data), showCancel: false });
        }
      },
      error: function (err) {
        wx.showModal({ title: '临时密钥获取失败', content: JSON.stringify(err), showCancel: false });
      },
    });
  };

  // 上传文件
  var uploadFile = function (filePath) {
    var extIndex = filePath.lastIndexOf('.');
    var fileExt = extIndex >= -1 ? filePath.substr(extIndex + 1) : '';
    getCredentials({ ext: fileExt }, function (credentials) {
      // 请求用到的参数
      // var prefix = 'https://cos.' + config.Region + '.myqcloud.com/' + config.Bucket + '/'; // 这个是后缀式，签名也要指定 Pathname: '/' + config.Bucket + '/'
      var prefix = 'https://' + credentials.bucket + '.cos.' + credentials.region + '.myqcloud.com/';
      var key = credentials.key; // 让服务端来决定文件名更安全
      var formData = {
        key: key,
        success_action_status: 200,
        'Content-Type': '',
        'q-sign-algorithm': credentials.qSignAlgorithm,
        'q-ak': credentials.qAk,
        'q-key-time': credentials.qKeyTime,
        'q-signature': credentials.qSignature,
        policy: credentials.policy,
      };
      if (credentials.securityToken) formData['x-cos-security-token'] = credentials.securityToken;
      var requestTask = wx.uploadFile({
        url: prefix,
        name: 'file',
        filePath: filePath,
        formData: formData,
        success: function (res) {
          var url = prefix + camSafeUrlEncode(key).replace(/%2F/g, '/');
          if (res.statusCode === 200) {
            wx.showModal({ title: '上传成功', content: url, showCancel: false });
          } else {
            wx.showModal({ title: '上传失败', content: JSON.stringify(res), showCancel: false });
          }
          console.log(res.header['x-cos-request-id']);
          console.log(res.statusCode);
          console.log(url);
        },
        fail: function (res) {
          wx.showModal({ title: '上传失败', content: JSON.stringify(res), showCancel: false });
        },
      });
      requestTask.onProgressUpdate(function (res) {
        console.log('正在进度:', res);
      });
    });
  };

  // 选择文件
  wx.chooseMedia({
    count: 1, // 默认9
    mediaType: ['image', 'video'],
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: function (res) {
      uploadFile(res.tempFiles[0].tempFilePath);
    },
  });
};

module.exports = uploadFile;
