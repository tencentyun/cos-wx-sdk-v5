var COS = require('./lib/cos-wx-sdk-v5');
var config = require('./config');
const Beacon = require('./lib/beacon_mp.min');
const ClsClient = require('./lib/cls.min');
const clsClient = new ClsClient({
  topicId: 'xxxxxx-xxxx-xxxx-xxxx-xxxxxx', // 日志主题 id
  region: 'ap-guangzhou', // 日志主题所在地域，比如 ap-guangzhou，需在小程序平台设置域名白名单：https://ap-guangzhou.cls.tencentcs.com
  maxRetainDuration: 30, // 默认 30s
  maxRetainSize: 20, // 默认20条
});

// 签名回调
var getAuthorization = function (options, callback) {
  // 格式一、（推荐）后端通过获取临时密钥给到前端，前端计算签名
  // 服务端 JS 和 PHP 例子：https://github.com/tencentyun/cos-js-sdk-v5/blob/master/server/
  // 服务端其他语言参考 COS STS SDK ：https://github.com/tencentyun/qcloud-cos-sts-sdk
  wx.request({
    method: 'GET',
    url: config.stsUrl, // 服务端签名，参考 server 目录下的两个签名例子
    dataType: 'json',
    success: function (result) {
      var data = result.data;
      var credentials = data && data.credentials;
      if (!data || !credentials) return console.error('credentials invalid');
      callback({
        TmpSecretId: credentials.tmpSecretId,
        TmpSecretKey: credentials.tmpSecretKey,
        SecurityToken: credentials.sessionToken,
        StartTime: data.startTime, // 时间戳，单位秒，如：1580000000，建议返回服务器时间作为签名的开始时间，避免用户浏览器本地时间偏差过大导致签名错误
        ExpiredTime: data.expiredTime, // 时间戳，单位秒，如：1580000900
      });
    },
  });

  // // 格式二、（推荐）【细粒度控制权限】后端通过获取临时密钥给到前端，前端只有相同请求才重复使用临时密钥，后端可以通过 Scope 细粒度控制权限
  // // 服务端例子：https://github.com/tencentyun/qcloud-cos-sts-sdk/edit/master/scope.md
  // wx.request({
  //     method: 'POST',
  //     url: 'http://127.0.0.1:3000/sts-scope',
  //     data: options.Scope,
  //     dataType: 'json',
  //     success: function(result) {
  //         var data = result.data;
  //         var credentials = data && data.credentials;
  //         if (!data || !credentials) return console.error('credentials invalid');
  //         callback({
  //             TmpSecretId: credentials.tmpSecretId,
  //             TmpSecretKey: credentials.tmpSecretKey,
  //             XCosSecurityToken: credentials.sessionToken,
  //             StartTime: data.startTime, // 时间戳，单位秒，如：1580000000，建议返回服务器时间作为签名的开始时间，避免用户浏览器本地时间偏差过大导致签名错误
  //             ExpiredTime: data.expiredTime, // 时间戳，单位秒，如：1580000900
  //             ScopeLimit: true, // 细粒度控制权限需要设为 true，会限制密钥只在相同请求时重复使用
  //         });
  //     }
  // });

  // // 格式三、（不推荐，分片上传权限不好控制）前端每次请求前都需要通过 getAuthorization 获取签名，后端使用固定密钥或临时密钥计算签名返回给前端
  // // 服务端获取签名，请参考对应语言的 COS SDK：https://cloud.tencent.com/document/product/436/6474
  // // 注意：这种有安全风险，后端需要通过 method、pathname 严格控制好权限，比如不允许 put / 等
  // wx.request({
  //     method: 'POST',
  //     url: 'https://example.com/sts-auth.php, // 服务端签名，参考 server 目录下的两个签名例子
  //     data: {
  //         method: options.Method,
  //         pathname: options.Pathname,
  //         query: options.Query,
  //         headers: options.Headers,
  //     },
  //     dataType: 'json',
  //     success: function(result) {
  //         var data = result.data;
  //         if (!data || !data.authorization) return console.error('authorization invalid');
  //         callback({
  //             Authorization: data.authorization,
  //             // XCosSecurityToken: data.sessionToken, // 如果使用临时密钥，需要传 sessionToken
  //         });
  //     }
  // });

  // // 格式四、（不推荐，适用于前端调试，避免泄露密钥）前端使用固定密钥计算签名
  // var authorization = COS.getAuthorization({
  //     SecretId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  //     SecretKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  //     Method: options.Method,
  //     Pathname: options.Pathname,
  //     Query: options.Query,
  //     Headers: options.Headers,
  //     Expires: 60,
  // });
  // callback({
  //     Authorization: authorization,
  //     // XCosSecurityToken: credentials.sessionToken, // 如果使用临时密钥，需要传 XCosSecurityToken
  // });
};

var cos = new COS({
  getAuthorization: getAuthorization,
  // 是否使用全球加速域名。开启该配置后仅以下接口支持操作：putObject、getObject、headObject、optionsObject、multipartInit、multipartListPart、multipartUpload、multipartAbort、multipartComplete、multipartList、sliceUploadFile、uploadFiles
  // UseAccelerate: true,
  // BeaconReporter: Beacon, // 开启灯塔上报
  // ClsReporter: clsClient, // 开启 cls 上报
});

// 回调统一处理函数
var requestCallback = function (err, data) {
  console.log(err || data);
  if (err && err.error) {
    wx.showModal({
      title: '返回错误',
      content: '请求失败：' + (err.error.Message || err.error) + '；状态码：' + err.statusCode,
      showCancel: false,
    });
  } else if (err) {
    wx.showModal({
      title: '请求出错',
      content: '请求出错：' + err + '；状态码：' + err.statusCode,
      showCancel: false,
    });
  } else {
    wx.showToast({
      title: '请求成功',
      icon: 'success',
      duration: 3000,
    });
  }
};

module.exports = {
  cos,
  requestCallback,
};