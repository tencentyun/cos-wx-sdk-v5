const COS = require('../lib/cos-wx-sdk-v5');
var wxfs = wx.getFileSystemManager();
const config = require('../config');
const { cos, requestCallback } = require('../tools');

const picProcessDao = {
  'uploadImg 上传时使用图片处理': uploadImg,
  'requestImg 对云上数据进行图片处理': requestImg,
  'getImg 下载时使用图片处理': getImg,
  '生成带图片处理参数的签名 URL': getObjectUrlWithPicProcess,
  '开通原图保护 openOriginProtect': openOriginProtect,
  '查询原图保护 describeOriginProtect': describeOriginProtect,
  '关闭原图保护 closeOriginProtect': closeOriginProtect,
  '查询海报合成任务 describePosterProductionJob': describePosterProductionJob,
  '批量拉取海报合成任务 describePosterProductionJobList': describePosterProductionJobList,
  '取消海报合成任务 cancelPosterProductionJob': cancelPosterProductionJob,
  '提交海报合成任务 postPosterProductionJob': postPosterProductionJob,
  '查询海报合成模板 describePosterProductionTemplate': describePosterProductionTemplate,
  '查询海报合成模板列表 describePosterProductionTemplateList': describePosterProductionTemplateList,
  '删除海报合成模板 deletePosterProductionTemplate': deletePosterProductionTemplate,
  '上传海报合成模板 uploadPosterProductionTemplate': uploadPosterProductionTemplate,
  '开通 Guetzli 压缩 openImageGuetzli': openImageGuetzli,
  '查询 Guetzli 压缩 describeImageGuetzli': describeImageGuetzli,
  '关闭 Guetzli 压缩 closeImageGuetzli': closeImageGuetzli,
  '提交图片处理任务 createImageProcessJob': createImageProcessJob,
  '创建图片处理模板 createImageProcessTemplate': createImageProcessTemplate,
  '更新图片处理模板 updateImageProcessTemplate': updateImageProcessTemplate,
  '新增图片样式 addImageStyle': addImageStyle,
  '查询图片样式 describeImageStyles': describeImageStyles,
  '删除图片样式 deleteImageStyles': deleteImageStyles,
  '异常图片检测同步请求 imageInspectSync': imageInspectSync,
  '创建异常图片检测任务 createImageInspectJob': createImageInspectJob,
  '开通图片处理异步服务 openImageProcessService': openImageProcessService,
  '查询图片处理异步服务 describeImageProcessService': describeImageProcessService,
  '关闭图片处理异步服务 closeImageProcessService': closeImageProcessService,
  '查询图片处理异步队列 describeImageProcessQueue': describeImageProcessQueue,
  '更新图片处理异步队列 updateImageProcessQueue': updateImageProcessQueue,
  '开通极智压缩 openImageSlim': openImageSlim,
  '查询极智压缩状态 describeImageSlim': describeImageSlim,
  '关闭极智压缩 closeImageSlim': closeImageSlim,
  '通过API使用极智压缩 imageSlim': imageSlim,
  '获取原图 getOriginImage': getOriginImage,
  'uploadImgAnimate 上传时合成动图': uploadImgAnimate,
  'requestImgAnimate 对云上数据进行合成动图': requestImgAnimate,
  'getImgAnimate 下载时使用合成动图': getImgAnimate,
  'uploadImgWatermark 上传时使用图片水印': uploadImgWatermark,
  'requestImgWatermark 对云上数据使用图片水印': requestImgWatermark,
  'getImgWatermark 下载时使用图片水印': getImgWatermark,
  'uploadImgWatermarkText 上传时使用文字水印': uploadImgWatermarkText,
  'requestImgWatermarkText 对云上数据使用文字水印': requestImgWatermarkText,
  'getImgWatermarkText 下载时使用文字水印': getImgWatermarkText,
  'uploadImgCompress 上传时使用图片压缩': uploadImgCompress,
  'requestImgCompress 对云上数据使用图片压缩': requestImgCompress,
  'getImgCompress 下载时使用图片压缩': getImgCompress,
};
function uploadImg() {
  wx.chooseMedia({
    count: 1, // 默认9
    mediaType: ['image', 'video'],
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: function (res) {
      const file = res.tempFiles[0];
      const filePath = file.tempFilePath;
      const filename = filePath.substr(filePath.lastIndexOf('/') + 1);
      cos.uploadFile(
        {
          Bucket: config.Bucket, // Bucket 格式：test-1250000000
          Region: config.Region,
          Key: filename,
          FilePath: filePath,
          Headers: {
            // 通过 imageMogr2 接口使用图片缩放功能：指定图片宽度为 200，宽度等比压缩
            'Pic-Operations':
              '{"is_pic_info": 1, "rules": [{"fileid": "desample_photo.jpg", "rule": "imageMogr2/thumbnail/200x/"}]}',
          },
        },
        requestCallback
      );
    },
    fail: (err) => console.error(err),
  });
}

