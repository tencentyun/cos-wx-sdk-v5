const COS = require('../lib/cos-wx-sdk-v5');
const config = require('../config');
const { cos, requestCallback } = require('../tools');

const asrDao = {
  '提交音频降噪任务 postNoiseReduction': postNoiseReduction,
  '提交人声分离任务 postVoiceSeparate': postVoiceSeparate,
  '提交语音合成任务 postTts': postTts,
  '提交语音识别任务 postSpeechRecognition': postSpeechRecognition,
  '查询语音识别队列 getAsrQueue': getAsrQueue,
  '更新语音识别队列 putAsrQueue': putAsrQueue,
  '查询语音识别开通状态 getAsrBucket': getAsrBucket,
};

function postNoiseReduction() {
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
    }
  );
}

function postVoiceSeparate() {
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
    }
  );
}

function postTts() {
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
    }
  );
}

function postSpeechRecognition() {
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
    }
  );
}

function getAsrQueue() {
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
    }
  );
}

function putAsrQueue() {
  // 任务所在的队列 ID，请使用查询队列(https://cloud.tencent.com/document/product/460/46234)获取或前往万象控制台(https://cloud.tencent.com/document/product/460/46487)在存储桶中查询
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
    }
  );
}

function getAsrBucket() {
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
    }
  );
}

module.exports = asrDao;
