//index.js
var demoSdk = require('../../demo-sdk');
var simpleUpload = require('../../demo-no-sdk');
var postUpload = require('../../demo-post-policy');

var option = {
    data: {
        list: []
    },
};

for (var key in demoSdk) {
    if (demoSdk.hasOwnProperty(key)) {
        option.data.list.push(key);
        option[key] = demoSdk[key];
    }
}

option.postUpload = postUpload;
option.simpleUpload = simpleUpload;

//获取应用实例
Page(option);