function requestImg() {
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
    requestCallback
  );
}

function getImg() {
  cos.getObject(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Key: '1.png',
      QueryString: `imageMogr2/thumbnail/200x/`,
    },
    requestCallback
  );
}

function getObjectUrlWithPicProcess() {
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
    }
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
    }
  );
}

function openOriginProtect() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const host = config.Bucket + '.pic.' + config.Region + '.myqcloud.com/?origin-protect';
  const url = 'https://' + host;
  cos.request(
    {
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
    }
  );
}

function describeOriginProtect() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const host = config.Bucket + '.pic.' + config.Region + '.myqcloud.com/?origin-protect';
  const url = 'https://' + host;
  cos.request(
    {
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
    }
  );
}

function closeOriginProtect() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const host = config.Bucket + '.pic.' + config.Region + '.myqcloud.com/?origin-protect';
  const url = 'https://' + host;
  cos.request(
    {
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
    }
  );
}

function describePosterProductionJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const jobId = 'xxx';
  const key = `pic_jobs/${jobId}`; // jobId:{jobId};
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
    }
  );
}

function describePosterProductionJobList() {
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
        queueId: 'xxx',
        // 任务的 Tag;是否必传：是
        tag: 'PosterProduction',
        // 触发该任务的工作流ID;是否必传：否
        workflowId: '',
        // 触发该任务的存量触发任务ID;是否必传：否
        inventoryTriggerJobId: '',
        // 该任务的输入文件名，暂仅支持精确匹配;是否必传：否
        inputObject: '',
        // Desc 或者 Asc。默认为 Desc;是否必传：否
        orderByTime: 'Desc',
        // 请求的上下文，用于翻页。上次返回的值;是否必传：否
        nextToken: '',
        // 拉取该状态的任务，以,分割，支持多状态：All、Submitted、Running、Success、Failed、Pause、Cancel。默认为 All;是否必传：否
        states: 'All',
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
    }
  );
}

function cancelPosterProductionJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const jobId = 'xxx';
  const key = `jobs/${jobId}?cancel`; // jobId:{jobId};
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
    }
  );
}

function postPosterProductionJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `pic_jobs`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 创建任务的 Tag：PicProcess;是否必传：是
      Tag: 'PosterProduction',
      // 待操作的媒体信息;是否必传：是
      Input: {
        // 媒体文件名;是否必传：是
        Object: '1.jpeg ',
      },
      // 操作规则;是否必传：是
      Operation: {
        // 指定该任务的参数;是否必传：否
        PosterProduction: {
          // ;是否必传：是
          TemplateId: 'xxx',
          Info: {
            main: 'https://examplebucket-1250000000.cos.ap-guangzhou.myqcloud.com/1.jpeg',
            text_main: 'demo',
          },
        },
        // 结果输出地址;是否必传：是
        Output: {
          // 存储桶的地域;是否必传：是
          Region: config.Region,
          // 存储结果的存储桶;是否必传：是
          Bucket: config.Bucket,
          // 结果文件的名字;是否必传：是
          Object: 'test.jpg',
        },
        // 透传用户信息, 可打印的 ASCII 码, 长度不超过1024;是否必传：否
        UserData: '',
        // 任务优先级，级别限制：0 、1 、2 。级别越大任务优先级越高，默认为0;是否必传：否
        JobLevel: '0',
      },
      // 任务所在的队列 ID;是否必传：否
      QueueId: '',
      // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式;是否必传：否
      CallBackFormat: '',
      // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型;是否必传：否
      CallBackType: 'Url',
      // 任务回调地址，优先级高于队列的回调地址。设置为 no 时，表示队列的回调地址不产生回调;是否必传：否
      CallBack: '',
    },
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
    }
  );
}

