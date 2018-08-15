var COS = require('./lib/cos-wx-sdk-v5');
var config = {
    Bucket: 'test-1250000000',
    Region: 'ap-guangzhou'
};

var TaskId;


var getAuthorization = function(options, callback) {
    // 方法一、后端通过获取临时密钥给到前端，前端计算签名
    wx.request({
        method: 'GET',
        url: 'https://example.com/cos-js-sdk-v5/server/sts.php', // 服务端签名，参考 server 目录下的两个签名例子
        dataType: 'json',
        success: function(result) {
            var data = result.data;
            callback({
                TmpSecretId: data.credentials && data.credentials.tmpSecretId,
                TmpSecretKey: data.credentials && data.credentials.tmpSecretKey,
                XCosSecurityToken: data.credentials && data.credentials.sessionToken,
                ExpiredTime: data.expiredTime,
            });
        }
    });


    // // 方法二、后端通过获取临时密钥，并计算好签名给到前端
    // wx.request({
    //   url: 'https://example.com/server/sts-auth.php',
    //   data: {
    //     method: options.Method,
    //     pathname: options.Key,
    //   },
    //   dataType: 'json',
    //   success: function(result) {
    //     console.log(result);
    //     var data = result.data;
    //     callback({
    //       Authorization: data.Authorization,
    //       XCosSecurityToken: data.XCosSecurityToken, // 如果是临时密钥计算出来的签名，需要提供 XCosSecurityToken
    //     });
    //   }
    // });

    // // 方法三、前端使用固定密钥计算签名（适用于前端调试）
    // var authorization = COS.getAuthorization({
    //     SecretId: 'AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    //     SecretKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    //     Method: options.Method,
    //     Key: options.Key,
    //     Query: options.Query,
    //     Headers: options.Headers,
    //     Expires: 60,
    // });
    // callback(authorization);
};

var cos = new COS({
    getAuthorization: getAuthorization,
});

// 回调统一处理函数
var requestCallback = function(err, data) {
    console.log(err || data);
    if (err && err.error) {
        wx.showModal({
            title: '返回错误',
            content: '请求失败：' + (err.error.Message || err.error) + '；状态码：' + err.statusCode,
            showCancel: false
        });
    } else if (err) {
        wx.showModal({
            title: '请求出错',
            content: '请求出错：' + err + '；状态码：' + err.statusCode,
            showCancel: false
        });
    } else {
        wx.showToast({
            title: '请求成功',
            icon: 'success',
            duration: 3000
        });
    }
};

