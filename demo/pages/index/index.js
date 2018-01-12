//index.js
var demo = require('../../demo');

var option = {
    data: {
        list: []
    },
    getService: function () {

    }
};

for (var key in demo) {
    if (demo.hasOwnProperty(key)) {
        option.data.list.push(key);
        option[key] = demo[key];
    }
}

//获取应用实例
Page(option);