function describePosterProductionTemplate() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const TemplateId = 'xxx';
  const key = `posterproduction/template/${TemplateId}`; // TemplateId:{TemplateId};
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
    }
  );
}

function describePosterProductionTemplateList() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `posterproduction/template`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'GET', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Query: {
        // 模板分类ID，支持传入多个，以,符号分割字符串;是否必传：否
        categoryIds: '',
        // Official(系统预设模板)，Custom(自定义模板)，All(所有模板)，默认值: Custom;是否必传：否
        type: 'Custom',
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
    }
  );
}

function deletePosterProductionTemplate() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const TemplateId = 'xxx';
  const key = `posterproduction/template/${TemplateId}`; // TemplateId:{TemplateId};
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
    }
  );
}

function uploadPosterProductionTemplate() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `posterproduction/template`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 输入参数;是否必传：否
      Input: {
        // COS 桶中 PSD 文件，大小限制100M;是否必传：是
        Object: 'test.psd',
      },
      // 模板名称;是否必传：是
      Name: 'test',
      // 模板分类 ID，支持传入多个，以 , 符号分割字符串;是否必传：否
      CategoryIds: '',
    },
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
    }
  );
}

function openImageGuetzli() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = ``; //
  const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'PUT', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Action: 'guetzli', // 固定值
    },
    function (err, data) {
      if (err) {
        // 处理请求失败
        console.log(err);
      } else {
        // 处理请求成功
        console.log(data.Response);
      }
    }
  );
}

function describeImageGuetzli() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = ``; //
  const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'GET', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Action: 'guetzli', // 固定值
    },
    function (err, data) {
      if (err) {
        // 处理请求失败
        console.log(err);
      } else {
        // 处理请求成功
        console.log(data.Response);
      }
    }
  );
}

function closeImageGuetzli() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = ``; //
  const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'DELETE', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Action: 'guetzli', // 固定值
    },
    function (err, data) {
      if (err) {
        // 处理请求失败
        console.log(err);
      } else {
        // 处理请求成功
        console.log(data.Response);
      }
    }
  );
}

function createImageProcessJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `jobs`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 创建任务的 Tag：PicProcess;是否必传：是
      Tag: 'PicProcess',
      // 待操作的文件信息;是否必传：是
      Input: {
        // 文件路径;是否必传：是
        Object: '1.jpeg',
      },
      // 操作规则;是否必传：是
      Operation: {
        // 图片处理模板 ID;是否必传：否
        TemplateId: 'xxx',
        // 结果输出配置;是否必传：是
        Output: {
          // 存储桶的地域;是否必传：是
          Region: config.Region,
          // 存储结果的存储桶;是否必传：是
          Bucket: config.Bucket,
          // 结果文件的名字;是否必传：是
          Object: 'output/1.jpeg',
        },
        // 透传用户信息，可打印的 ASCII 码，长度不超过1024;是否必传：否
        UserData: '',
        // 任务优先级，级别限制：0 、1 、2 。级别越大任务优先级越高，默认为0;是否必传：否
        JobLevel: '0',
      },
      // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式;是否必传：否
      CallBackFormat: '',
      // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型;是否必传：否
      CallBackType: 'Url',
      // 任务回调地址，优先级高于队列的回调地址。设置为 no 时，表示队列的回调地址不产生回调;是否必传：否
      CallBack: '',
    },
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
    }
  );
}

