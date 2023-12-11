const COS = require('../lib/cos-wx-sdk-v5');
var wxfs = wx.getFileSystemManager();
const config = require('../config');
const { cos, requestCallback } = require('../tools');

const fileProcessDao = {
  '开通文件处理服务 openFileProcessService': openFileProcessService,
  '查询文件处理服务 describeFileProcessService': describeFileProcessService,
  '关闭文件处理服务 closeFileProcessService': closeFileProcessService,
  '查询文件处理队列 describeFileProcessQueue': describeFileProcessQueue,
  '更新文件处理队列 updateFileProcessQueue': updateFileProcessQueue,
  '哈希值计算同步请求 fileHash': fileHash,
  '提交哈希值计算任务 createFileHashJob': createFileHashJob,
  '查询哈希值计算结果 describeFileHashJob': describeFileHashJob,
  '提交多文件打包压缩任务 createFileCompressJob': createFileCompressJob,
  '查询多文件打包压缩结果 describeFileCompressJob': describeFileCompressJob,
  '压缩包预览 zipPreview': zipPreview,
  '提交文件解压任务 createFileUnCompressJob': createFileUnCompressJob,
  '查询文件解压结果 describeFileUnCompressJob': describeFileUnCompressJob,
};

function openFileProcessService() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `file_bucket`; //
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

function describeFileProcessService() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `file_bucket`; //
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

function closeFileProcessService() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `file_bucket`; //
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

function describeFileProcessQueue() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `file_queue`; //
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

function updateFileProcessQueue() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const queueId = 'xxx';
  const key = `file_queue/${queueId}`; // queueId:{queueId};
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
        Event: 'TaskFinish',
        // 回调格式XMLJSON;是否必传：否
        ResultFormat: '',
        // 回调类型UrlTDMQ;是否必传：否
        Type: 'Url',
        // 回调地址，不能为内网地址。;是否必传：否
        Url: '',
        // TDMQ 使用模式Topic：主题订阅Queue: 队列服务;是否必传：否
        MqMode: '',
        // TDMQ 所属园区，目前支持园区 sh（上海）、bj（北京）、gz（广州）、cd（成都）、hk（中国香港）;是否必传：否
        MqRegion: '',
        // TDMQ 主题名称;是否必传：否
        MqName: '',
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

