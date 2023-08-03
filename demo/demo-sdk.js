var COS = require('./lib/cos-wx-sdk-v5');
var wxfs = wx.getFileSystemManager();
var config = require('./config');

var TaskId;

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
  // path style 指正式请求时，Bucket 是在 path 里，这样用相同园区多个 bucket 只需要配置一个园区域名
  // ForcePathStyle: true,
  getAuthorization: getAuthorization,
  // 是否使用全球加速域名。开启该配置后仅以下接口支持操作：putObject、getObject、headObject、optionsObject、multipartInit、multipartListPart、multipartUpload、multipartAbort、multipartComplete、multipartList、sliceUploadFile、uploadFiles
  // UseAccelerate: true,
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

var mylog = function (msg) {
  wx.showToast({
    title: msg,
    icon: 'success',
    duration: 3000,
  });
};

// 对云上数据进行图片处理
function request() {
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Key: 'photo.png',
      Method: 'POST',
      Action: 'image_process',
      Headers: {
        // 通过 imageMogr2 接口使用图片缩放功能：指定图片宽度为 200，宽度等比压缩
        'Pic-Operations':
          '{"is_pic_info": 1, "rules": [{"fileid": "desample_photo.jpg", "rule": "imageMogr2/thumbnail/200x/"}]}',
      },
    },
    (err, data) => {
      console.log(err || data);
    },
  );
}