function createImageProcessTemplate() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `template`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 模板类型：PicProcess;是否必传：是
      Tag: 'PicProcess',
      // 模板名称，仅支持中文、英文、数字、_、-和*，长度不超过 64;是否必传：是
      Name: 'test',
      // 图片处理参数;是否必传：是
      PicProcess: {
        // 是否返回原图信息，取值 true/false;是否必传：否
        IsPicInfo: '',
        // 图片处理规则基础图片处理参见 基础图片处理文档图片压缩参见 图片压缩 文档盲水印参见 盲水印 文档;是否必传：是
        ProcessRule: 'imageMogr2/rotate/9',
      },
    },
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
    }
  );
}

function updateImageProcessTemplate() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const TemplateId = 'xxx';
  const key = `template/${TemplateId}`; // TemplateId:{TemplateId};
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 模板类型：PicProcess;是否必传：是
      Tag: 'PicProcess',
      // 模板名称，仅支持中文、英文、数字、_、-和*，长度不超过 64;是否必传：是
      Name: 'test',
      // 图片处理参数;是否必传：是
      PicProcess: {
        // 是否返回原图信息，取值 true/false;是否必传：否
        IsPicInfo: '',
        // 图片处理规则基础图片处理参见 基础图片处理文档图片压缩参见 图片压缩 文档盲水印参见 盲水印 文档;是否必传：是
        ProcessRule: 'imageMogr2/rotate/99',
      },
    },
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
    }
  );
}

function addImageStyle() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const key = ``; //
  const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    AddStyle: {
      // 样式名称;是否必传：是
      StyleName: 'test',
      // 样式详情;是否必传：是
      StyleBody: 'imageMogr2/thumbnail/!50px',
    },
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
    }
  );
}

function describeImageStyles() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const key = ``; //
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
          StyleName: 'test',
        },
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
    }
  );
}

function deleteImageStyles() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const key = ``; //
  const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    DeleteStyle: {
      // 样式名称;是否必传：是
      StyleName: 'test',
    },
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
    }
  );
}

function imageInspectSync() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const ObjectKey = 'test.jpg';
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
        'ci-process': 'ImageInspect',
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
    }
  );
}

function createImageInspectJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const key = `jobs`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 创建任务的 Tag：ImageInspect;是否必传：是
      Tag: 'ImageInspect',
      // 待操作的文件信息;是否必传：是
      Input: {
        // 文件路径;是否必传：是
        Object: 'test.jpg',
      },
      // 操作规则;是否必传：否
      Operation: {
        // 透传用户信息，可打印的 ASCII 码，长度不超过1024;是否必传：否
        UserData: '',
        // 任务优先级，级别限制：0 、1 、2 。级别越大任务优先级越高，默认为0;是否必传：否
        JobLevel: '0',
        // 该任务的参数;是否必传：否
        ImageInspect: {
          // 是否开启识别到图片异常后自动对图片进行如移动到其他目录、设置为私有权限、删除等动作。取值：true/false，默认为false;是否必传：否
          AutoProcess: '',
          // 指定检测到异常图片后的处理动作BackupObject：将图片移动 abnormal_images_backup下，该目录由后台自动创建SwitchObjectToPrivate：将图片权限设置为私有DeleteObject：删除图片默认值：BackupObject当 AutoProcess 为 true 时，该参数生效;是否必传：否
          ProcessType: '',
        },
      },
      // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式;是否必传：否
      CallBackFormat: '',
      // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型;是否必传：否
      CallBackType: 'Url',
      // 任务回调地址，优先级高于队列的回调地址。设置为 no 时，表示队列的回调地址不产生回调;是否必传：否
      CallBack: '',
    },
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
    }
  );
}

function openImageProcessService() {
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
    }
  );
}

