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

  '查询防盗链 describeRefer'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const host = config.Bucket + '.pic.' + config.Region + '.myqcloud.com/?hotlink';
    const url = 'https://' + host;
    cos.request({
      Method: 'GET', // 固定值，必须
      Url: url, // 请求的url，必须
    },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      });
  },

  '设置防盗链 setRefer'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const host = config.Bucket + '.pic.' + config.Region + '.myqcloud.com/?hotlink';
    const url = 'https://' + host;
    const body = COS.util.json2xml({
      Hotlink: {
        Url: 'https://www.example.com', // 必须，域名地址
        Type: 'white', // 必须，防盗链类型，white 为白名单，black 为黑名单，off 为关闭。
      }
    });
    cos.request({
      Method: 'PUT',
      Url: url,
      Body: body,
    },
      function (err, data) {
        console.log(err || data);
      });
  },

  '开通原图保护 openOriginProtect'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const host = config.Bucket + '.pic.' + config.Region + '.myqcloud.com/?origin-protect';
    const url = 'https://' + host;
    cos.request({
      Method: 'PUT',
      Url: url,
    },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询原图保护 describeOriginProtect'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const host = config.Bucket + '.pic.' + config.Region + '.myqcloud.com/?origin-protect';
    const url = 'https://' + host;
    cos.request({
      Method: 'GET',
      Url: url,
    },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '关闭原图保护 closeOriginProtect'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const host = config.Bucket + '.pic.' + config.Region + '.myqcloud.com/?origin-protect';
    const url = 'https://' + host;
    cos.request({
      Method: 'DELETE',
      Url: url,
    },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '开通文件处理服务 openFileProcessService'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `file_bucket` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询文件处理服务 describeFileProcessService'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `file_bucket` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'Get', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // regions: "", // 地域信息，例如 ap-shanghai、ap-beijing，若查询多个地域以“,”分隔字符串，非必须
          // bucketNames: "", // 存储桶名称，以“,”分隔，支持多个存储桶，精确搜索，非必须
          // bucketName: "", // 存储桶名称前缀，前缀搜索，非必须
          // pageNumber: "", // 第几页，非必须
          // pageSize: "", // 每页个数，大于0且小于等于100的整数，非必须
        }
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '关闭文件处理服务 closeFileProcessService'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `file_bucket` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'DELETE', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询文件处理队列 describeFileProcessQueue'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `file_queue` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 队列 ID，以“,”符号分割字符串;是否必传：否
          queueIds: "",
          // Active 表示队列内的作业会被调度执行Paused 表示队列暂停，作业不再会被调度执行，队列内的所有作业状态维持在暂停状态，已经执行中的任务不受影响;是否必传：否
          state: "Active",
          // 第几页，默认值1;是否必传：否
          pageNumber: "",
          // 每页个数，默认值10;是否必传：否
          pageSize: "",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '更新文件处理队列 updateFileProcessQueue'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const queueId = "xxx";
    const key = `file_queue/${queueId}` // queueId:{queueId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 队列名称，仅支持中文、英文、数字、_、-和*，长度不超过 128;是否必传：是
        Name: "xxx",
        // Active 表示队列内的作业会被调度执行Paused 表示队列暂停，作业不再会被调度执行，队列内的所有作业状态维持在暂停状态，已经执行中的任务不受影响;是否必传：是
        State: "Active",
        // 回调配置;是否必传：是
        NotifyConfig: {
          // 回调开关OffOn;是否必传：否
          State: "Off",
          // 回调事件TaskFinish：任务完成WorkflowFinish：工作流完成;是否必传：否
          Event: "TaskFinish",
          // 回调格式XMLJSON;是否必传：否
          ResultFormat: "",
          // 回调类型UrlTDMQ;是否必传：否
          Type: "Url",
          // 回调地址，不能为内网地址。;是否必传：否
          Url: "",
          // TDMQ 使用模式Topic：主题订阅Queue: 队列服务;是否必传：否
          MqMode: "",
          // TDMQ 所属园区，目前支持园区 sh（上海）、bj（北京）、gz（广州）、cd（成都）、hk（中国香港）;是否必传：否
          MqRegion: "",
          // TDMQ 主题名称;是否必传：否
          MqName: "",
        },
      }
    });
    cos.request(
      {
        Method: 'PUT', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '哈希值计算同步请求 fileHash'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const ObjectKey = "test.docx";
    const key = `${ObjectKey}` // ObjectKey:{ObjectKey};
    const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 操作类型，哈希值计算固定为：filehash;是否必传：是
          "ci-process": "filehash",
          // 支持的哈希算法类型，有效值：md5、sha1、sha256;是否必传：是
          type: "md5",
          // 是否将计算得到的哈希值，自动添加至文件的自定义header，格式为：x-cos-meta-md5/sha1/sha256；有效值： true、false，不填则默认为false;是否必传：否
          addtoheader: "",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '提交哈希值计算任务 createFileHashJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `jobs` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 表示任务的类型，哈希值计算默认为：FileHashCode。;是否必传：是
        Tag: "FileHashCode",
        // 包含待操作的文件信息。;是否必传：是
        Input: {
          // 文件名，取值为文件在当前存储桶中的完整名称。;是否必传：是
          Object: "test.docx",
        },
        // 包含哈希值计算的处理规则。;是否必传：是
        Operation: {
          // 指定哈希值计算的处理规则。;是否必传：是
          FileHashCodeConfig: {
            // 哈希值的算法类型，支持：MD5、SHA1、SHA256;是否必传：是
            Type: "MD5",
            // 是否将计算得到的哈希值添加至文件自定义header，有效值：true、false，默认值为 false。自定义header根据Type的值变化，例如Type值为MD5时，自定义header为 x-cos-meta-md5。;是否必传：否
            AddToHeader: "",
          },
          // 透传用户信息, 可打印的 ASCII 码，长度不超过1024。;是否必传：否
          UserData: "",
        },
        // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式。;是否必传：否
        CallBackFormat: "",
        // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型。;是否必传：否
        CallBackType: "Url",
        // 任务回调的地址，优先级高于队列的回调地址。;是否必传：否
        CallBack: "",
      }
    });
    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询哈希值计算结果 describeFileHashJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const jobId = "xxx";
    const key = `file_jobs/${jobId}` // jobId:{jobId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '提交多文件打包压缩任务 createFileCompressJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `jobs` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 表示任务的类型，多文件打包压缩默认为：FileCompress。;是否必传：是
        Tag: "FileCompress",
        // 包含文件打包压缩的处理规则。;是否必传：是
        Operation: {
          // 指定文件打包压缩的处理规则。;是否必传：是
          FileCompressConfig: {
            // 文件打包时，是否需要去除源文件已有的目录结构，有效值：0：不需要去除目录结构，打包后压缩包中的文件会保留原有的目录结构；1：需要，打包后压缩包内的文件会去除原有的目录结构，所有文件都在同一层级。例如：源文�� URL 为 https://domain/source/test.mp4，则源文件路径为 source/test.mp4，如果为 1，则 ZIP 包中该文件路径为 test.mp4；如果为0， ZIP 包中该文件路径为 source/test.mp4。;是否必传：是
            Flatten: "0",
            // 打包压缩的类型，有效值：zip、tar、tar.gz。;是否必传：是
            Format: "zip",
            // 压缩类型，仅在Format为tar.gz或zip时有效。faster：压缩速度较快better：压缩质量较高，体积较小default：适中的压缩方式默认值为default;是否必传：否
            Type: "",
            // 压缩包密钥，传入时需先经过 base64 编码，编码后长度不能超过128。当 Format 为 zip 时生效。;是否必传：否
            CompressKey: "",
            // 支持将需要打包的文件整理成索引文件，后台将根据索引文件内提供的文件 url，打包为一个压缩包文件。索引文件需要保存在当前存储桶中，本字段需要提供索引文件的对象地址，例如：/test/index.csv。索引文件格式：仅支持 CSV 文件，一行一条 URL（仅支持本存储桶文件），如有多列字段，默认取第一列作为URL。最多不超过10000个文件, 总大小不超过50G，否则会导致任务失败。;是否必传：否
            UrlList: "",
            // 支持对存储桶中的某个前缀进行打包，如果需要对某个目录进行打包，需要加/，例如test目录打包，则值为：test/。最多不超过10000个文件，总大小不超过50G，否则会导致任务失败。;是否必传：否
            Prefix: "example/",
            // 支持对存储桶中的多个文件进行打包，个数不能超过 1000，总大小不超过50G，否则会导致任务失败。;是否必传：否
            Key: "",
          },
          // 透传用户信息，可打印的 ASCII 码，长度不超过1024。;是否必传：否
          UserData: "",
          // 指定打包压缩后的文件保存的地址信息。;是否必传：是
          Output: {
            // 存储桶的地域。;是否必传：是
            Region: config.Region,
            // 保存压缩后文件的存储桶。;是否必传：是
            Bucket: config.Bucket,
            // 压缩后文件的文件名;是否必传：是
            Object: "test.zip",
          },
        },
        // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式。;是否必传：否
        CallBackFormat: "",
        // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型。;是否必传：否
        CallBackType: "Url",
        // 任务回调的地址，优先级高于队列的回调地址。;是否必传：否
        CallBack: "",
      }
    });

    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询多文件打包压缩结果 describeFileCompressJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const jobId = "xxx";
    const key = `file_jobs/${jobId}` // jobId:{jobId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '压缩包预览 zipPreview'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `test.zip` //
    const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          "ci-process": "zippreview", // 操作类型，压缩包预览计算固定为：zippreview，必须
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '提交文件解压任务 createFileUnCompressJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `jobs` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 表示任务的类型，文件解压默认为：FileUncompress。;是否必传：是
        Tag: "FileUncompress",
        // 包含待操作的文件信息。;是否必传：是
        Input: {
          // 文件名，取值为文件在当前存储桶中的完整名称。;是否必传：是
          Object: "test.zip",
        },
        // 包含文件解压的处理规则。;是否必传：是
        Operation: {
          // 指定文件解压的处理规则。;是否必传：是
          FileUncompressConfig: {
            // 指定解压后输出文件的前缀，不填则默认保存在存储桶根路径。;是否必传：否
            Prefix: "output/",
            // 解压密钥，传入时需先经过 base64 编码。;是否必传：否
            UnCompressKey: "",
            // 指定解压后的文件路径是否需要替换前缀，有效值：0：不添加额外的前缀，解压缩将保存在Prefix指定的路径下（不会保留压缩包的名称，仅将压缩包内的文件保存至指定的路径）1：以压缩包本身的名称作为前缀，解压缩将保存在Prefix指定的路径下2：以压缩包完整路径作为前缀，此时如果不指定Prefix，就是解压到压缩包所在的当前路径（包含压缩包本身名称）默认值为0。;是否必传：否
            PrefixReplaced: "",
          },
          // 透传用户信息，可打印的 ASCII 码，长度不超过1024。;是否必传：否
          UserData: "",
          // 指定解压后的文件保存的存储桶信息。;是否必传：是
          Output: {
            // 存储桶的地域。;是否必传：是
            Region: config.Region,
            // 保存解压后文件的存储桶。;是否必传：是
            Bucket: config.Bucket,
          },
        },
        // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式。;是否必传：否
        CallBackFormat: "",
        // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型。;是否必传：否
        CallBackType: "Url",
        // 任务回调的地址，优先级高于队列的回调地址。;是否必传：否
        CallBack: "",
      }
    });
    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询文件解压结果 describeFileUnCompressJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const jobId = "xxx";
    const key = `file_jobs/${jobId}` // jobId:{jobId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询文档预览开通状态 describeDocProcessService'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `docbucket` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 地域信息，以“,”分隔字符串，支持 All、ap-shanghai、ap-beijing;是否必传：否
          regions: "",
          // 存储桶名称，以“,”分隔，支持多个存储桶，精确搜索;是否必传：否
          bucketNames: "",
          // 存储桶名称前缀，前缀搜索;是否必传：否
          bucketName: "",
          // 第几页;是否必传：否
          pageNumber: "",
          // 每页个数;是否必传：否
          pageSize: "",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '文档转html同步请求 getDocHtmlPreviewUrl'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const ObjectKey = "test.docx";
    const key = `${ObjectKey}` // ObjectKey:{ObjectKey};
    const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 数据万象处理能力，文档 HTML  预览固定为 doc-preview;是否必传：是
          "ci-process": "doc-preview",
          // 转换输出目标文件类型，文档 HTML 预览固定为 html（需为小写字母）;是否必传：是
          dstType: "html",
          // 是否获取预览链接。填入值为1会返回预览链接和Token信息；填入值为2只返回Token信息；不传会直接预览;是否必传：否
          'weboffice_url': 1,
          // 指定目标文件类型，支持的文件类型请见下方;是否必传：否
          srcType: "",
          // 对象下载签名，如果预览的对象为私有读时，需要传入签名，详情请参见 请求签名 文档注意：需要进行 urlencode;是否必传：否
          sign: "",
          // 是否可复制。默认为可复制，填入值为1；不可复制，填入值为0;是否必传：否
          copyable: "",
          // 自定义配置参数，json结构，需要经过 URL 安全 的 Base64 编码，默认配置为：{ commonOptions: { isShowTopArea: true, isShowHeader: true, language: "zh" }}，支持的配置参考 自定义配置项说明。htmlParams支持的特殊配置：语言切换，通过 commonOptions 的 language 参数指定预览语言，支持"zh"、"en“，默认为"zh"。;是否必传：否
          htmlParams: "",
          // 水印文字，需要经过 URL 安全 的 Base64 编码，默认为空;是否必传：否
          htmlwaterword: "",
          // 水印 RGBA（颜色和透明度），需要经过 URL 安全 的 Base64 编码，默认为：rgba(192,192,192,0.6);是否必传：否
          htmlfillstyle: "",
          // 水印文字样式，需要经过 URL 安全 的 Base64 编码，默认为：bold 20px Serif;是否必传：否
          htmlfront: "",
          // 水印文字旋转角度，0 - 360，默认315度;是否必传：否
          htmlrotate: "",
          // 水印文字水平间距，单位 px，默认为50;是否必传：否
          htmlhorizontal: "",
          // 水印文字垂直间距，单位 px，默认为100;是否必传：否
          htmlvertical: "",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '文档转码同步请求 getDocPreview'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const ObjectKey = "test.docx";
    const key = `${ObjectKey}` // ObjectKey:{ObjectKey};
    const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 数据万象处理能力，文档预览固定为 doc-preview;是否必传：是
          "ci-process": "doc-preview",
          // 源数据的后缀类型，当前文档转换根据 COS 对象的后缀名来确定源数据类型。当 COS 对象没有后缀名时，可以设置该值;是否必传：否
          srcType: "",
          // 需转换的文档页码，默认从1开始计数；表格文件中 page 表示转换的第 X 个 sheet 的第 X 张图;是否必传：否
          page: 0,
          // 转换输出目标文件类型：png，转成 png 格式的图片文件jpg，转成 jpg 格式的图片文件pdf，转成 pdf 格式文件。 无法选择页码，page 参数不生效如果传入的格式未能识别，默认使用 jpg 格式;是否必传：否
          dstType: "jpg",
          // Office 文档的打开密码，如果需要转换有密码的文档，请设置该字段;是否必传：否
          password: "",
          // 是否隐藏批注和应用修订，默认为00：隐藏批注，应用修订1：显示批注和修订;是否必传：否
          comment: 0,
          // 表格文件参数，转换第 X 个表，默认为1;是否必传：否
          sheet: 0,
          // 表格文件转换纸张方向，0代表垂直方向，非0代表水平方向，默认为0;是否必传：否
          excelPaperDirection: 0,
          // 设置纸张（画布）大小，对应信息为： 0 → A4 、 1 → A2 、 2 → A0 ，默认 A4 纸张 （需配合  excelRow  或  excelCol  一起使用）;是否必传：否
          excelPaperSize: 0,
          // 转换后的图片处理参数，支持 基础图片处理 所有处理参数，多个处理参数可通过 管道操作符 分隔，从而实现在一次访问中按顺序对图片进行不同处理;是否必传：否
          ImageParams: "",
          // 生成预览图的图片质量，取值范围为 [1, 100]，默认值100。 例如取值为100，代表生成图片质量为100%;是否必传：否
          quality: 0,
          // 预览图片的缩放参数，取值范围为 [10, 200]， 默认值100。 例如取值为200，代表图片缩放比例为200% 即放大两倍;是否必传：否
          scale: 0,
          // 按指定 dpi 渲染图片，该参数与  scale  共同作用，取值范围  96-600 ，默认值为  96 。转码后的图片单边宽度需小于65500像素;是否必传：否
          imageDpi: 0,
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '提交文档转码任务 createDocProcessJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `doc_jobs` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 创建任务的 Tag，目前仅支持：DocProcess;是否必传：是
        Tag: "DocProcess",
        // 待操作的文件对象;是否必传：是
        Input: {
          // 文件在 COS 上的文件路径，Bucket 由 Host 指定;是否必传：是
          Object: "test.docx",
        },
        // 操作规则;是否必传：是
        Operation: {
          // 当 Tag 为 DocProcess 时有效，指定该任务的参数;是否必传：否
          DocProcess: {
            // 源数据的后缀类型，当前文档转换根据 cos 对象的后缀名来确定源数据类型，当 cos 对象没有后缀名时，可以设置该值;是否必传：否
            SrcType: "",
            // 转换输出目标文件类型：jpg，转成 jpg 格式的图片文件；如果传入的格式未能识别，默认使用 jpg 格式png，转成 png 格式的图片文件pdf，转成 pdf 格式文件（暂不支持指定页数）;是否必传：否
            TgtType: "",
            // 从第 X 页开始转换；在表格文件中，一张表可能分割为多页转换，生成多张图片。StartPage 表示从指定 SheetId 的第 X 页开始转换。默认为1;是否必传：否
            StartPage: 1,
            // 转换至第 X 页；在表格文件中，一张表可能分割为多页转换，生成多张图片。EndPage 表示转换至指定 SheetId 的第 X 页。默认为-1，即转换全部页;是否必传：否
            EndPage: 2,
            // 表格文件参数，转换第 X 个表，默认为0；设置 SheetId 为0，即转换文档中全部表;是否必传：否
            SheetId: 0,
            // 表格文件转换纸张方向，0代表垂直方向，非0代表水平方向，默认为0;是否必传：否
            PaperDirection: 0,
            // 设置纸张（画布）大小，对应信息为： 0 → A4 、 1 → A2 、 2 → A0 ，默认 A4 纸张;是否必传：否
            PaperSize: 0,
            // 转换后的图片处理参数，支持 基础图片处理 所有处理参数，多个处理参数可通过 管道操作符 分隔，从而实现在一次访问中按顺序对图片进行不同处理;是否必传：否
            ImageParams: "",
            // 生成预览图的图片质量，取值范围 [1-100]，默认值100。 例：值为100，代表生成图片质量为100%;是否必传：否
            Quality: 0,
            // 预览图片的缩放参数，取值范围[10-200]， 默认值100。 例：值为200，代表图片缩放比例为200% 即放大两倍;是否必传：否
            Zoom: 100,
            // 按指定 dpi 渲染图片，该参数与  Zoom  共同作用，取值范围  96-600 ，默认值为  96 。转码后的图片单边宽度需小于65500像素;是否必传：否
            ImageDpi: 96,
            // 是否转换成单张长图，设置为 1 时，最多仅支持将 20 标准页面合成单张长图，超过可能会报错，分页范围可以通过 StartPage、EndPage 控制。默认值为 0 ，按页导出图片，TgtType="png"/"jpg" 时生效;是否必传：否
            PicPagination: 0,
          },
          // 结果输出地址;是否必传：是
          Output: {
            // 存储桶的地域;是否必传：是
            Region: config.Region,
            // 存储结果的存储桶;是否必传：是
            Bucket: config.Bucket,
            // 输出文件路径。非表格文件输出文件名需包含 ${Number} 或 ${Page} 参数。多个输出文件，${Number} 表示序号从1开始，${Page} 表示序号与预览页码一致。${Number} 表示多个输出文件，序号从1开始，例如输入 abc_${Number}.jpg，预览某文件5 - 6页，则输出文件名为 abc_1.jpg，abc_2.jpg${Page} 表示多个输出文件，序号与预览页码一致，例如输入 abc_${Page}.jpg，预览某文件5-6页，则输出文件名为 abc_5.jpg，abc_6.jpg表格文件输出路径需包含 ${SheetID} 占位符，输出文件名必须包含 ${Number} 参数。例如 /${SheetID}/abc_${Number}.jpg，先根据 excel 转换的表格数，生成对应数量的文件夹，再在对应的文件夹下，生成对应数量的图片文件﻿;是否必传：是
            Object: "${Number}",
          },
        },
        // 任务所在的队列 ID，开通预览服务后自动生成，请使用 查询队列 获取或前往 万象控制台 在存储桶中查询 ;是否必传：否
        QueueId: "",
      }
    });
    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询指定文档转码任务 describeDocProcessJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const jobId = "xxx";
    const key = `doc_jobs/${jobId}` // jobId:{jobId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '拉取符合条件的文档转码任务 describeDocProcessJobList'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `doc_jobs` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 任务的 Tag：DocProcess;是否必传：是
          tag: "DocProcess",
          // 拉取该队列 ID 下的任务，可在任务响应内容或控制台中获取;是否必传：否
          queueId: "",
          // Desc 或者 Asc。默认为 Desc;是否必传：否
          orderByTime: "Desc",
          // 请求的上下文，用于翻页。上次返回的值;是否必传：否
          nextToken: "",
          // 拉取该状态的任务，以,分割，支持多状态：All、Submitted、Running、Success、Failed、Pause、Cancel。默认为 All;是否必传：否
          states: "Success",
          // 拉取创建时间大于等于该时间的任务。格式为：%Y-%m-%dT%H:%m:%S%z;是否必传：否
          // startCreationTime: "",
          // 拉取创建时间小于等于该时间的任务。格式为：%Y-%m-%dT%H:%m:%S%z;是否必传：否
          // endCreationTime: "",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询文档转码队列 describeDocProcessQueue'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `docqueue` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 队列 ID，以“,”符号分割字符串;是否必传：否
          queueIds: "",
          // 1. Active 表示队列内的作业会被文档预览服务调度执行2. Paused  表示队列暂停，作业不再会被文档预览服务调度执行，队列内的所有作业状态维持在暂停状态，已经处于执行中的任务将继续执行，不受影响;是否必传：否
          state: "Active",
          // 第几页，默认第一页;是否必传：否
          pageNumber: "",
          // 每页个数，默认10个;是否必传：否
          pageSize: "",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '更新文档转码队列 updateProcessQueue'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const queueId = "xxx";
    const key = `docqueue/${queueId}`
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 队列名称;是否必传：是
        Name: "xxx",
        // 队列 ID;是否必传：是
        QueueID: queueId,
        // 队列状态;是否必传：是
        State: "Active",
        // 通知渠道;是否必传：是
        NotifyConfig: {
          // 回调配置;是否必传：否
          Url: "",
          // 回调类型，普通回调：Url;是否必传：否
          Type: "Url",
          // 回调事件，文档预览任务完成;是否必传：否
          Event: "TaskFinish",
          // 回调开关，Off，On;是否必传：否
          State: "Off",
        },
      }
    });
    cos.request(
      {
        Method: 'PUT', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询海报合成任务 describePosterProductionJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const jobId = "xxx";
    const key = `pic_jobs/${jobId}` // jobId:{jobId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '批量拉取海报合成任务 describePosterProductionJobList'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `pic_jobs`; //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 拉取该队列 ID 下的任务;是否必传：是
          queueId: "xxx",
          // 任务的 Tag;是否必传：是
          tag: "PosterProduction",
          // 触发该任务的工作流ID;是否必传：否
          workflowId: "",
          // 触发该任务的存量触发任务ID;是否必传：否
          inventoryTriggerJobId: "",
          // 该任务的输入文件名，暂仅支持精确匹配;是否必传：否
          inputObject: "",
          // Desc 或者 Asc。默认为 Desc;是否必传：否
          orderByTime: "Desc",
          // 请求的上下文，用于翻页。上次返回的值;是否必传：否
          nextToken: "",
          // 拉取该状态的任务，以,分割，支持多状态：All、Submitted、Running、Success、Failed、Pause、Cancel。默认为 All;是否必传：否
          states: "All",
          // 拉取创建时间大于该时间的任务。格式为：%Y-%m-%dT%H:%m:%S%z，示例：2001-01-01T00:00:00+0800;是否必传：否
          // startCreationTime: "",
          // 拉取创建时间小于该时间的任务。格式为：%Y-%m-%dT%H:%m:%S%z，示例：2001-01-01T23:59:59+0800;是否必传：否
          // endCreationTime: "",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '取消海报合成任务 cancelPosterProductionJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const jobId = "xxx";
    const key = `jobs/${jobId}?cancel` // jobId:{jobId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'PUT', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '提交海报合成任务 cancelPosterProductionJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `pic_jobs` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 创建任务的 Tag：PicProcess;是否必传：是
        Tag: "PosterProduction",
        // 待操作的媒体信息;是否必传：是
        Input: {
          // 媒体文件名;是否必传：是
          Object: "1.jpeg ",
        },
        // 操作规则;是否必传：是
        Operation: {
          // 指定该任务的参数;是否必传：否
          PosterProduction: {
            // ;是否必传：是
            TemplateId: "xxx",
            Info: {
              main: "https://examplebucket-1250000000.cos.ap-guangzhou.myqcloud.com/1.jpeg",
              text_main: "demo"
            }
          },
          // 结果输出地址;是否必传：是
          Output: {
            // 存储桶的地域;是否必传：是
            Region: config.Region,
            // 存储结果的存储桶;是否必传：是
            Bucket: config.Bucket,
            // 结果文件的名字;是否必传：是
            Object: "test.jpg",
          },
          // 透传用户信息, 可打印的 ASCII 码, 长度不超过1024;是否必传：否
          UserData: "",
          // 任务优先级，级别限制：0 、1 、2 。级别越大任务优先级越高，默认为0;是否必传：否
          JobLevel: "0",
        },
        // 任务所在的队列 ID;是否必传：否
        QueueId: "",
        // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式;是否必传：否
        CallBackFormat: "",
        // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型;是否必传：否
        CallBackType: "Url",
        // 任务回调地址，优先级高于队列的回调地址。设置为 no 时，表示队列的回调地址不产生回调;是否必传：否
        CallBack: "",
      }
    });
    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询海报合成模板 describePosterProductionTemplate'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const TemplateId = "xxx";
    const key = `posterproduction/template/${TemplateId}` // TemplateId:{TemplateId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询海报合成模板列表 describePosterProductionTemplateList'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `posterproduction/template` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 模板分类ID，支持传入多个，以,符号分割字符串;是否必传：否
          categoryIds: "",
          // Official(系统预设模板)，Custom(自定义模板)，All(所有模板)，默认值: Custom;是否必传：否
          type: "Custom",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '删除海报合成模板 deletePosterProductionTemplate'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const TemplateId = "xxx";
    const key = `posterproduction/template/${TemplateId}` // TemplateId:{TemplateId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'DELETE', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '上传海报合成模板 uploadPosterProductionTemplate'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `posterproduction/template` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 输入参数;是否必传：否
        Input: {
          // COS 桶中 PSD 文件，大小限制100M;是否必传：是
          Object: "test.psd",
        },
        // 模板名称;是否必传：是
        Name: "test",
        // 模板分类 ID，支持传入多个，以 , 符号分割字符串;是否必传：否
        CategoryIds: "",
      }
    });

    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '开通 Guetzli 压缩 openImageGuetzli'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `` //
    const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'PUT', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Action: 'guetzli'// 固定值
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询 Guetzli 压缩 describeImageGuetzli'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `` //
    const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Action: 'guetzli'// 固定值

      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '关闭 Guetzli 压缩 describeImageGuetzli'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `` //
    const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'DELETE', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Action: 'guetzli'// 固定值

      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '提交图片处理任务 createImageProcessJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `jobs`; //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 创建任务的 Tag：PicProcess;是否必传：是
        Tag: "PicProcess",
        // 待操作的文件信息;是否必传：是
        Input: {
          // 文件路径;是否必传：是
          Object: "1.jpeg",
        },
        // 操作规则;是否必传：是
        Operation: {
          // 图片处理模板 ID;是否必传：否
          TemplateId: "xxx",
          // 结果输出配置;是否必传：是
          Output: {
            // 存储桶的地域;是否必传：是
            Region: config.Region,
            // 存储结果的存储桶;是否必传：是
            Bucket: config.Bucket,
            // 结果文件的名字;是否必传：是
            Object: "output/1.jpeg",
          },
          // 透传用户信息，可打印的 ASCII 码，长度不超过1024;是否必传：否
          UserData: "",
          // 任务优先级，级别限制：0 、1 、2 。级别越大任务优先级越高，默认为0;是否必传：否
          JobLevel: "0",
        },
        // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式;是否必传：否
        CallBackFormat: "",
        // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型;是否必传：否
        CallBackType: "Url",
        // 任务回调地址，优先级高于队列的回调地址。设置为 no 时，表示队列的回调地址不产生回调;是否必传：否
        CallBack: "",
      }
    });

    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '创建图片处理模板 createImageProcessTemplate'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
    const key = `template`; //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 模板类型：PicProcess;是否必传：是
        Tag: "PicProcess",
        // 模板名称，仅支持中文、英文、数字、_、-和*，长度不超过 64;是否必传：是
        Name: "test",
        // 图片处理参数;是否必传：是
        PicProcess: {
          // 是否返回原图信息，取值 true/false;是否必传：否
          IsPicInfo: "",
          // 图片处理规则基础图片处理参见 基础图片处理文档图片压缩参见 图片压缩 文档盲水印参见 盲水印 文档;是否必传：是
          ProcessRule: "imageMogr2/rotate/9",
        },
      }
    });

    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '更新图片处理模板 updateImageProcessTemplate'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const TemplateId = "xxx";
    const key = `template/${TemplateId}`; // TemplateId:{TemplateId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 模板类型：PicProcess;是否必传：是
        Tag: "PicProcess",
        // 模板名称，仅支持中文、英文、数字、_、-和*，长度不超过 64;是否必传：是
        Name: "test",
        // 图片处理参数;是否必传：是
        PicProcess: {
          // 是否返回原图信息，取值 true/false;是否必传：否
          IsPicInfo: "",
          // 图片处理规则基础图片处理参见 基础图片处理文档图片压缩参见 图片压缩 文档盲水印参见 盲水印 文档;是否必传：是
          ProcessRule: "imageMogr2/rotate/99",
        },
      }
    });
    cos.request(
      {
        Method: 'PUT', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '新增图片样式 addImageStyle'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `` //
    const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      AddStyle: {
        // 样式名称;是否必传：是
        StyleName: "test",
        // 样式详情;是否必传：是
        StyleBody: "imageMogr2/thumbnail/!50px",
      }
    });

    cos.request(
      {
        Method: 'PUT', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Action: 'style', // 固定值
        Body: body,
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询图片样式 describeImageStyles'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `` //
    const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Action: 'style', // 固定值
        Query: {
          GetStyle: {
            // 查询的图片样式名称。;是否必传：否
            StyleName: "test",
          }
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '删除图片样式 describeImageStyles'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `` //
    const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      DeleteStyle: {
        // 样式名称;是否必传：是
        StyleName: "test",
      }
    });

    cos.request(
      {
        Method: 'DELETE', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Action: 'style', // 固定值
        Body: body,
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '异常图片检测同步请求 imageInspectSync'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const ObjectKey = "test.jpg";
    const key = `${ObjectKey}`; // ObjectKey:{ObjectKey};
    const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // ;是否必传：是
          "ci-process": "ImageInspect",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '创建异常图片检测任务 createImageInspectJob'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `jobs` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 创建任务的 Tag：ImageInspect;是否必传：是
        Tag: "ImageInspect",
        // 待操作的文件信息;是否必传：是
        Input: {
          // 文件路径;是否必传：是
          Object: "test.jpg",
        },
        // 操作规则;是否必传：否
        Operation: {
          // 透传用户信息，可打印的 ASCII 码，长度不超过1024;是否必传：否
          UserData: "",
          // 任务优先级，级别限制：0 、1 、2 。级别越大任务优先级越高，默认为0;是否必传：否
          JobLevel: "0",
          // 该任务的参数;是否必传：否
          ImageInspect: {
            // 是否开启识别到图片异常后自动对图片进行如移动到其他目录、设置为私有权限、删除等动作。取值：true/false，默认为false;是否必传：否
            AutoProcess: "",
            // 指定检测到异常图片后的处理动作BackupObject：将图片移动 abnormal_images_backup下，该目录由后台自动创建SwitchObjectToPrivate：将图片权限设置为私有DeleteObject：删除图片默认值：BackupObject当 AutoProcess 为 true 时，该参数生效;是否必传：否
            ProcessType: "",
          },
        },
        // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式;是否必传：否
        CallBackFormat: "",
        // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型;是否必传：否
        CallBackType: "Url",
        // 任务回调地址，优先级高于队列的回调地址。设置为 no 时，表示队列的回调地址不产生回调;是否必传：否
        CallBack: "",
      }
    });

    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '开通图片处理异步服务 openImageProcessService'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `picbucket`; //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'POST', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询图片处理异步服务 describeImageProcessService'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `picbucket`; //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 地域信息，以“,”分隔字符串，支持 All、ap-shanghai、ap-beijing;是否必传：否
          regions: "",
          // 存储桶名称，以“,”分隔，支持多个存储桶，精确搜索;是否必传：否
          bucketNames: "",
          // 存储桶名称前缀，前缀搜索;是否必传：否
          bucketName: "test",
          // 第几页;是否必传：否
          pageNumber: "",
          // 每页个数;是否必传：否
          pageSize: "",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '关闭图片处理异步服务 closeImageProcessService'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `picbucket`; //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'DELETE', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询图片处理异步队列 describeImageProcessQueue'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `picqueue` //
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 队列 ID，以“,”符号分割字符串;是否必传：否
          queueIds: "",
          // Active 表示队列内的作业会被调度执行Paused 表示队列暂停，作业不再会被调度执行，队列内的所有作业状态维持在暂停状态，已经执行中的任务不受影响;是否必传：否
          state: "Active",
          // 第几页，默认值1;是否必传：否
          pageNumber: "",
          // 每页个数，默认值10;是否必传：否
          pageSize: "",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '更新图片处理异步队列 updateImageProcessQueue'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const queueId = "xxx";
    const key = `picqueue/${queueId}` // queueId:{queueId};
    const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      Request: {
        // 队列名称，仅支持中文、英文、数字、_、-和*，长度不超过 128;是否必传：是
        Name: "xxx",
        // Active 表示队列内的作业会被调度执行Paused 表示队列暂停，作业不再会被调度执行，队列内的所有作业状态维持在暂停状态，已经执行中的任务不受影响;是否必传：是
        State: "Active",
        // 回调配置;是否必传：是
        NotifyConfig: {
          // 回调开关OffOn;是否必传：否
          State: "Off",
          // 回调事件TaskFinish：任务完成WorkflowFinish：工作流完成;是否必传：否
          // Event: "",
          // 回调格式XMLJSON;是否必传：否
          // ResultFormat: "",
          // 回调类型UrlTDMQ;是否必传：否
          // Type: "",
          // 回调地址，不能为内网地址。;是否必传：否
          // Url: "",
          // TDMQ 使用模式Topic：主题订阅Queue: 队列服务;是否必传：否
          // MqMode: "",
          // TDMQ 所属园区，目前支持园区 sh（上海）、bj（北京）、gz（广州）、cd（成都）、hk（中国香港）;是否必传：否
          // MqRegion: "",
          // TDMQ 主题名称;是否必传：否
          // MqName: "",
        },
      }
    });

    cos.request(
      {
        Method: 'PUT', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '开通极智压缩 openImageSlim'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `` //
    const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;
    const body = COS.util.json2xml({
      // 极智压缩配置信息
      ImageSlim: {
        // 极智压缩的使用模式，包含两种：API：开通极智压缩的 API 使用方式，开通后可在图片下载时通过极智压缩参数对图片进行压缩；Auto：开通极智压缩的自动使用方式，开通后无需携带任何参数，存储桶内指定格式的图片将在访问时自动进行极智压缩。注意：支持同时开通两种模式，多个值通过逗号分隔。
        SlimMode: "Auto,API",
        // 当SlimMode的值包含Auto时生效，用于指定需要自动进行压缩的图片格式。
        Suffixs: {
          // 需要自动进行压缩的图片格式，可选值：jpg、png。
          Suffix: "jpg",
        }
      }
    })
    cos.request(
      {
        Method: 'PUT', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Action: 'image-slim', // 固定值
        Body: body, // 请求体参数，必须
        ContentType: 'application/xml', // 固定值，必须
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '查询极智压缩状态 describeImageSlim'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `` //
    const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Action: 'image-slim', // 固定值
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '关闭极智压缩 closeImageSlim'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const key = `` //
    const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'DELETE', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Action: 'image-slim'// 固定值
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '通过API使用极智压缩 imageSlim'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const ObjectKey = "test.jpeg";
    const key = `${ObjectKey}` // ObjectKey:{ObjectKey};
    const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Action: 'imageSlim'// 固定值

      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  '获取原图 getOriginImage'() {
    // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
    const ObjectKey = "test.jpg";
    const key = `${ObjectKey}` // ObjectKey:{ObjectKey};
    const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
    const url = `https://${host}/${key}`;

    cos.request(
      {
        Method: 'GET', // 固定值，必须
        Key: key, // 必须
        Url: url, // 请求的url，必须
        Query: {
          // 万象通用参数，需要获取原图的时，该参数固定为：originImage;是否必传：是
          "ci-process": "originImage",
        },
      },
      function (err, data) {
        if (err) {
          // 处理请求失败
          console.log(err);
        } else {
          // 处理请求成功
          console.log(data.Response);
        }
      },
    );
  },

  'uploadImg 上传时合成动图': function () {
    wx.chooseMessageFile({
      count: 2,
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
                  'Pic-Operations':
                    '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject", "rule": "imageMogr2/animate/duration/10/images/<imageurl1>"}]}',
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
  'requestImg 对云上数据进行合成动图': function () {
    // 对云上数据进行图片处理
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: '1.jpeg',
        Method: 'POST',
        Action: 'image_process',
        Headers: {
          'Pic-Operations':
            '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject", "rule": "imageMogr2/animate/duration/10/images/<imageurl1>"}]}',
        },
      },
      requestCallback,
    );
  },
  'getImg 下载时使用合成动图': function () {
    cos.getObject(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: '1.png',
        QueryString: `imageMogr2/animate/duration/10/images/<imageurl1>`,
      },
      requestCallback,
    );
  },

  'uploadImg 上传时使用图片水印': function () {
    wx.chooseMessageFile({
      count: 2,
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
                  'Pic-Operations':
                    '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject", "rule": "watermark/1/image/<encodedURL>/gravity/SouthEast/dx/10/dy/10/blogo/1"}]}',
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
  'requestImg 对云上数据使用图片水印': function () {
    // 对云上数据进行图片处理
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: '1.jpeg',
        Method: 'POST',
        Action: 'image_process',
        Headers: {
          'Pic-Operations':
            '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject", "rule": "watermark/1/image/<encodedURL>/gravity/SouthEast/dx/10/dy/10/blogo/1"}]}',
        },
      },
      requestCallback,
    );
  },
  'getImg 下载时使用图片水印': function () {
    cos.getObject(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: 'test.jpg',
        QueryString: `watermark/1/image/<encodedURL>/gravity/SouthEast/dx/10/dy/10/blogo/1`,
      },
      requestCallback,
    );
  },

  'uploadImg 上传时使用文字水印': function () {
    wx.chooseMessageFile({
      count: 2,
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
                  'Pic-Operations':
                    '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject", "rule": "watermark/2/text/5paH5a2X5rC05Y2w5rWL6K-V/fontsize/16/dissolve/100/gravity/SouthEast/dx/10/dy/10/batch/1/degree/45/shadow/50"}]}',
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
  'requestImg 对云上数据使用文字水印': function () {
    // 对云上数据进行图片处理
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: '1.jpeg',
        Method: 'POST',
        Action: 'image_process',
        Headers: {
          'Pic-Operations':
            '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject", "rule": "watermark/2/text/5paH5a2X5rC05Y2w5rWL6K-V/fontsize/16/dissolve/100/gravity/SouthEast/dx/10/dy/10/batch/1/degree/45/shadow/50"}]}',
        },
      },
      requestCallback,
    );
  },
  'getImg 下载时使用文字水印': function () {
    cos.getObject(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: 'test.jpg',
        QueryString: `watermark/2/text/5paH5a2X5rC05Y2w5rWL6K-V/fontsize/16/dissolve/100/gravity/SouthEast/dx/10/dy/10/batch/1/degree/45/shadow/50`,
      },
      requestCallback,
    );
  },

  'uploadImg 上传时使用图片压缩': function () {
    wx.chooseMessageFile({
      count: 2,
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
                  // 通过 imageMogr2 接口进行 webp 压缩，可以根据需要压缩的类型填入不同的压缩格式：webp/heif/tpg/avif/svgc
                  'Pic-Operations':
                    '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject.jpg", "rule": "imageMogr2/format/webp"}]}',
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
  'requestImg 对云上数据使用图片压缩': function () {
    // 对云上数据进行图片处理
    cos.request(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: '1.jpeg',
        Method: 'POST',
        Action: 'image_process',
        Headers: {
          // 通过 imageMogr2 接口进行 webp 压缩，可以根据需要压缩的类型填入不同的压缩格式：webp/heif/tpg/avif/svgc
          'Pic-Operations':
            '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject.jpeg", "rule": "imageMogr2/format/webp"}]}',
        },
      },
      requestCallback,
    );
  },
  'getImg 下载时使用图片压缩': function () {
    cos.getObject(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: 'test.jpg',
        QueryString: `imageMogr2/format/webp`, // 通过 imageMogr2 接口进行 webp 压缩，可以根据需要压缩的类型填入不同的压缩格式：webp/heif/tpg/avif/svgc
      },
      requestCallback,
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