function uploadFile() {
  var uploadFile = function (file) {
    cos.uploadFile(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: file.name,
        FilePath: file.path,
        FileSize: file.size,
        SliceSize: 1024 * 1024 * 5, // 文件大于5mb自动使用分块上传
        onTaskReady: function (taskId) {
          TaskId = taskId;
        },
        onProgress: function (info) {
          var percent = parseInt(info.percent * 10000) / 100;
          var speed = parseInt((info.speed / 1024 / 1024) * 100) / 100;
          console.log('进度：' + percent + '%; 速度：' + speed + 'Mb/s;');
        },
        onFileFinish: function (err, data, options) {
          console.log(options.Key + '上传' + (err ? '失败' : '完成'));
        },
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  };
  wx.chooseMessageFile({
    count: 10,
    type: 'all',
    success: function (res) {
      uploadFile(res.tempFiles[0]);
    },
  });
}

function uploadFiles() {
  var uploadFiles = function (files) {
    const fileList = files.map(function (file) {
      return Object.assign(file, {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: file.name,
        FilePath: file.path,
      });
    });
    cos.uploadFiles(
      {
        files: fileList,
        SliceSize: 1024 * 1024 * 5, // 文件大于5mb自动使用分块上传
        onProgress: function (info) {
          var percent = parseInt(info.percent * 10000) / 100;
          var speed = parseInt((info.speed / 1024 / 1024) * 100) / 100;
          console.log('进度：' + percent + '%; 速度：' + speed + 'Mb/s;');
        },
        onFileFinish: function (err, data, options) {
          console.log(options.Key + '上传' + (err ? '失败' : '完成'));
        },
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  };
  wx.chooseMessageFile({
    count: 10,
    type: 'all',
    success: function (res) {
      uploadFiles(res.tempFiles);
    },
  });
}

function sliceUploadFile() {
  var sliceUploadFile = function (file) {
    var key = file.name;
    cos.sliceUploadFile(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: key,
        FilePath: file.path,
        FileSize: file.size,
        CacheControl: 'max-age=7200',
        Headers: {
          aa: 123,
        },
        Query: {
          bb: 123,
        },
        onTaskReady: function (taskId) {
          TaskId = taskId;
        },
        onHashProgress: function (info) {
          console.log('check hash', JSON.stringify(info));
        },
        onProgress: function (info) {
          console.log(JSON.stringify(info));
        },
      },
      requestCallback,
    );
  };
  wx.chooseMessageFile({
    count: 10,
    type: 'all',
    success: function (res) {
      sliceUploadFile(res.tempFiles[0]);
    },
  });
  // wx.chooseVideo({
  //     sourceType: ['album','camera'],
  //     maxDuration: 60,
  //     camera: 'back',
  //     success(res) {
  //         var name = res.tempFilePath.replace(/^.*?([^/]{32}\.\w+)$/, '$1');
  //         sliceUploadFile({
  //             name: name,
  //             path: res.tempFilePath,
  //             size: res.size,
  //         });
  //     },
  //     fail(err) {
  //         console.log(err);
  //     }
  // })
}

function postObject() {
  wx.chooseImage({
    count: 1, // 默认9
    sizeType: ['original'], // 可以指定是原图还是压缩图，默认二者都有
    sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
    success: function (res) {
      var file = res.tempFiles[0];
      cos.postObject(
        {
          Bucket: config.Bucket,
          Region: config.Region,
          Key: '1.png',
          FilePath: file.path,
          onTaskReady: function (taskId) {
            TaskId = taskId;
          },
          onProgress: function (info) {
            console.log(JSON.stringify(info));
          },
        },
        requestCallback,
      );
    },
  });
}

function putObject() {
  wx.chooseMessageFile({
    count: 10,
    type: 'all',
    success: function (res) {
      var file = res.tempFiles[0];
      wxfs.readFile({
        filePath: file.path,
        success: function (res) {
          cos.putObject(
            {
              Bucket: config.Bucket,
              Region: config.Region,
              Key: file.name,
              Body: res.data, // 在小程序里，putObject 接口只允许传字符串的内容，不支持 TaskReady 和 onProgress，上传请使用 cos.postObject 接口
              Headers: {
                // 万象持久化接口，上传时持久化。例子：通过 imageMogr2 接口使用图片缩放功能：指定图片宽度为 200，宽度等比压缩
                // 'Pic-Operations': '{"is_pic_info": 1, "rules": [{"fileid": "desample_photo.jpg", "rule": "imageMogr2/thumbnail/200x/"}]}'
              },
            },
            requestCallback,
          );
        },
        fail: (err) => console.error(err),
      });
    },
    fail: (err) => console.error(err),
  });
}

function putObjectStr() {
  cos.putObject(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Key: '1.txt',
      Body: 'hello world', // 在小程序里，putObject 接口只允许传字符串的内容，不支持 TaskReady 和 onProgress，上传请使用 cos.postObject 接口
      Headers: {
        aa: 123,
      },
      Query: {
        bb: 123,
      },
    },
    requestCallback,
  );
}

function putObjectBase64() {
  var base64Url =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABRFBMVEUAAAAAo/8Ao/8Ao/8Ao/8ApP8Aov8Ao/8Abv8Abv8AyNwAyNwAo/8Ao/8Ao/8Abv8Ao/8AivgAo/8AyNwAbv8Abv8AydwApf8Abf8Ao/8AbP8Ao/8AyNwAydwAbv8AydwApP8Ao/8AyNwAo/8AyNwAydsAyNwAxd8Aov8AyNwAytsAo/8Abv8AyNwAbv8Av+MAo/8AytsAo/8Abv8AyNwAo/8Abv8AqfkAbv8Aov8Abv8AyNwAov8Abv8Ao/8Abv8Ao/8AydwAo/8Ao/8Ate8Ay9oAvOcAof8AveAAyNwAyNwAo/8AyNwAy9kAo/8AyNwAyNwAo/8AqP8Aaf8AyNwAbv0Abv8Abv8AaP8Ao/8Ao/8Ao/8Ao/8Abv8AyNwAgvcAaP8A0dkAo/8AyNwAav8Abv8Ao/8Abv8AyNwAy9sAvOUAtePdkYxjAAAAZnRSTlMAw/co8uAuJAn8+/Tt29R8DAX77+nZz87Jv6CTh3lxTklAPjouJRsL5tjAuLiyr62roaCakYp0XVtOQTMyLiohICAcGRP49vTv5+PJurawq6mnnJuYl4+OiIB7eXVvX15QSDgqHxNcw3l6AAABe0lEQVQ4y82P11oCQQxGIy5FUJpKk6aAhV6k92LvvXedDfj+92ZkYQHxnnMxu3/OfJMEJo6y++baXf5XVw22GVGcsRmq431mQZRYyIzRGgdXi+HwIv86NDBKisrRAtU1hSj9pkZ9jpo/9YKbRsmNNKCHDXI00BxfMMirKNpMcjQ5Lm4/YZArUXyBYUwg40nsdr5jb3LBe25VWpNeKa1GENsEnq52C80z1uW48estiKjb19G54QdCrScnKAU69U3KJ4jzrsBawDWPuOcBqMyRvlcb1Y+zjMUBVsivAKe4gXgEKiVjSh9wlunGMmwiOqFL3RI0cj+nkgp3jC1BELVFkGiZSuvkp3tZZWZ2sKCuDj185PXqfmwI7AAOUctHkJoOeXg3sxA4ES+l7CVvrYHMEmNp8GtR+wycPG0+1RrwWQUzl4CvgQmPP5Ddofl8tWkJVT7J+BIAaxEktrYZoRAUfXgOGYHfcOqw3WF/EdLccz5cMfvUCPb4QwUmhB8+v12HZPCkbgAAAABJRU5ErkJggg==';
  var m = /data:image\/(\w+);base64,(.*)/.exec(base64Url) || [];
  var format = m[1];
  var bodyData = m[2];
  var fileBuf = wx.base64ToArrayBuffer(bodyData);
  cos.putObject(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Key: '1.' + format,
      Body: fileBuf,
    },
    requestCallback,
  );
}

