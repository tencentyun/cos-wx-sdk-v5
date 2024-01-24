const COS = require('../lib/cos-wx-sdk-v5');
var wxfs = wx.getFileSystemManager();
const config = require('../config');
const { cos, requestCallback } = require('../tools');

const docPreviewDao = {
  '查询文档预览开通状态 describeDocProcessService': describeDocProcessService,
  '文档转html同步请求 getDocHtmlPreviewUrl': getDocHtmlPreviewUrl,
  '文档转码同步请求 getDocPreview': getDocPreview,
  '提交文档转码任务 createDocProcessJob': createDocProcessJob,
  '查询指定文档转码任务 describeDocProcessJob': describeDocProcessJob,
  '拉取符合条件的文档转码任务 describeDocProcessJobList': describeDocProcessJobList,
  '查询文档转码队列 describeDocProcessQueue': describeDocProcessQueue,
  '更新文档转码队列 updateProcessQueue': updateProcessQueue,
};

function describeDocProcessService() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `docbucket`; //
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
        bucketName: '',
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

function getDocHtmlPreviewUrl() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const ObjectKey = 'test.docx';
  const key = `${ObjectKey}`; // ObjectKey:{ObjectKey};
  const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'GET', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Query: {
        // 数据万象处理能力，文档 HTML  预览固定为 doc-preview;是否必传：是
        'ci-process': 'doc-preview',
        // 转换输出目标文件类型，文档 HTML 预览固定为 html（需为小写字母）;是否必传：是
        dstType: 'html',
        // 是否获取预览链接。填入值为1会返回预览链接和Token信息；填入值为2只返回Token信息；不传会直接预览;是否必传：否
        weboffice_url: 1,
        // 指定目标文件类型，支持的文件类型请见下方;是否必传：否
        srcType: '',
        // 对象下载签名，如果预览的对象为私有读时，需要传入签名，详情请参见 请求签名 文档注意：需要进行 urlencode;是否必传：否
        sign: '',
        // 是否可复制。默认为可复制，填入值为1；不可复制，填入值为0;是否必传：否
        copyable: '',
        // 自定义配置参数，json结构，需要经过 URL 安全 的 Base64 编码，默认配置为：{ commonOptions: { isShowTopArea: true, isShowHeader: true, language: "zh" }}，支持的配置参考 自定义配置项说明。htmlParams支持的特殊配置：语言切换，通过 commonOptions 的 language 参数指定预览语言，支持"zh"、"en“，默认为"zh"。;是否必传：否
        htmlParams: '',
        // 水印文字，需要经过 URL 安全 的 Base64 编码，默认为空;是否必传：否
        htmlwaterword: '',
        // 水印 RGBA（颜色和透明度），需要经过 URL 安全 的 Base64 编码，默认为：rgba(192,192,192,0.6);是否必传：否
        htmlfillstyle: '',
        // 水印文字样式，需要经过 URL 安全 的 Base64 编码，默认为：bold 20px Serif;是否必传：否
        htmlfront: '',
        // 水印文字旋转角度，0 - 360，默认315度;是否必传：否
        htmlrotate: '',
        // 水印文字水平间距，单位 px，默认为50;是否必传：否
        htmlhorizontal: '',
        // 水印文字垂直间距，单位 px，默认为100;是否必传：否
        htmlvertical: '',
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

function getDocPreview() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const ObjectKey = 'test.docx';
  const key = `${ObjectKey}`; // ObjectKey:{ObjectKey};
  const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'GET', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Query: {
        // 数据万象处理能力，文档预览固定为 doc-preview;是否必传：是
        'ci-process': 'doc-preview',
        // 源数据的后缀类型，当前文档转换根据 COS 对象的后缀名来确定源数据类型。当 COS 对象没有后缀名时，可以设置该值;是否必传：否
        srcType: '',
        // 需转换的文档页码，默认从1开始计数；表格文件中 page 表示转换的第 X 个 sheet 的第 X 张图;是否必传：否
        page: 0,
        // 转换输出目标文件类型：png，转成 png 格式的图片文件jpg，转成 jpg 格式的图片文件pdf，转成 pdf 格式文件。 无法选择页码，page 参数不生效如果传入的格式未能识别，默认使用 jpg 格式;是否必传：否
        dstType: 'jpg',
        // Office 文档的打开密码，如果需要转换有密码的文档，请设置该字段;是否必传：否
        password: '',
        // 是否隐藏批注和应用修订，默认为00：隐藏批注，应用修订1：显示批注和修订;是否必传：否
        comment: 0,
        // 表格文件参数，转换第 X 个表，默认为1;是否必传：否
        sheet: 0,
        // 表格文件转换纸张方向，0代表垂直方向，非0代表水平方向，默认为0;是否必传：否
        excelPaperDirection: 0,
        // 设置纸张（画布）大小，对应信息为： 0 → A4 、 1 → A2 、 2 → A0 ，默认 A4 纸张 （需配合  excelRow  或  excelCol  一起使用）;是否必传：否
        excelPaperSize: 0,
        // 转换后的图片处理参数，支持 基础图片处理 所有处理参数，多个处理参数可通过 管道操作符 分隔，从而实现在一次访问中按顺序对图片进行不同处理;是否必传：否
        ImageParams: '',
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
    }
  );
}

function createDocProcessJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `doc_jobs`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 创建任务的 Tag，目前仅支持：DocProcess;是否必传：是
      Tag: 'DocProcess',
      // 待操作的文件对象;是否必传：是
      Input: {
        // 文件在 COS 上的文件路径，Bucket 由 Host 指定;是否必传：是
        Object: 'test.docx',
      },
      // 操作规则;是否必传：是
      Operation: {
        // 当 Tag 为 DocProcess 时有效，指定该任务的参数;是否必传：否
        DocProcess: {
          // 源数据的后缀类型，当前文档转换根据 cos 对象的后缀名来确定源数据类型，当 cos 对象没有后缀名时，可以设置该值;是否必传：否
          SrcType: '',
          // 转换输出目标文件类型：jpg，转成 jpg 格式的图片文件；如果传入的格式未能识别，默认使用 jpg 格式png，转成 png 格式的图片文件pdf，转成 pdf 格式文件（暂不支持指定页数）;是否必传：否
          TgtType: '',
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
          ImageParams: '',
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
          Object: '${Number}',
        },
      },
      // 任务所在的队列 ID，开通预览服务后自动生成，请使用 查询队列 获取或前往 万象控制台 在存储桶中查询 ;是否必传：否
      QueueId: '',
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

function describeDocProcessJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const jobId = 'xxx';
  const key = `doc_jobs/${jobId}`; // jobId:{jobId};
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

function describeDocProcessJobList() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `doc_jobs`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  cos.request(
    {
      Method: 'GET', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Query: {
        // 任务的 Tag：DocProcess;是否必传：是
        tag: 'DocProcess',
        // 拉取该队列 ID 下的任务，可在任务响应内容或控制台中获取;是否必传：否
        queueId: '',
        // Desc 或者 Asc。默认为 Desc;是否必传：否
        orderByTime: 'Desc',
        // 请求的上下文，用于翻页。上次返回的值;是否必传：否
        nextToken: '',
        // 拉取该状态的任务，以,分割，支持多状态：All、Submitted、Running、Success、Failed、Pause、Cancel。默认为 All;是否必传：否
        states: 'Success',
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
    }
  );
}

function describeDocProcessQueue() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `docqueue`; //
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
        // 1. Active 表示队列内的作业会被文档预览服务调度执行2. Paused  表示队列暂停，作业不再会被文档预览服务调度执行，队列内的所有作业状态维持在暂停状态，已经处于执行中的任务将继续执行，不受影响;是否必传：否
        state: 'Active',
        // 第几页，默认第一页;是否必传：否
        pageNumber: '',
        // 每页个数，默认10个;是否必传：否
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

function updateProcessQueue() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const queueId = 'xxx';
  const key = `docqueue/${queueId}`;
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 队列名称;是否必传：是
      Name: 'xxx',
      // 队列 ID;是否必传：是
      QueueID: queueId,
      // 队列状态;是否必传：是
      State: 'Active',
      // 通知渠道;是否必传：是
      NotifyConfig: {
        // 回调配置;是否必传：否
        Url: '',
        // 回调类型，普通回调：Url;是否必传：否
        Type: 'Url',
        // 回调事件，文档预览任务完成;是否必传：否
        Event: 'TaskFinish',
        // 回调开关，Off，On;是否必传：否
        State: 'Off',
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

module.exports = docPreviewDao;
