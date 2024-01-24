var COS = require('./lib/cos-wx-sdk-v5');
var wxfs = wx.getFileSystemManager();
var config = require('./config');
var { cos, requestCallback } = require('./tools');

var TaskId;

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
    }
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
      }
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
      }
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
      requestCallback
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
        requestCallback
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
            requestCallback
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
    requestCallback
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
    requestCallback
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
    }
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
      requestCallback
    );
  },
  'headBucket 检索存储桶及其权限': function () {
    cos.headBucket(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback
    );
  },
  'deleteBucket 删除存储桶': function () {
    cos.deleteBucket(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback
    );
  },
  'getBucketACL 查询存储桶 ACL': function () {
    cos.getBucketAcl(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback
    );
  },
  'putBucketACL 设置存储桶 ACL': function () {
    cos.putBucketAcl(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        ACL: 'public-read',
      },
      requestCallback
    );
  },
  'getBucketCors 查询跨域配置': function () {
    cos.getBucketCors(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback
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
      requestCallback
    );
  },
  'deleteBucketCors 删除跨域配置': function () {
    cos.deleteBucketCors(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback
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
      requestCallback
    );
  },
  'getBucketPolicy 查询存储桶策略': function () {
    cos.getBucketPolicy(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback
    );
  },
  'deleteBucketPolicy 删除存储桶策略': function () {
    cos.deleteBucketPolicy(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback
    );
  },
  'getBucketLocation 获取Bucket的地域信息': function () {
    cos.getBucketLocation(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback
    );
  },
  'getBucketTagging 获取Bucket标签': function () {
    cos.getBucketTagging(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback
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
      requestCallback
    );
  },
  'deleteBucketTagging 删除存储桶标签': function () {
    cos.deleteBucketTagging(
      {
        Bucket: config.Bucket,
        Region: config.Region,
      },
      requestCallback
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
      requestCallback
    );
  },
  // 上传文件适用于单请求上传大文件
  'postObject 表单上传对象': postObject,
  'putObject 简单上传文件': putObject,
  'putObject 上传字符串': putObjectStr,
  // 上传文件
  'putObject base64 转 ArrayBuffer 上传': putObjectBase64,
  'getObject 下载对象': function () {
    cos.getObject(
      {
        Bucket: config.Bucket,
        Region: config.Region,
        Key: '1.png',
      },
      function (err, data) {
        console.log('getObject:', err || data);
      }
    );
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
      requestCallback
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
        requestCallback
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
      requestCallback
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

// require('./test');

module.exports = {
  toolsDao: toolsDao,
  bucketDao: bucketDao,
  objectDao: objectDao,
  advanceObjectDao: advanceObjectDao,
};