function fileHash() {
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
        // 操作类型，哈希值计算固定为：filehash;是否必传：是
        'ci-process': 'filehash',
        // 支持的哈希算法类型，有效值：md5、sha1、sha256;是否必传：是
        type: 'md5',
        // 是否将计算得到的哈希值，自动添加至文件的自定义header，格式为：x-cos-meta-md5/sha1/sha256；有效值： true、false，不填则默认为false;是否必传：否
        addtoheader: '',
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

function createFileHashJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `jobs`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 表示任务的类型，哈希值计算默认为：FileHashCode。;是否必传：是
      Tag: 'FileHashCode',
      // 包含待操作的文件信息。;是否必传：是
      Input: {
        // 文件名，取值为文件在当前存储桶中的完整名称。;是否必传：是
        Object: 'test.docx',
      },
      // 包含哈希值计算的处理规则。;是否必传：是
      Operation: {
        // 指定哈希值计算的处理规则。;是否必传：是
        FileHashCodeConfig: {
          // 哈希值的算法类型，支持：MD5、SHA1、SHA256;是否必传：是
          Type: 'MD5',
          // 是否将计算得到的哈希值添加至文件自定义header，有效值：true、false，默认值为 false。自定义header根据Type的值变化，例如Type值为MD5时，自定义header为 x-cos-meta-md5。;是否必传：否
          AddToHeader: '',
        },
        // 透传用户信息, 可打印的 ASCII 码，长度不超过1024。;是否必传：否
        UserData: '',
      },
      // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式。;是否必传：否
      CallBackFormat: '',
      // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型。;是否必传：否
      CallBackType: 'Url',
      // 任务回调的地址，优先级高于队列的回调地址。;是否必传：否
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

function describeFileHashJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const jobId = 'xxx';
  const key = `file_jobs/${jobId}`; // jobId:{jobId};
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

function createFileCompressJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `jobs`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 表示任务的类型，多文件打包压缩默认为：FileCompress。;是否必传：是
      Tag: 'FileCompress',
      // 包含文件打包压缩的处理规则。;是否必传：是
      Operation: {
        // 指定文件打包压缩的处理规则。;是否必传：是
        FileCompressConfig: {
          // 文件打包时，是否需要去除源文件已有的目录结构，有效值：0：不需要去除目录结构，打包后压缩包中的文件会保留原有的目录结构；1：需要，打包后压缩包内的文件会去除原有的目录结构，所有文件都在同一层级。例如：源文�� URL 为 https://domain/source/test.mp4，则源文件路径为 source/test.mp4，如果为 1，则 ZIP 包中该文件路径为 test.mp4；如果为0， ZIP 包中该文件路径为 source/test.mp4。;是否必传：是
          Flatten: '0',
          // 打包压缩的类型，有效值：zip、tar、tar.gz。;是否必传：是
          Format: 'zip',
          // 压缩类型，仅在Format为tar.gz或zip时有效。faster：压缩速度较快better：压缩质量较高，体积较小default：适中的压缩方式默认值为default;是否必传：否
          Type: '',
          // 压缩包密钥，传入时需先经过 base64 编码，编码后长度不能超过128。当 Format 为 zip 时生效。;是否必传：否
          CompressKey: '',
          // 支持将需要打包的文件整理成索引文件，后台将根据索引文件内提供的文件 url，打包为一个压缩包文件。索引文件需要保存在当前存储桶中，本字段需要提供索引文件的对象地址，例如：/test/index.csv。索引文件格式：仅支持 CSV 文件，一行一条 URL（仅支持本存储桶文件），如有多列字段，默认取第一列作为URL。最多不超过10000个文件, 总大小不超过50G，否则会导致任务失败。;是否必传：否
          UrlList: '',
          // 支持对存储桶中的某个前缀进行打包，如果需要对某个目录进行打包，需要加/，例如test目录打包，则值为：test/。最多不超过10000个文件，总大小不超过50G，否则会导致任务失败。;是否必传：否
          Prefix: 'example/',
          // 支持对存储桶中的多个文件进行打包，个数不能超过 1000，总大小不超过50G，否则会导致任务失败。;是否必传：否
          Key: '',
        },
        // 透传用户信息，可打印的 ASCII 码，长度不超过1024。;是否必传：否
        UserData: '',
        // 指定打包压缩后的文件保存的地址信息。;是否必传：是
        Output: {
          // 存储桶的地域。;是否必传：是
          Region: config.Region,
          // 保存压缩后文件的存储桶。;是否必传：是
          Bucket: config.Bucket,
          // 压缩后文件的文件名;是否必传：是
          Object: 'test.zip',
        },
      },
      // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式。;是否必传：否
      CallBackFormat: '',
      // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型。;是否必传：否
      CallBackType: 'Url',
      // 任务回调的地址，优先级高于队列的回调地址。;是否必传：否
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

function describeFileCompressJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const jobId = 'xxx';
  const key = `file_jobs/${jobId}`; // jobId:{jobId};
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

function zipPreview() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `test.zip`; //
  const host = `${config.Bucket}.cos.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;

  cos.request(
    {
      Method: 'GET', // 固定值，必须
      Key: key, // 必须
      Url: url, // 请求的url，必须
      Query: {
        'ci-process': 'zippreview', // 操作类型，压缩包预览计算固定为：zippreview，必须
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

function createFileUnCompressJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const key = `jobs`; //
  const host = `${config.Bucket}.ci.${config.Region}.myqcloud.com`;
  const url = `https://${host}/${key}`;
  const body = COS.util.json2xml({
    Request: {
      // 表示任务的类型，文件解压默认为：FileUncompress。;是否必传：是
      Tag: 'FileUncompress',
      // 包含待操作的文件信息。;是否必传：是
      Input: {
        // 文件名，取值为文件在当前存储桶中的完整名称。;是否必传：是
        Object: 'test.zip',
      },
      // 包含文件解压的处理规则。;是否必传：是
      Operation: {
        // 指定文件解压的处理规则。;是否必传：是
        FileUncompressConfig: {
          // 指定解压后输出文件的前缀，不填则默认保存在存储桶根路径。;是否必传：否
          Prefix: 'output/',
          // 解压密钥，传入时需先经过 base64 编码。;是否必传：否
          UnCompressKey: '',
          // 指定解压后的文件路径是否需要替换前缀，有效值：0：不添加额外的前缀，解压缩将保存在Prefix指定的路径下（不会保留压缩包的名称，仅将压缩包内的文件保存至指定的路径）1：以压缩包本身的名称作为前缀，解压缩将保存在Prefix指定的路径下2：以压缩包完整路径作为前缀，此时如果不指定Prefix，就是解压到压缩包所在的当前路径（包含压缩包本身名称）默认值为0。;是否必传：否
          PrefixReplaced: '',
        },
        // 透传用户信息，可打印的 ASCII 码，长度不超过1024。;是否必传：否
        UserData: '',
        // 指定解压后的文件保存的存储桶信息。;是否必传：是
        Output: {
          // 存储桶的地域。;是否必传：是
          Region: config.Region,
          // 保存解压后文件的存储桶。;是否必传：是
          Bucket: config.Bucket,
        },
      },
      // 任务回调格式，JSON 或 XML，默认 XML，优先级高于队列的回调格式。;是否必传：否
      CallBackFormat: '',
      // 任务回调类型，Url 或 TDMQ，默认 Url，优先级高于队列的回调类型。;是否必传：否
      CallBackType: 'Url',
      // 任务回调的地址，优先级高于队列的回调地址。;是否必传：否
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

function describeFileUnCompressJob() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const jobId = 'xxx';
  const key = `file_jobs/${jobId}`; // jobId:{jobId};
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

module.exports = fileProcessDao;
