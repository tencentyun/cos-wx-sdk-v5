const COS = require('../lib/cos-wx-sdk-v5');
const config = require('../config');
const { cos, requestCallback } = require('../tools');

const auditDao = {
  '图片同步审核 getImageAuditing': getImageAuditing,
  '图片批量审核 postImagesAuditing': postImagesAuditing,
  '查询图片审核任务结果 getImageAuditingResult': getImageAuditingResult,
  '提交视频审核任务 postVideoAuditing': postVideoAuditing,
  '查询视频审核任务结果 getVideoAuditingResult': getVideoAuditingResult,
  '提交音频审核任务 postAudioAuditing': postAudioAuditing,
  '查询音频审核任务结果 getAudioAuditingResult': getAudioAuditingResult,
  '提交文本审核任务 postTextAuditing': postTextAuditing,
  '提交直播审核任务 postLiveAuditing': postLiveAuditing,
  '查询直播审核任务结果 getLiveAuditingResult': getLiveAuditingResult,
};

function getImageAuditing() {
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'GET',
      Key: '1.png',
      Query: {
        'ci-process': 'sensitive-content-recognition' /** 固定值，必须 */,
        'biz-type': '' /** 审核类型，非必须 */,
        'detect-url': '' /** 审核任意公网可访问的图片链接，非必须，与Key二选一传递 */,
        interval: 5 /** 审核 GIF 动图时，每隔interval帧截取一帧，非必须 */,
        'max-frames': 5 /** 审核 GIF 动图时，最大截帧数，非必须 */,
        'large-image-detect': '0' /** 是否需要压缩图片后再审核，非必须 */,
      },
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function postImagesAuditing() {
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
  var url = 'https://' + host + '/image/auditing';
  var body = COS.util.json2xml({
    Request: {
      Input: [
        {
          Object: '1.png',
        },
        {
          Object: '6.png',
        },
      ],
      Conf: {
        BizType: '',
      },
    },
  });
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'POST',
      Url: url,
      Key: '/image/auditing',
      ContentType: 'application/xml',
      Body: body,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function getImageAuditingResult() {
  var jobId = 'si8263213daf3711eca0d1525400d88xxx'; // jobId可以通过图片批量审核返回
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
  var url = 'https://' + host + '/image/auditing/' + jobId;
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'GET',
      Key: '/image/auditing/' + jobId,
      Url: url,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function postVideoAuditing() {
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
  var url = 'https://' + host + '/video/auditing';
  var body = COS.util.json2xml({
    Request: {
      Input: {
        Object: '1.mp4',
      },
      Conf: {
        BizType: '',
        Snapshot: {
          Count: 1000, // 视频截帧数量
        },
        DetectContent: 1, // 是否审核视频声音,0-只审核视频不审核声音；1-审核视频+声音
      },
    },
  });
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'POST',
      Url: url,
      Key: '/video/auditing',
      ContentType: 'application/xml',
      Body: body,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function getVideoAuditingResult() {
  var jobId = 'av5bd873d9f39011ecb6c95254009a49da'; // jobId可以通过提交视频审核任务返回
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
  var url = 'https://' + host + '/video/auditing/' + jobId;
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'GET',
      Key: '/video/auditing/' + jobId,
      Url: url,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function postAudioAuditing() {
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
  var url = 'https://' + host + '/audio/auditing';
  var body = COS.util.json2xml({
    Request: {
      Input: {
        Object: '1.mp3',
      },
      Conf: {
        BizType: '',
      },
    },
  });
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'POST',
      Url: url,
      Key: '/audio/auditing',
      ContentType: 'application/xml',
      Body: body,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function getAudioAuditingResult() {
  var jobId = 'sa0c28d41daff411ecb23352540078cxxx'; // jobId可以通过提交音频审核任务返回
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
  var url = 'https://' + host + '/audio/auditing/' + jobId;
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'GET',
      Key: '/audio/auditing/' + jobId,
      Url: url,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function postTextAuditing() {
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
  var url = 'https://' + host + '/text/auditing';
  var body = COS.util.json2xml({
    Request: {
      Input: {
        Content: COS.util.encodeBase64('hello') /* 需要审核的文本内容 */,
      },
      Conf: {
        BizType: '',
      },
    },
  });
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'POST',
      Url: url,
      Key: '/text/auditing' /** 固定值，必须 */,
      ContentType: 'application/xml' /** 固定值，必须 */,
      Body: body,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function postLiveAuditing() {
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
  var url = 'https://' + host + '/video/auditing';
  var body = COS.util.json2xml({
    Request: {
      Type: 'live_video',
      Input: {
        Url: 'rtmp://example.com/live/123', // 需要审核的直播流播放地址
        // DataId: '',
        // UserInfo: {},
      },
      Conf: {
        BizType: '',
        // Callback: 'https://callback.com', // 回调地址，非必须
        // CallbackType: 1, // 回调片段类型，非必须
      },
    },
  });
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'POST',
      Url: url,
      Key: '/video/auditing',
      ContentType: 'application/xml',
      Body: body,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function getLiveAuditingResult() {
  var jobId = 'av2b14a74dbd9011edb05a52540084c0xx'; // jobId可以通过提交直播审核任务返回
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com';
  var url = 'https://' + host + '/video/auditing/' + jobId;
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'GET',
      Key: '/video/auditing/' + jobId,
      Url: url,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

module.exports = auditDao;