function describeImageProcessService() {
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
        regions: '',
        // 存储桶名称，以“,”分隔，支持多个存储桶，精确搜索;是否必传：否
        bucketNames: '',
        // 存储桶名称前缀，前缀搜索;是否必传：否
        bucketName: 'test',
        // 第几页;是否必传：否
        pageNumber: '',
        // 每页个数;是否必传：否
        pageSize: '',
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
    }
  );
}

function closeImageProcessService() {
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
    }
  );
}

function describeImageProcessQueue() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const key = `picqueue`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'GET', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Query: {
        // 队列 ID，以“,”符号分割字符串;是否必传：否
        queueIds: '',
        // Active 表示队列内的作业会被调度执行Paused 表示队列暂停，作业不再会被调度执行，队列内的所有作业状态维持在暂停状态，已经执行中的任务不受影响;是否必传：否
        state: 'Active',
        // 第几页，默认值1;是否必传：否
        pageNumber: '',
        // 每页个数，默认值10;是否必传：否
        pageSize: '',
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
    }
  );
}

function updateImageProcessQueue() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const queueId = 'xxx';
  const key = `picqueue/${queueId}`; // queueId:{queueId};
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 队列名称，仅支持中文、英文、数字、_、-和*，长度不超过 128;是否必传：是
      Name: 'xxx',
      // Active 表示队列内的作业会被调度执行Paused 表示队列暂停，作业不再会被调度执行，队列内的所有作业状态维持在暂停状态，已经执行中的任务不受影响;是否必传：是
      State: 'Active',
      // 回调配置;是否必传：是
      NotifyConfig: {
        // 回调开关OffOn;是否必传：否
        State: 'Off',
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
    },
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
    }
  );
}

function openImageSlim() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const key = ``; //
  const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    // 极智压缩配置信息
    ImageSlim: {
      // 极智压缩的使用模式，包含两种：API：开通极智压缩的 API 使用方式，开通后可在图片下载时通过极智压缩参数对图片进行压缩；Auto：开通极智压缩的自动使用方式，开通后无需携带任何参数，存储桶内指定格式的图片将在访问时自动进行极智压缩。注意：支持同时开通两种模式，多个值通过逗号分隔。
      SlimMode: 'Auto,API',
      // 当SlimMode的值包含Auto时生效，用于指定需要自动进行压缩的图片格式。
      Suffixs: {
        // 需要自动进行压缩的图片格式，可选值：jpg、png。
        Suffix: 'jpg',
      },
    },
  });
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
    }
  );
}

function describeImageSlim() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const key = ``; //
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
    }
  );
}

