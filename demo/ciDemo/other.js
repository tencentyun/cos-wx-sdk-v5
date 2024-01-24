const COS = require('../lib/cos-wx-sdk-v5');
var wxfs = wx.getFileSystemManager();
const config = require('../config');
const { cos, requestCallback } = require('../tools');

const otherDao = {
  '提交病毒检测任务 postVirusDetect': postVirusDetect,
  '查询病毒检测任务结果 getVirusDetectResult': getVirusDetectResult,
  '查询防盗链 describeRefer': describeRefer,
  '设置防盗链 setRefer': setRefer,
};

function postVirusDetect() {
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/virus/detect';
  var url = 'https://' + host;
  var body = COS.util.json2xml({
    Request: {
      Input: {
        Object: 'test/1.png', // 文件名，取值为文件在当前存储桶中的完整名称，与Url参数二选一
        // Url: 'http://examplebucket-1250000000.cos.ap-shanghai.myqcloud.com/virus.doc', // 病毒文件的链接地址，与Object参数二选一
      },
      Conf: {
        DetectType: 'Virus', // 检测的病毒类型，当前固定为：Virus
        // CallBack: 'http://callback.demo.com', // 任务回调的地址
      },
    },
  });
  cos.request(
    {
      Method: 'POST',
      Key: 'virus/detect',
      Url: url,
      Body: body,
      ContentType: 'application/xml',
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function getVirusDetectResult() {
  var jobId = 'ss5a8d3065bd9011eda1445254009dadxx'; // 提交病毒检测任务后会返回当前任务的jobId
  var host = config.Bucket + '.ci.' + config.Region + '.myqcloud.com/virus/detect/' + jobId;
  var url = 'https://' + host;
  cos.request(
    {
      Method: 'GET',
      Key: 'virus/detect/' + jobId,
      Url: url,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function describeRefer() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const host = config.Bucket + '.pic.' + config.Region + '.myqcloud.com/?hotlink';
  const url = 'https://' + host;
  cos.request(
    {
      Method: 'GET', // 固定值，必须
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

function setRefer() {
  // sdk引入以及初始化请参考：https://cloud.tencent.com/document/product/436/31953
  const host = config.Bucket + '.pic.' + config.Region + '.myqcloud.com/?hotlink';
  const url = 'https://' + host;
  const body = COS.util.json2xml({
    Hotlink: {
      Url: 'https://www.example.com', // 必须，域名地址
      Type: 'white', // 必须，防盗链类型，white 为白名单，black 为黑名单，off 为关闭。
    },
  });
  cos.request(
    {
      Method: 'PUT',
      Url: url,
      Body: body,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

module.exports = otherDao;
