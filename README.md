# cos-wx-sdk-v5

微信小程序 sdk for [腾讯云对象存储服务](https://www.qcloud.com/product/cos)

### 一、前期准备

1. 到 (COS对象存储控制台)[https://console.cloud.tencent.com/cos4] 创建存储桶，得到 Bucket（存储桶名称） 和 Region（地域名称）
2. 到 (控制台密钥管理)[https://console.cloud.tencent.com/capi] 获取您的项目 SecretId 和 SecretKey
    
### 二、计算签名

由于签名计算放在前端会暴露 SecretId 和 SecretKey，我们把签名计算过程放在后端实现，前段通过 ajax 向后端获取签名结果，正式部署时请再后端加一层自己网站本身的权限检验。

这里提供 [PHP 和 NodeJS 的签名例子](https://github.com/tencentyun/cos-js-sdk-v5/blob/master/server/)，其他语言，请参照对应的 [XML SDK](https://cloud.tencent.com/document/product/436/6474)

### 三、上传例子

1. 把 demo/lib/cos-wx-sdk-v5.js 复制到自己小程序项目代码里，在需要上传文件的地方贴以下代码

```javascript
var Bucket = 'test-1250000000';
var Region = 'ap-guangzhou';

// 初始化实例
var cos = new COS({
    getAuthorization: function (options, callback) {
        // 异步获取签名
        wx.request({
            url: 'https://example.com/sign',
            data: {
                Method: params.Method,
                Key: params.Key
            },
            dataType: 'text',
            success: function (result) {
                callback(result.data);
            }
        });
    }
});

// 选择文件
wx.chooseImage({
    count: 1, // 默认9
    sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
    sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
    success: function (res) {
        var filepath = res.tempFilePaths[0];
        var filename = filePath.substr(filePath.lastIndexOf('/') + 1);
        cos.postObject({
            Bucket: Bucket,
            Region: Region,
            Key: filename,
            FilePath: filepath,
            onProgress: function (info) {
                console.log(JSON.stringify(info));
            }
        }, function (err, data) {
            console.log(err || data);
        });
    }
});
```

## 说明文档

完整文档有待完善，不支持分片相关接口，上传下载相关方法请查看源码和例子 [使用例子](demo/demo.js)

其他大部分接口可以参考以下 JS SDK 文档 [接口文档](https://cloud.tencent.com/document/product/436/12260)