function closeImageSlim() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const key = ``; //
  const host = `${config.Bucket}.pic.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'DELETE', // 固定值，必须
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
    }
  );
}

function imageSlim() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const ObjectKey = 'test.jpeg';
  const key = `${ObjectKey}`; // ObjectKey:{ObjectKey};
  const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'GET', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Action: 'imageSlim', // 固定值
    },
    function (err, data) {
      if (err) {
        // 处理请求失败
        console.log(err);
      } else {
        // 处理请求成功
        console.log(data.Response);
      }
    }
  );
}

function getOriginImage() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/
  const ObjectKey = 'test.jpg';
  const key = `${ObjectKey}`; // ObjectKey:{ObjectKey};
  const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'GET', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Query: {
        // 万象通用参数，需要获取原图的时，该参数固定为：originImage;是否必传：是
        'ci-process': 'originImage',
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
    }
  );
}

function uploadImgAnimate() {
  wx.chooseMedia({
    count: 1,
    mediaType: ['image', 'video'],
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: function (res) {
      const file = res.tempFiles[0];
      const filePath = file.tempFilePath;
      const filename = filePath.substr(filePath.lastIndexOf('/') + 1);
      wxfs.readFile({
        filePath: filePath,
        success: function (res) {
          cos.putObject(
            {
              Bucket: config.Bucket, // Bucket 格式：test-1250000000
              Region: config.Region,
              Key: filename,
              Body: res.data,
              Headers: {
                'Pic-Operations':
                  '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject", "rule": "imageMogr2/animate/duration/10/images/<imageurl1>"}]}',
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

function requestImgAnimate() {
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
    requestCallback
  );
}

function getImgAnimate() {
  cos.getObject(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Key: '1.png',
      QueryString: `imageMogr2/animate/duration/10/images/<imageurl1>`,
    },
    requestCallback
  );
}

function uploadImgWatermark() {
  wx.chooseMedia({
    count: 1,
    mediaType: ['image', 'video'],
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: function (res) {
      const file = res.tempFiles[0];
      const filePath = file.tempFilePath;
      const filename = filePath.substr(filePath.lastIndexOf('/') + 1);
      wxfs.readFile({
        filePath: filePath,
        success: function (res) {
          cos.putObject(
            {
              Bucket: config.Bucket, // Bucket 格式：test-1250000000
              Region: config.Region,
              Key: filename,
              Body: res.data,
              Headers: {
                'Pic-Operations':
                  '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject", "rule": "watermark/1/image/<encodedURL>/gravity/SouthEast/dx/10/dy/10/blogo/1"}]}',
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

function requestImgWatermark() {
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
    requestCallback
  );
}

function getImgWatermark() {
  cos.getObject(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Key: 'test.jpg',
      QueryString: `watermark/1/image/<encodedURL>/gravity/SouthEast/dx/10/dy/10/blogo/1`,
    },
    requestCallback
  );
}

function uploadImgWatermarkText() {
  wx.chooseMedia({
    count: 1,
    mediaType: ['image', 'video'],
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: function (res) {
      const file = res.tempFiles[0];
      const filePath = file.tempFilePath;
      const filename = filePath.substr(filePath.lastIndexOf('/') + 1);
      wxfs.readFile({
        filePath: filePath,
        success: function (res) {
          cos.putObject(
            {
              Bucket: config.Bucket, // Bucket 格式：test-1250000000
              Region: config.Region,
              Key: filename,
              Body: res.data,
              Headers: {
                'Pic-Operations':
                  '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject", "rule": "watermark/2/text/5paH5a2X5rC05Y2w5rWL6K-V/fontsize/16/dissolve/100/gravity/SouthEast/dx/10/dy/10/batch/1/degree/45/shadow/50"}]}',
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

function requestImgWatermarkText() {
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
    requestCallback
  );
}

function getImgWatermarkText() {
  cos.getObject(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Key: 'test.jpg',
      QueryString: `watermark/2/text/5paH5a2X5rC05Y2w5rWL6K-V/fontsize/16/dissolve/100/gravity/SouthEast/dx/10/dy/10/batch/1/degree/45/shadow/50`,
    },
    requestCallback
  );
}

function uploadImgCompress() {
  wx.chooseMedia({
    count: 1,
    mediaType: ['image', 'video'],
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: function (res) {
      const file = res.tempFiles[0];
      const filePath = file.tempFilePath;
      const filename = filePath.substr(filePath.lastIndexOf('/') + 1);
      wxfs.readFile({
        filePath: filePath,
        success: function (res) {
          cos.putObject(
            {
              Bucket: config.Bucket, // Bucket 格式：test-1250000000
              Region: config.Region,
              Key: filename,
              Body: res.data,
              Headers: {
                // 通过 imageMogr2 接口进行 webp 压缩，可以根据需要压缩的类型填入不同的压缩格式：webp/heif/tpg/avif/svgc
                'Pic-Operations':
                  '{"is_pic_info": 1, "rules": [{"fileid": "exampleobject.jpg", "rule": "imageMogr2/format/webp"}]}',
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

function requestImgCompress() {
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
    requestCallback
  );
}

function getImgCompress() {
  cos.getObject(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Key: 'test.jpg',
      QueryString: `imageMogr2/format/webp`, // 通过 imageMogr2 接口进行 webp 压缩，可以根据需要压缩的类型填入不同的压缩格式：webp/heif/tpg/avif/svgc
    },
    requestCallback
  );
}

module.exports = picProcessDao;
