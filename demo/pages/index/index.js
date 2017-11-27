//index.js
var dao = require('../../common/dao');

var option = {
    data: {
        list: []
    },
    getService: function () {

    }
};

for (var key in dao) {
    if (dao.hasOwnProperty(key)) {
        option.data.list.push(key);
        option[key] = dao[key];
    }
}

//获取应用实例
Page(option);
