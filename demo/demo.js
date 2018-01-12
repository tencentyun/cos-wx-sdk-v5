var COS = require('./lib/cos-wx-sdk-v5');
var config = {
    Bucket: 'wx-1250000000',
    Region: 'ap-guangzhou'
};

var cos = new COS({
    getAuthorization: function (params, callback) {//获取签名 必填参数

        // 方法一（推荐）服务器提供计算签名的接口
        /*
        wx.request({
            url: 'SIGN_SERVER_URL',
            data: {
                Method: params.Method,
                Key: params.Key
            },
            dataType: 'text',
            success: function (result) {
                callback(result.data);
            }
        });
        */

        // 方法二（适用于前端调试）
        var authorization = COS.getAuthorization({
            SecretId: 'AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            SecretKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            Method: params.Method,
            Key: params.Key
        });
        callback(authorization);
    }
});

// 回调统一处理函数
var requestCallback =function (err, data) {
    console.log(err || data);
    if (err && err.error) {
        wx.showModal({title: '返回错误', content: '请求失败：' + err.error.Message + '；状态码：' + err.statusCode, showCancel: false});
    } else if (err) {
        wx.showModal({title: '请求出错', content: '请求出错：' + err + '；状态码：' + err.statusCode, showCancel: false});
    } else {
        wx.showToast({title: '请求成功', icon: 'success', duration: 3000});
    }
};

// 展示的所有接口
var dao = {
    // Service
    getService: function () {
        cos.getService(requestCallback);
    },
    // Bucket
    headBucket: function () {
        cos.headBucket({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    getBucket: function () {
        cos.getBucket({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    deleteBucket: function () {
        cos.deleteBucket({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    getBucketACL: function () {
        cos.getBucketAcl({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    putBucketACL: function () {
        cos.putBucketAcl({Bucket: config.Bucket, Region: config.Region, ACL: 'public-read'}, requestCallback);
    },
    getBucketCors: function () {
        cos.getBucketCors({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    putBucketCors: function () {
        cos.putBucketCors({Bucket: config.Bucket, Region: config.Region,
            CORSRules: [{
                "AllowedOrigin": ["*"],
                "AllowedMethod": ["GET", "POST", "PUT", "DELETE", "HEAD"],
                "AllowedHeader": ["*"],
                "ExposeHeader": ["ETag"],
                "MaxAgeSeconds": "5"
            }]
        }, requestCallback);
    },
    putBucketPolicy: function () {
        var AppId = config.Bucket.substr(config.Bucket.lastIndexOf('-') + 1);
        cos.putBucketPolicy({Bucket: config.Bucket, Region: config.Region,
            Policy: {
                "version": "2.0",
                "principal": {"qcs": ["qcs::cam::uin/10001:uin/10001"]}, // 这里的 10001 是 QQ 号
                "statement": [
                    {
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
                    }
                ]
            },
        }, requestCallback);
    },
    deleteBucketCORS: function () {
        cos.deleteBucketCors({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    getBucketLocation: function () {
        cos.getBucketLocation({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    getBucketPolicy: function () {
        cos.getBucketPolicy({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    getBucketTagging: function () {
        cos.getBucketTagging({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    putBucketTagging: function () {
        cos.putBucketTagging({
            Bucket: config.Bucket, Region: config.Region,
            Tagging: {
                "Tags": [
                    {"Key": "k1", "Value": "v1"},
                    {"Key": "k2", "Value": "v2"}
                ]
            }
        }, requestCallback);
    },
    deleteBucketTagging: function () {
        cos.deleteBucketTagging({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    headObject: function () {
        cos.headObject({Bucket: config.Bucket, Region: config.Region, Key: '1.png'}, requestCallback);
    },
    getObject: function () {
        cos.getObject({Bucket: config.Bucket, Region: config.Region, Key: '1.png'}, requestCallback);
    },
    deleteObject: function () {
        cos.deleteObject({Bucket: config.Bucket, Region: config.Region, Key: '1.png'}, requestCallback);
    },
    getObjectACL: function () {
        cos.getObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.png'}, requestCallback);
    },
    putObjectACL: function () {
        cos.putObjectAcl({
            Bucket: config.Bucket, // Bucket 格式：test-1250000000
            Region: config.Region,
            Key: '1.png',
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
    putObjectCopy: function () {
        cos.putObjectCopy({
            Bucket: config.Bucket, // Bucket 格式：test-1250000000
            Region: config.Region,
            Key: '1.copy.png',
            CopySource: config.Bucket + '.cos.' + config.Region + '.myqcloud.com/1.png',
        }, requestCallback);
    },
    // Object
    postObject: function () {
        wx.chooseImage({
            count: 1, // 默认9
            sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                cos.postObject({
                    Bucket: config.Bucket, Region: config.Region, Key: '1.png',
                    FilePath: res.tempFilePaths[0],
                    onProgress: function (info) {
                        console.log(JSON.stringify(info));
                    }
                }, requestCallback);
            }
        })
    },
};

module.exports = dao;