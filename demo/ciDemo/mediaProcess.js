const COS = require('../lib/cos-wx-sdk-v5');
var wxfs = wx.getFileSystemManager();
const config = require('../config');
const { cos, requestCallback } = require('../tools');

const mediaProcessDao = {
  'describeMediaBuckets 查询已经开通数据万象功能的存储桶': describeMediaBuckets,
  'getMediaInfo 获取媒体文件信息': getMediaInfo,
  'getSnapshot 获取媒体文件某个时间的截图': getSnapshot,
};

function describeMediaBuckets() {
  var host = 'ci.' + config.Region + '.myqcloud.com';
  var url = 'https://' + host + '/mediabucket';
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'GET',
      Key: 'mediabucket' /** 固定值，必须 */,
      Url: url,
      Query: {
        pageNumber: '1' /** 第几页，非必须 */,
        pageSize: '10' /** 每页个数，非必须 */,
        // regions: 'ap-chengdu', /** 地域信息，例如'ap-beijing'，支持多个值用逗号分隔如'ap-shanghai,ap-beijing'，非必须 */
        // bucketNames: 'test-1250000000', /** 存储桶名称，精确搜索，例如'test-1250000000'，支持多个值用逗号分隔如'test1-1250000000,test2-1250000000'，非必须 */
        // bucketName: 'test', /** 存储桶名称前缀，前缀搜索，例如'test'，支持多个值用逗号分隔如'test1,test2'，非必须 */
      },
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function getMediaInfo() {
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'GET',
      Key: 'test.mp4',
      Query: {
        'ci-process': 'videoinfo' /** 固定值，必须 */,
      },
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

function getSnapshot() {
  cos.request(
    {
      Bucket: config.Bucket,
      Region: config.Region,
      Method: 'GET',
      Key: 'test.mp4',
      Query: {
        'ci-process': 'snapshot' /** 固定值，必须 */,
        time: 1 /** 截图的时间点，单位为秒，必须 */,
        // width: 0, /** 截图的宽，非必须 */
        // height: 0, /** 截图的高，非必须 */
        // format: 'jpg', /** 截图的格式，支持 jpg 和 png，默认 jpg，非必须 */
        // rotate: 'auto', /** 图片旋转方式，默认为'auto'，非必须 */
        // mode: 'exactframe', /** 截帧方式，默认为'exactframe'，非必须 */
      },
      RawBody: true,
      DataType: 'arraybuffer',
    },
    function (err, data) {
      if (err) {
        console.log(err);
      } else {
        const imgBase64 = wx.arrayBufferToBase64(data.Body);
        console.log(imgBase64);
      }
    }
  );
}

module.exports = mediaProcessDao;
