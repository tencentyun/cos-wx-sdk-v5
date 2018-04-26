//index.js
var demoSdk = require('../../demo-sdk');
var demoNoSdk = require('../../demo-no-sdk');

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

option.simpleUpload = demoNoSdk;

//获取应用实例
Page(option);
