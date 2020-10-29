var COS = require('./lib/cos-wx-sdk-v5');
var wxfs = wx.getFileSystemManager();
var config = require('./config');

var TaskId;


// 签名回调
var getAuthorization = function(options, callback) {

    // 格式一、（推荐）后端通过获取临时密钥给到前端，前端计算签名
    // 服务端 JS 和 PHP 例子：https://github.com/tencentyun/cos-js-sdk-v5/blob/master/server/
    // 服务端其他语言参考 COS STS SDK ：https://github.com/tencentyun/qcloud-cos-sts-sdk
    wx.request({
        method: 'GET',
        url: config.stsUrl, // 服务端签名，参考 server 目录下的两个签名例子
        dataType: 'json',
        success: function(result) {
            var data = result.data;
            var credentials = data && data.credentials;
            if (!data || !credentials) return console.error('credentials invalid');
            callback({
                TmpSecretId: credentials.tmpSecretId,
                TmpSecretKey: credentials.tmpSecretKey,
                XCosSecurityToken: credentials.sessionToken,
                StartTime: data.startTime, // 时间戳，单位秒，如：1580000000，建议返回服务器时间作为签名的开始时间，避免用户浏览器本地时间偏差过大导致签名错误
                ExpiredTime: data.expiredTime, // 时间戳，单位秒，如：1580000900
            });
        }
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
    //     SecretId: 'AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
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

var mylog = function (msg) {
    wx.showToast({
        title: msg,
        icon: 'success',
        duration: 3000
    });
};
var dao = {
    '分片上传': function() {
        var sliceUploadFile = function (file) {
            var key = file.name;
            cos.sliceUploadFile({
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
                onTaskReady: function(taskId) {
                    TaskId = taskId
                },
                onHashProgress: function(info) {
                    console.log('check hash', JSON.stringify(info));
                },
                onProgress: function(info) {
                    console.log(JSON.stringify(info));
                }
            }, requestCallback);
        };
        wx.chooseMessageFile({
            count: 10,
            type: 'all',
            success: function(res) {
                sliceUploadFile(res.tempFiles[0]);
            }
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
    // 上传文件适用于单请求上传大文件
    'postObject 简单上传': function() {
        wx.chooseImage({
            count: 1, // 默认9
            sizeType: ['original'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
            success: function(res) {
                var file = res.tempFiles[0];
                cos.postObject({
                    Bucket: config.Bucket,
                    Region: config.Region,
                    Key: '1.png',
                    FilePath: file.path,
                    onTaskReady: function(taskId) {
                        TaskId = taskId
                    },
                    onProgress: function(info) {
                        console.log(JSON.stringify(info));
                    }
                }, requestCallback);
            }
        })
    },
    'putObject 简单上传文件': function(type) {
        wx.chooseMessageFile({
            count: 10,
            type: 'all',
            success: function(res) {
                var file = res.tempFiles[0];
                wxfs.readFile({
                    filePath: file.path,
                    success: function (res) {
                        cos.putObject({
                            Bucket: config.Bucket,
                            Region: config.Region,
                            Key: file.name,
                            Body: res.data, // 在小程序里，putObject 接口只允许传字符串的内容，不支持 TaskReady 和 onProgress，上传请使用 cos.postObject 接口
                        }, requestCallback);
                    },
                    fail: err => console.error(err),
                });
            },
            fail: err => console.error(err),
        });
    },
    'putObject 上传字符串': function(type) {
        cos.putObject({
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
        }, requestCallback);
    },
    // 上传文件
    'putObject base64 转 ArrayBuffer 上传': function() {
        var base64Url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABRFBMVEUAAAAAo/8Ao/8Ao/8Ao/8ApP8Aov8Ao/8Abv8Abv8AyNwAyNwAo/8Ao/8Ao/8Abv8Ao/8AivgAo/8AyNwAbv8Abv8AydwApf8Abf8Ao/8AbP8Ao/8AyNwAydwAbv8AydwApP8Ao/8AyNwAo/8AyNwAydsAyNwAxd8Aov8AyNwAytsAo/8Abv8AyNwAbv8Av+MAo/8AytsAo/8Abv8AyNwAo/8Abv8AqfkAbv8Aov8Abv8AyNwAov8Abv8Ao/8Abv8Ao/8AydwAo/8Ao/8Ate8Ay9oAvOcAof8AveAAyNwAyNwAo/8AyNwAy9kAo/8AyNwAyNwAo/8AqP8Aaf8AyNwAbv0Abv8Abv8AaP8Ao/8Ao/8Ao/8Ao/8Abv8AyNwAgvcAaP8A0dkAo/8AyNwAav8Abv8Ao/8Abv8AyNwAy9sAvOUAtePdkYxjAAAAZnRSTlMAw/co8uAuJAn8+/Tt29R8DAX77+nZz87Jv6CTh3lxTklAPjouJRsL5tjAuLiyr62roaCakYp0XVtOQTMyLiohICAcGRP49vTv5+PJurawq6mnnJuYl4+OiIB7eXVvX15QSDgqHxNcw3l6AAABe0lEQVQ4y82P11oCQQxGIy5FUJpKk6aAhV6k92LvvXedDfj+92ZkYQHxnnMxu3/OfJMEJo6y++baXf5XVw22GVGcsRmq431mQZRYyIzRGgdXi+HwIv86NDBKisrRAtU1hSj9pkZ9jpo/9YKbRsmNNKCHDXI00BxfMMirKNpMcjQ5Lm4/YZArUXyBYUwg40nsdr5jb3LBe25VWpNeKa1GENsEnq52C80z1uW48estiKjb19G54QdCrScnKAU69U3KJ4jzrsBawDWPuOcBqMyRvlcb1Y+zjMUBVsivAKe4gXgEKiVjSh9wlunGMmwiOqFL3RI0cj+nkgp3jC1BELVFkGiZSuvkp3tZZWZ2sKCuDj185PXqfmwI7AAOUctHkJoOeXg3sxA4ES+l7CVvrYHMEmNp8GtR+wycPG0+1RrwWQUzl4CvgQmPP5Ddofl8tWkJVT7J+BIAaxEktrYZoRAUfXgOGYHfcOqw3WF/EdLccz5cMfvUCPb4QwUmhB8+v12HZPCkbgAAAABJRU5ErkJggg==';
        var m = (/data:image\/(\w+);base64,(.*)/.exec(base64Url) || []);
        var format = m[1];
        var bodyData = m[2];
        var fileBuf = wx.base64ToArrayBuffer(bodyData);
        cos.putObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: '1.' + format,
            Body: fileBuf,
        }, requestCallback);
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
            Bucket: config.Bucket,
            Region: config.Region,
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
            Bucket: config.Bucket,
            Region: config.Region
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
    deleteBucketPolicy: function() {
        cos.deleteBucketPolicy({
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

// require('./test');

module.exports = dao;
