var COS = require('../lib/cos-wx-sdk-v5');
var config = require('./config');

var cos = new COS({
    AppId: config.AppId,
    getAuthorization: function (params, callback) {//获取签名 必填参数
        var authorization = COS.getAuthorization({
            SecretId: config.SecretId,
            SecretKey: config.SecretKey,
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
        cos.putBucketPolicy({Bucket: config.Bucket, Region: config.Region}, requestCallback);
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
        cos.putBucketTagging({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    deleteBucketTagging: function () {
        cos.deleteBucketTagging({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    headObject: function () {
        cos.headObject({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    getObject: function () {
        cos.getObject({Bucket: config.Bucket, Region: config.Region}, requestCallback);
    },
    deleteObject: function () {
        cos.deleteObject({Bucket: config.Bucket, Region: config.Region, Key: '1.png'}, requestCallback);
    },
    getObjectACL: function () {
        cos.getObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.png'}, requestCallback);
    },
    putObjectACL: function () {
        cos.putObjectAcl({Bucket: config.Bucket, Region: config.Region, Key: '1.png'}, requestCallback);
    },
    optionsObject: function () {
        cos.optionsObject({Bucket: config.Bucket, Region: config.Region, Key: '1.png'}, requestCallback);
    },
    putObjectCopy: function () {
        cos.putObjectCopy({Bucket: config.Bucket, Region: config.Region, Key: '1.png'}, requestCallback);
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