// 展示的所有接口
var dao = {
    getAuth: function() {
        var key = '1mb.zip';
        getAuthorization({
            Method: 'get',
            Key: key
        }, function(auth) {
            // 注意：这里的 Bucket 格式是 test-1250000000
            console.log('http://' + config.Bucket + '.cos.' + config.Region + '.myqcloud.com' + '/' + key + '?sign=' + encodeURIComponent(auth));
        });
    },
    getObjectUrl: function() {
        var url = cos.getObjectUrl({
            Bucket: config.Bucket, // Bucket 格式：test-1250000000
            Region: config.Region,
            Key: '1mb.zip',
            Expires: 60,
            Sign: true,
        }, function(err, data) {
            console.log(err || data);
        });
        console.log(url);
    },
    // Service
    getService: function() {
        cos.getService(requestCallback);
    },
    // 简单 Bucket 操作
    putBucket: function() {
        cos.putBucket({
            Bucket: 'testnew-' + config.Bucket.substr(config.Bucket.lastIndexOf('-') + 1),
            Region: 'ap-guangzhou'
        }, requestCallback);
    },
    getBucket: function() {
        cos.getBucket({
            Bucket: config.Bucket,
            Region: config.Region
        }, requestCallback);
    },
    headBucket: function() {
        cos.headBucket({
            Bucket: config.Bucket,
            Region: config.Region
        }, requestCallback);
    },
    deleteBucket: function() {
        cos.deleteBucket({
            Bucket: 'testnew-' + config.Bucket.substr(config.Bucket.lastIndexOf('-') + 1),
            Region: 'ap-guangzhou'
        }, requestCallback);
    },
    getBucketACL: function() {
        cos.getBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region
        }, requestCallback);
    },
    putBucketACL: function() {
        cos.putBucketAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            ACL: 'public-read'
        }, requestCallback);
    },
    getBucketCors: function() {
        cos.getBucketCors({
            Bucket: config.Bucket,
            Region: config.Region
        }, requestCallback);
    },
    putBucketCors: function() {
        cos.putBucketCors({
            Bucket: config.Bucket,
            Region: config.Region,
            CORSRules: [{
                "AllowedOrigin": ["*"],
                "AllowedMethod": ["GET", "POST", "PUT", "DELETE", "HEAD"],
                "AllowedHeader": ["*"],
                "ExposeHeader": ["ETag", "Content-Length"],
                "MaxAgeSeconds": "5"
            }]
        }, requestCallback);
    },
    deleteBucketCors: function() {
        cos.deleteBucketCors({
            Bucket: config.Bucket,
            Region: config.Region
        }, requestCallback);
    },
    putBucketPolicy: function() {
        var AppId = config.Bucket.substr(config.Bucket.lastIndexOf('-') + 1);
        cos.putBucketPolicy({
            Bucket: config.Bucket,
            Region: config.Region,
            Policy: {
                "version": "2.0",
                "principal": {
                    "qcs": ["qcs::cam::uin/10001:uin/10001"]
                }, // 这里的 10001 是 QQ 号
                "statement": [{
                    "effect": "allow",
                    "action": [
                        "name/cos:GetBucket",
                        "name/cos:PutObject",
                        "name/cos:PostObject",
                        "name/cos:PutObjectCopy",
                        "name/cos:InitiateMultipartUpload",
                        "name/cos:UploadPart",
                        "name/cos:UploadPartCopy",
                        "name/cos:CompleteMultipartUpload",
                        "name/cos:AbortMultipartUpload",
                        "name/cos:AppendObject"
                    ],
                    // "resource": ["qcs::cos:ap-guangzhou:uid/1250000000:test-1250000000/*"] // 1250000000 是 appid
                    "resource": ["qcs::cos:" + config.Region + ":uid/" + AppId + ":" + config.Bucket + "/*"] // 1250000000 是 appid
                }]
            },
        }, requestCallback);
    },
    getBucketPolicy: function() {
        cos.getBucketPolicy({
            Bucket: config.Bucket,
            Region: config.Region
        }, requestCallback);
    },
    getBucketLocation: function() {
        cos.getBucketLocation({
            Bucket: config.Bucket,
            Region: config.Region
        }, requestCallback);
    },
    getBucketTagging: function() {
        cos.getBucketTagging({
            Bucket: config.Bucket,
            Region: config.Region
        }, requestCallback);
    },
    putBucketTagging: function() {
        cos.putBucketTagging({
            Bucket: config.Bucket,
            Region: config.Region,
            Tagging: {
                "Tags": [
                    {
                        "Key": "k1",
                        "Value": "v1"
                    },
                    {
                        "Key": "k2",
                        "Value": "v2"
                    }
                ]
            }
        }, requestCallback);
    },
    deleteBucketTagging: function() {
        cos.deleteBucketTagging({
            Bucket: config.Bucket,
            Region: config.Region
        }, requestCallback);
    },
    // Object
    putObject: function() {
        cos.putObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: '1.txt',
            Body: 'hello world' // 在小程序里，putObject 接口只允许传字符串的内容，不支持 TaskReady 和 onProgress，上传请使用 cos.postObject 接口
        }, requestCallback);
    },
    getObject: function() {
        cos.getObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: '1.txt'
        }, requestCallback);
    },
    headObject: function() {
        cos.headObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: '1.txt'
        }, requestCallback);
    },
    deleteObject: function() {
        cos.deleteObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: '1.txt'
        }, requestCallback);
    },
    getObjectACL: function() {
        cos.getObjectAcl({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: '1.txt'
        }, requestCallback);
    },
    putObjectACL: function() {
        cos.putObjectAcl({
            Bucket: config.Bucket, // Bucket 格式：test-1250000000
            Region: config.Region,
            Key: '1.txt',
            // GrantFullControl: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
            // GrantWrite: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
            // GrantRead: 'id="qcs::cam::uin/1001:uin/1001",id="qcs::cam::uin/1002:uin/1002"',
            // ACL: 'public-read-write',
            // ACL: 'public-read',
            // ACL: 'private',
            ACL: 'default', // 继承上一级目录权限
            // AccessControlPolicy: {
            //     "Owner": { // AccessControlPolicy 里必须有 owner
            //         "ID": 'qcs::cam::uin/459000000:uin/459000000' // 459000000 是 Bucket 所属用户的 QQ 号
            //     },
            //     "Grants": [{
            //         "Grantee": {
            //             "ID": "qcs::cam::uin/10002:uin/10002", // 10002 是 QQ 号
            //         },
            //         "Permission": "READ"
            //     }]
            // }
        }, requestCallback);
    },
    deleteMultipleObject: function() {
        cos.deleteMultipleObject({
            Bucket: config.Bucket, // Bucket 格式：test-1250000000
            Region: config.Region,
            Objects: [{
                    Key: '1.txt'
                },
                {
                    Key: '1.copy.txt'
                },
            ]
        }, requestCallback);
    },
    putObjectCopy: function() {
        cos.putObjectCopy({
            Bucket: config.Bucket, // Bucket 格式：test-1250000000
            Region: config.Region,
            Key: '1.copy.txt',
            CopySource: config.Bucket + '.cos.' + config.Region + '.myqcloud.com/1.txt',
        }, requestCallback);
    },
    // 上传文件
    postObject: function() {
        wx.chooseImage({
            count: 1, // 默认9
            sizeType: ['original'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
            success: function(res) {
                cos.postObject({
                    Bucket: config.Bucket,
                    Region: config.Region,
                    Key: '1.png',
                    FilePath: res.tempFilePaths[0],
                    TaskReady: function(taskId) {
                        TaskId = taskId
                    },
                    onProgress: function(info) {
                        console.log(JSON.stringify(info));
                    }
                }, requestCallback);
            }
        })
    },
    restoreObject: function() {
        cos.restoreObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: '1.txt',
            RestoreRequest: {
                Days: 1,
                CASJobParameters: {
                    Tier: 'Expedited'
                }
            }
        }, requestCallback);
    },
    abortUploadTask: function() {
        cos.abortUploadTask({
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
        }, requestCallback);
    },
    sliceCopyFile: function() {
        // 创建测试文件
        var sourceName = '1.txt';
        var Key = '1.slicecopy.exe';

        var sourcePath = config.Bucket + '.cos.' + config.Region + '.myqcloud.com/' + sourceName;

        cos.sliceCopyFile({
            Bucket: config.Bucket, // Bucket 格式：test-1250000000
            Region: config.Region,
            Key: Key,
            CopySource: sourcePath,
            SliceSize: 20 * 1024 * 1024, // 大于20M的文件用分片复制，小于则用单片复制
            onProgress: function(info) {
                var percent = parseInt(info.percent * 10000) / 100;
                var speed = parseInt(info.speed / 1024 / 1024 * 100) / 100;
                console.log('进度：' + percent + '%; 速度：' + speed + 'Mb/s;');
            }
        }, requestCallback);
    },
    cancelTask: function() {
        cos.cancelTask(TaskId);
        console.log('canceled');
    },
    pauseTask: function() {
        cos.pauseTask(TaskId);
        console.log('paused');
    },
    restartTask: function() {
        cos.restartTask(TaskId);
        console.log('restart');
    },
};

module.exports = dao;