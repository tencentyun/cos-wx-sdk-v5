//index.js
var cosDemoSdk = require('../../demo-sdk');
var ciDemoSdk = require('../../demo-ci');
var postUpload = require('../../demo-post-policy');

var option = {
  data: {
    demoType: 'cos',
    listMap: {},
    title: {
      toolsDao: '工具函数',
      bucketDao: '存储桶操作',
      objectDao: '对象操作',
      advanceObjectDao: '高级操作',
      ciObjectDao: '数据万象示例',
    },
    ciListMap: {},
    ciTitle: {
      asrDao: '智能语音',
      auditDao: '内容审核',
      docPreviewDao: '文档预览',
      picProcessDao: '图片处理',
      mediaProcessDao: '媒体处理',
      fileProcessDao: '文件处理',
      otherDao: '其他',
    },
  },
  switchCosDemo() {
    this.setData({ demoType: 'cos' });
  },
  switchCiDemo() {
    this.setData({ demoType: 'ci' });
  },
};

for (var key in cosDemoSdk) {
  if (cosDemoSdk.hasOwnProperty(key)) {
    var sublist = [];
    var subDemoSdk = cosDemoSdk[key];
    for (var subkey in subDemoSdk) {
      sublist.push(subkey);
      option[subkey] = subDemoSdk[subkey];
    }
    option.data.listMap[key] = sublist;
  }
}

for (var key in ciDemoSdk) {
  if (ciDemoSdk.hasOwnProperty(key)) {
    var sublist = [];
    var subDemoSdk = ciDemoSdk[key];
    for (var subkey in subDemoSdk) {
      sublist.push(subkey);
      option[subkey] = subDemoSdk[subkey];
    }
    option.data.ciListMap[key] = sublist;
  }
}

option.postUpload = postUpload;

//获取应用实例
Page(option);