function getObjectUrl() {
  var url = cos.getObjectUrl(
    {
      Bucket: config.Bucket, // Bucket 格式：test-1250000000
      Region: config.Region,
      Key: '1mb.zip',
      Expires: 60,
      Sign: true,
    },
    function (err, data) {
      console.log(err || data);
    },
  );
  console.log(url);
}

var toolsDao = {
  request: request,
  'uploadFile 高级上传': uploadFile,
  'uploadFiles 批量上传': uploadFiles,
  'sliceUploadFile 分片上传': sliceUploadFile,
  // 上传文件适用于单请求上传大文件
  'postObject 简单上传': postObject,
  'putObject 简单上传文件': putObject,
  'putObject 上传字符串': putObjectStr,
  // 上传文件
  'putObject base64 转 ArrayBuffer 上传': putObjectBase64,
  'getObjectUrl 获取对象访问url': getObjectUrl,
};

var bucketDao = {
  // Service
  'getService 获取存储桶列表': function () {
    cos.getService(requestCallback);
  },
  // 简单 Bucket 操作
  'putBucket 创建存储桶': function () {
    cos.putBucket(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  'headBucket 检索存储桶及其权限': function () {
    cos.headBucket(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  'deleteBucket 删除存储桶': function () {
    cos.deleteBucket(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  'getBucketACL 查询存储桶 ACL': function () {
    cos.getBucketAcl(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  'putBucketACL 设置存储桶 ACL': function () {
    cos.putBucketAcl(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        ACL: 'public-read',
      },
      requestCallback,
    );
  },
  'getBucketCors 查询跨域配置': function () {
    cos.getBucketCors(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  'putBucketCors 设置跨域配置': function () {
    cos.putBucketCors(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        ResponseVary: 'true',
        CORSRules: [
          {
            AllowedOrigin: ['*'],
            AllowedMethod: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
            AllowedHeader: ['*'],
            ExposeHeader: ['ETag', 'Content-Length'],
            MaxAgeSeconds: '5',
          },
        ],
      },
      requestCallback,
    );
  },
  'deleteBucketCors 删除跨域配置': function () {
    cos.deleteBucketCors(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  'putBucketPolicy 设置存储桶策略': function () {
    var AppId = config.Bucket.substr(config.Bucket.lastIndexOf('-') + 1);
    cos.putBucketPolicy(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Policy: {
          version: '2.0',
          principal: {
            qcs: ['qcs::cam::uin/10001:uin/10001'],
          }, // 这里的 10001 是 QQ 号
          statement: [
            {
              effect: 'allow',
              action: [
                'name/cos:GetBucket',
                'name/cos:PutObject',
                'name/cos:PostObject',
                'name/cos:PutObjectCopy',
                'name/cos:InitiateMultipartUpload',
                'name/cos:UploadPart',
                'name/cos:UploadPartCopy',
                'name/cos:CompleteMultipartUpload',
                'name/cos:AbortMultipartUpload',
                'name/cos:AppendObject',
              ],
              // "resource": ["qcs::cos:ap-guangzhou:uid/1250000000:test-1250000000/*"] // 1250000000 是 appid
              resource: ['qcs::cos:' + config.Region + ':uid/' + AppId + ':' + config.Bucket + '/*'], // 1250000000 是 appid
            },
          ],
        },
      },
      requestCallback,
    );
  },
  'getBucketPolicy 查询存储桶策略': function () {
    cos.getBucketPolicy(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  'deleteBucketPolicy 删除存储桶策略': function () {
    cos.deleteBucketPolicy(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  'getBucketLocation 获取Bucket的地域信息': function () {
    cos.getBucketLocation(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  'getBucketTagging 获取Bucket标签': function () {
    cos.getBucketTagging(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  'putBucketTagging 设置Bucket标签': function () {
    cos.putBucketTagging(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Tagging: {
          Tags: [
            {
              Key: 'k1',
              Value: 'v1',
            },
            {
              Key: 'k2',
              Value: 'v2',
            },
          ],
        },
      },
      requestCallback,
    );
  },
  'deleteBucketTagging 删除存储桶标签': function () {
    cos.deleteBucketTagging(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
};

var objectDao = {
  'getBucket 获取对象列表': function () {
    cos.getBucket(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback,
    );
  },
  // 上传文件适用于单请求上传大文件
  'postObject 表单上传对象': postObject,
  'putObject 简单上传文件': putObject,
  'putObject 上传字符串': putObjectStr,
  // 上传文件
  'putObject base64 转 ArrayBuffer 上传': putObjectBase64,
  'getObject 下载对象': function () {
    cos.getObject({
      Bucket: config.Bucket,
      Region: config.Region,
      Key: '1.png',
      function(err, data) {
        console.log('getObject:', err || data);
      },
    });
  },
  'abortUploadTask 抛弃分块上传任务': function () {
    cos.abortUploadTask(
      {
        Bucket: config.Bucket,
        /* 必须 */ // Bucket 格式：test-1250000000
        Region: config.Region,
        /* 必须 */
        // 格式1，删除单个上传任务
        // Level: 'task',
        // Key: '10mb.zip',
        // UploadId: '14985543913e4e2642e31db217b9a1a3d9b3cd6cf62abfda23372c8d36ffa38585492681e3',
        // 格式2，删除单个文件所有未完成上传任务
        Level: 'file',
        Key: '10mb.zip',
        // 格式3，删除 Bucket 下所有未完成上传任务
        // Level: 'bucket',
      },
      requestCallback,
    );
  },
};

var advanceObjectDao = {
  'sliceUploadFile 分块上传': function () {
    var sliceUploadFile = function (file) {
      var key = file.name;
      cos.sliceUploadFile(
        {
          Bucket: config.Bucket,
          Region: config.Region,
          Key: key,
          FilePath: file.path,
          FileSize: file.size,
          CacheControl: 'max-age=7200',
          Headers: {
            aa: 123,
          },
          Query: {
            bb: 123,
          },
          onTaskReady: function (taskId) {
            TaskId = taskId;
          },
          onHashProgress: function (info) {
            console.log('check hash', JSON.stringify(info));
          },
          onProgress: function (info) {
            console.log(JSON.stringify(info));
          },
        },
        requestCallback,
      );
    };
    wx.chooseMessageFile({
      count: 10,
      type: 'all',
      success: function (res) {
        sliceUploadFile(res.tempFiles[0]);
      },
    });
    // wx.chooseVideo({
    //     sourceType: ['album','camera'],
    //     maxDuration: 60,
    //     camera: 'back',
    //     success(res) {
    //         var name = res.tempFilePath.replace(/^.*?([^/]{32}\.\w+)$/, '$1');
    //         sliceUploadFile({
    //             name: name,
    //             path: res.tempFilePath,
    //             size: res.size,
    //         });
    //     },
    //     fail(err) {
    //         console.log(err);
    //     }
    // })
  },
  'sliceCopyFile 分块复制对象': function () {
    // 创建测试文件
    var sourceName = '1.txt';
    var Key = '1.slicecopy.exe';

    var sourcePath = config.Bucket + '.cos.' + config.Region + '.myqcloud.com/' + sourceName;

    cos.sliceCopyFile(
      {
        Bucket: config.Bucket, // Bucket 格式：test-1250000000
        Region: config.Region,
        Key: Key,
        CopySource: sourcePath,
        SliceSize: 20 * 1024 * 1024, // 大于20M的文件用分片复制，小于则用单片复制
        onProgress: function (info) {
          var percent = parseInt(info.percent * 10000) / 100;
          var speed = parseInt((info.speed / 1024 / 1024) * 100) / 100;
          console.log('进度：' + percent + '%; 速度：' + speed + 'Mb/s;');
        },
      },
      requestCallback,
    );
  },
  cancelTask: function () {
    cos.cancelTask(TaskId);
    console.log('canceled');
  },
  pauseTask: function () {
    cos.pauseTask(TaskId);
    console.log('paused');
  },
  restartTask: function () {
    cos.restartTask(TaskId);
    console.log('restart');
  },
};

var ciObjectDao = {
  'uploadImg 上传时使用图片处理': function () {
    wx.chooseMessageFile({
      count: 10,
      type: 'all',
      success: function (res) {
        var file = res.tempFiles[0];
        wxfs.readFile({
          filePath: file.path,
          success: function (res) {
            cos.putObject(
              {
                Bucket: config.Bucket, // Bucket 格式：test-1250000000
                Region: config.Region,
                Key: file.name,
                Body: res.data,
                Headers: {
                  // 通过 imageMogr2 接口使用图片缩放功能：指定图片宽度为 200，宽度等比压缩
                  'Pic-Operations':
                    '{"is_pic_info": 1, "rules": [{"fileid": "desample_photo.jpg", "rule": "imageMogr2/thumbnail/200x/"}]}',
                },
              },
              requestCallback,
            );
          },
          fail: (err) => console.error(err),
        });
      },
      fail: (err) => console.error(err),
    });
  },
  'requestImg 对云上数据进行图片处理': function () {
    // 对云上数据进行图片处理
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: 'photo.png',
        Method: 'POST',
        Action: 'image_process',
        Headers: {
          // 通过 imageMogr2 接口使用图片缩放功能：指定图片宽度为 200，宽度等比压缩
          'Pic-Operations':
            '{"is_pic_info": 1, "rules": [{"fileid": "desample_photo.jpg", "rule": "imageMogr2/thumbnail/200x/"}]}',
        },
      },
      requestCallback,
    );
  },
  'getImg 下载时使用图片处理': function () {
    cos.getObject(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: '1.png',
        QueryString: `imageMogr2/thumbnail/200x/`,
      },
      requestCallback,
    );
  },
  '生成带图片处理参数的签名 URL': function () {
    // 生成带图片处理参数的文件签名URL，过期时间设置为 30 分钟。
    cos.getObjectUrl(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: 'photo.png',
        QueryString: `imageMogr2/thumbnail/200x/`,
        Expires: 1800,
        Sign: true,
      },
      (err, data) => {
        console.log('带签名', err || data);
      },
    );

    // 生成带图片处理参数的文件URL，不带签名。
    cos.getObjectUrl(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: 'photo.png',
        QueryString: `imageMogr2/thumbnail/200x/`,
        Sign: false,
      },
      (err, data) => {
        console.log('不带签名', err || data);
      },
    );
  },
  'describeMediaBuckets 查询已经开通数据万象功能的存储桶': function () {
    var host = 'ci.' + config.Region + '.myqcloud.com';
    var url = 'https://' + host + '/mediabucket';
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'GET',
        Key: 'mediabucket' /** 固定值，必须 */,
        Url: url,
        Query: {
          pageNumber: '1' /** 第几页，非必须 */,
          pageSize: '10' /** 每页个数，非必须 */,
          // regions: 'ap-chengdu', /** 地域信息，例如'ap-beijing'，支持多个值用逗号分隔如'ap-shanghai,ap-beijing'，非必须 */
          // bucketNames: 'test-1250000000', /** 存储桶名称，精确搜索，例如'test-1250000000'，支持多个值用逗号分隔如'test1-1250000000,test2-1250000000'，非必须 */
          // bucketName: 'test', /** 存储桶名称前缀，前缀搜索，例如'test'，支持多个值用逗号分隔如'test1,test2'，非必须 */
        },
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  'getMediaInfo 获取媒体文件信息': function () {
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'GET',
        Key: 'test.mp4',
        Query: {
          'ci-process': 'videoinfo' /** 固定值，必须 */,
        },
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  'getSnapshot 获取媒体文件某个时间的截图': function () {
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'GET',
        Key: 'test.mp4',
        Query: {
          'ci-process': 'snapshot' /** 固定值，必须 */,
          time: 1 /** 截图的时间点，单位为秒，必须 */,
          // width: 0, /** 截图的宽，非必须 */
          // height: 0, /** 截图的高，非必须 */
          // format: 'jpg', /** 截图的格式，支持 jpg 和 png，默认 jpg，非必须 */
          // rotate: 'auto', /** 图片旋转方式，默认为'auto'，非必须 */
          // mode: 'exactframe', /** 截帧方式，默认为'exactframe'，非必须 */
        },
        RawBody: true,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '图片同步审核 getImageAuditing': function () {
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'GET',
        Key: '1.png',
        Query: {
          'ci-process': 'sensitive-content-recognition' /** 固定值，必须 */,
          'biz-type': '' /** 审核类型，非必须 */,
          'detect-url': '' /** 审核任意公网可访问的图片链接，非必须，与Key二选一传递 */,
          interval: 5 /** 审核 GIF 动图时，每隔interval帧截取一帧，非必须 */,
          'max-frames': 5 /** 审核 GIF 动图时，最大截帧数，非必须 */,
          'large-image-detect': '0' /** 是否需要压缩图片后再审核，非必须 */,
        },
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '图片批量审核 postImagesAuditing': function () {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
    var url = 'https://' + host + '/image/auditing';
    var body = COS.util.json2xml({
      Request: {
        Input: [
          {
            Object: '1.png',
          },
          {
            Object: '6.png',
          },
        ],
        Conf: {
          BizType: '',
        },
      },
    });
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'POST',
        Url: url,
        Key: '/image/auditing',
        ContentType: 'application/xml',
        Body: body,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '查询图片审核任务结果 getImageAuditingResult': function () {
    var jobId = 'si8263213daf3711eca0d1525400d88xxx'; // jobId可以通过图片批量审核返回
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
    var url = 'https://' + host + '/image/auditing/' + jobId;
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'GET',
        Key: '/image/auditing/' + jobId,
        Url: url,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '提交视频审核任务 postVideoAuditing': function () {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
    var url = 'https://' + host + '/video/auditing';
    var body = COS.util.json2xml({
      Request: {
        Input: {
          Object: '1.mp4',
        },
        Conf: {
          BizType: '',
          Snapshot: {
            Count: 1000, // 视频截帧数量
          },
          DetectContent: 1, // 是否审核视频声音,0-只审核视频不审核声音；1-审核视频+声音
        },
      },
    });
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'POST',
        Url: url,
        Key: '/video/auditing',
        ContentType: 'application/xml',
        Body: body,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '查询视频审核任务结果 getVideoAuditingResult': function () {
    var jobId = 'av5bd873d9f39011ecb6c95254009a49da'; // jobId可以通过提交视频审核任务返回
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
    var url = 'https://' + host + '/video/auditing/' + jobId;
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'GET',
        Key: '/video/auditing/' + jobId,
        Url: url,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '提交音频审核任务 postAudioAuditing': function () {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
    var url = 'https://' + host + '/audio/auditing';
    var body = COS.util.json2xml({
      Request: {
        Input: {
          Object: '1.mp3',
        },
        Conf: {
          BizType: '',
        },
      },
    });
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'POST',
        Url: url,
        Key: '/audio/auditing',
        ContentType: 'application/xml',
        Body: body,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '查询音频审核任务结果 getAudioAuditingResult': function () {
    var jobId = 'sa0c28d41daff411ecb23352540078cxxx'; // jobId可以通过提交音频审核任务返回
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
    var url = 'https://' + host + '/audio/auditing/' + jobId;
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'GET',
        Key: '/audio/auditing/' + jobId,
        Url: url,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '提交文本审核任务 postTextAuditing': function () {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
    var url = 'https://' + host + '/text/auditing';
    var body = COS.util.json2xml({
      Request: {
        Input: {
          Content: COS.util.encodeBase64('hello') /* 需要审核的文本内容 */,
        },
        Conf: {
          BizType: '',
        },
      },
    });
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'POST',
        Url: url,
        Key: '/text/auditing' /** 固定值，必须 */,
        ContentType: 'application/xml' /** 固定值，必须 */,
        Body: body,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '提交直播审核任务 postLiveAuditing'() {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
    var url = 'https://' + host + '/video/auditing';
    var body = COS.util.json2xml({
      Request: {
        Type: 'live_video',
        Input: {
          Url: 'rtmp://example.com/live/123', // 需要审核的直播流播放地址
          // DataId: '',
          // UserInfo: {},
        },
        Conf: {
          BizType: '',
          // Callback: 'https://callback.com', // 回调地址，非必须
          // CallbackType: 1, // 回调片段类型，非必须
        },
      },
    });
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'POST',
        Url: url,
        Key: '/video/auditing',
        ContentType: 'application/xml',
        Body: body,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '查询直播审核任务结果 getLiveAuditingResult'() {
    var jobId = 'av2b14a74dbd9011edb05a52540084c0xx'; // jobId可以通过提交直播审核任务返回
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
    var url = 'https://' + host + '/video/auditing/' + jobId;
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Method: 'GET',
        Key: '/video/auditing/' + jobId,
        Url: url,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '提交病毒检测任务 postVirusDetect'() {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/virus/detect';
    var url = 'https://' + host;
    var body = COS.util.json2xml({
      Request: {
        Input: {
          Object: 'test/1.png', // 文件名，取值为文件在当前存储桶中的完整名称，与Url参数二选一
          // Url: 'http://examplebucket-1250000000.cos.ap-shanghai.myqcloud.com/virus.doc', // 病毒文件的链接地址，与Object参数二选一
        },
        Conf: {
          DetectType: 'Virus', // 检测的病毒类型，当前固定为：Virus
          // CallBack: 'http://callback.demo.com', // 任务回调的地址
        },
      },
    });
    cos.request(
      {
        Method: 'POST',
        Key: 'virus/detect',
        Url: url,
        Body: body,
        ContentType: 'application/xml',
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '查询病毒检测任务结果 getVirusDetectResult'() {
    var jobId = 'ss5a8d3065bd9011eda1445254009dadxx'; // 提交病毒检测任务后会返回当前任务的jobId
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/virus/detect/' + jobId;
    var url = 'https://' + host;
    cos.request(
      {
        Method: 'GET',
        Key: 'virus/detect/' + jobId,
        Url: url,
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '提交音频降噪任务 postNoiseReduction'() {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/jobs';
    var url = 'https://' + host;
    var body = COS.util.json2xml({
      Request: {
        Tag: 'NoiseReduction',
        Input: {
          Object: 'ci/music.mp3', // 文件名，取值为文件在当前存储桶中的完整名称
        },
        Operation: {
          Output: {
            Bucket: config.Bucket, // 输出的存储桶
            Region: config.Region, // 输出的存储桶的地域
            Object: 'ci/out.mp3', // 输出的文件Key
          },
        },
        // QueueId: '', // 任务所在的队列 ID，非必须
        // CallBackFormat: '', // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式，非必须
        // CallBackType: '', // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型，非必须
        // CallBack: '', // 任务回调地址，优先级高于队列的回调地址。设置为 no 时，表示队列的回调地址不产生回调，非必须
        // CallBackMqConfig: '', // 任务回调 TDMQ 配置，当 CallBackType 为 TDMQ 时必填，非必须
      },
    });
    cos.request(
      {
        Method: 'POST',
        Key: 'jobs',
        Url: url,
        Body: body,
        ContentType: 'application/xml',
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '提交人声分离任务 postVoiceSeparate'() {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/jobs';
    var url = 'https://' + host;
    var body = COS.util.json2xml({
      Request: {
        Tag: 'VoiceSeparate',
        Input: {
          Object: 'ci/music.mp3', // 文件名，取值为文件在当前存储桶中的完整名称
        },
        Operation: {
          // VoiceSeparate: {}, // 指定转码模板参数，非必须
          TemplateId: 't13fca82ad97e84878a22cd81bd2e5652c', // 指定的模板 ID，必须
          // JobLevel: 0, // 任务优先级，级别限制：0 、1 、2。级别越大任务优先级越高，默认为0，非必须
          Output: {
            Bucket: config.Bucket, // 输出的存储桶
            Region: config.Region, // 输出的存储桶的地域
            Object: 'ci/out/background.mp3', // 输出的文件Key,背景音结果文件名，不能与 AuObject 同时为空
            AuObject: 'ci/out/audio.mp3',
          },
        },
        // QueueId: '', // 任务所在的队列 ID，非必须
        // CallBackFormat: '', // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式，非必须
        // CallBackType: '', // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型，非必须
        // CallBack: '', // 任务回调地址，优先级高于队列的回调地址。设置为 no 时，表示队列的回调地址不产生回调，非必须
        // CallBackMqConfig: '', // 任务回调 TDMQ 配置，当 CallBackType 为 TDMQ 时必填，非必须
      },
    });
    cos.request(
      {
        Method: 'POST',
        Key: 'jobs',
        Url: url,
        Body: body,
        ContentType: 'application/xml',
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '提交语音合成任务 postTts'() {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/jobs';
    var url = 'https://' + host;
    var body = COS.util.json2xml({
      Request: {
        Tag: 'Tts',
        Operation: {
          // VoiceSeparate: {}, // 指定转码模板参数，非必须
          TemplateId: 't192931b3564084168a3f50ebfea59acb3', // 指定的模板 ID，必须
          // JobLevel: 0, // 任务优先级，级别限制：0 、1 、2。级别越大任务优先级越高，默认为0，非必须
          TtsConfig: {
            InputType: 'Text',
            Input: '床前明月光，疑是地上霜',
          },
          Output: {
            Bucket: config.Bucket, // 输出的存储桶
            Region: config.Region, // 输出的存储桶的地域
            Object: 'ci/out/tts.mp3', // 输出的文件Key
          },
        },
        // QueueId: '', // 任务所在的队列 ID，非必须
        // CallBackFormat: '', // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式，非必须
        // CallBackType: '', // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型，非必须
        // CallBack: '', // 任务回调地址，优先级高于队列的回调地址。设置为 no 时，表示队列的回调地址不产生回调，非必须
        // CallBackMqConfig: '', // 任务回调 TDMQ 配置，当 CallBackType 为 TDMQ 时必填，非必须
      },
    });
    cos.request(
      {
        Method: 'POST',
        Key: 'jobs',
        Url: url,
        Body: body,
        ContentType: 'application/xml',
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '提交语音识别任务 postSpeechRecognition'() {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/asr_jobs';
    var url = 'https://' + host;
    var body = COS.util.json2xml({
      Request: {
        Tag: 'SpeechRecognition',
        Input: {
          Object: 'ci/music.mp3', // 文件名，取值为文件在当前存储桶中的完整名称，与Url参数二选一
          // Url: 'http://examplebucket-1250000000.cos.ap-shanghai.myqcloud.com/music.mp3', // 病毒文件的链接地址，与Object参数二选一
        },
        Operation: {
          SpeechRecognition: {
            EngineModelType: '16k_zh_video', // 引擎模型类型
            ChannelNum: 1, // 语音声道数
            ResTextFormat: 0, // 识别结果返回形式
            FilterDirty: 1, // 是否过滤脏词（目前支持中文普通话引擎）
            FilterModal: 1, // 是否过语气词（目前支持中文普通话引擎）
            ConvertNumMode: 0, // 是否进行阿拉伯数字智能转换（目前支持中文普通话引擎）
          },
          Output: {
            Bucket: config.Bucket, // 输出的存储桶
            Region: config.Region, // 输出的存储桶的地域
            Object: 'ci/out/SpeechRecognition.mp3', // 输出的文件Key
          },
        },
        // QueueId: '', // 任务所在的队列 ID，非必须
        // CallBackFormat: '', // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式，非必须
        // CallBackType: '', // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型，非必须
        // CallBack: '', // 任务回调地址，优先级高于队列的回调地址。设置为 no 时，表示队列的回调地址不产生回调，非必须
        // CallBackMqConfig: '', // 任务回调 TDMQ 配置，当 CallBackType 为 TDMQ 时必填，非必须
      },
    });
    cos.request(
      {
        Method: 'POST',
        Key: 'asr_jobs',
        Url: url,
        Body: body,
        ContentType: 'application/xml',
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '查询语音识别队列 getAsrQueue'() {
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/asrqueue';
    var url = 'https://' + host;
    cos.request(
      {
        Method: 'GET',
        Key: 'asrqueue',
        Url: url,
        Query: {
          // queueIds: '', /* 	非必须，队列 ID，以“,”符号分割字符串 */
          // state: '', /* 非必须，1=Active,2=Paused 	 */
          // pageNumber: 1, /* 非必须，第几页	 */
          // pageSize: 2, /* 非必须，每页个数	 */
        },
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '更新语音识别队列 putAsrQueue'() {
    // 任务所在的队列 ID，请使用查询队列(https://cloud.tencent.com/document/product/460/46946)获取或前往万象控制台(https://cloud.tencent.com/document/product/460/46487)在存储桶中查询
    var queueId = 'pcc77499e85c311edb9865254008618d9';
    var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/asrqueue/' + queueId;
    var url = 'https://' + host;
    var body = COS.util.json2xml({
      Request: {
        Name: 'queue-doc-process-1',
        QueueID: queueId,
        State: 'Paused',
        NotifyConfig: {
          // Url: '',
          // Type: 'Url',
          // Event: '',
          State: 'Off',
        },
      },
    });
    cos.request(
      {
        Method: 'PUT',
        Key: 'asrqueue/' + queueId,
        Url: url,
        Body: body,
        ContentType: 'application/xml',
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
  '查询语音识别开通状态 getAsrBucket'() {
    var host = 'ci.' + config.Region + '.myqcloud.com/asrbucket';
    var url = 'https://' + host;
    cos.request(
      {
        Method: 'GET',
        Key: 'asrbucket',
        Url: url,
        Query: {
          // regions: '', /* 	非必须，地域信息，以“,”分隔字符串，支持 All、ap-shanghai、ap-beijing */
          // bucketNames: '', /* 非必须，存储桶名称，以“,”分隔，支持多个存储桶，精确搜索	 */
          // bucketName: '', /* 非必须，存储桶名称前缀，前缀搜索	 */
          // pageNumber: 1, /* 非必须，第几页	 */
          // pageSize: 10, /* 非必须，每页个数	 */
        },
      },
      function (err, data) {
        console.log(err || data);
      },
    );
  },
};

// require('./test');

module.exports = {
  toolsDao: toolsDao,
  bucketDao: bucketDao,
  objectDao: objectDao,
  advanceObjectDao: advanceObjectDao,
  ciObjectDao: ciObjectDao,
};
