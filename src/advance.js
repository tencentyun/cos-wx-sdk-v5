var Async = require('./async');
var EventProxy = require('./event').EventProxy;
var util = require('./util');

// 抛弃分块上传任务
/*
 AsyncLimit (抛弃上传任务的并发量)，
 UploadId (上传任务的编号，当 Level 为 task 时候需要)
 Level (抛弃分块上传任务的级别，task : 抛弃指定的上传任务，file ： 抛弃指定的文件对应的上传任务，其他值 ：抛弃指定Bucket 的全部上传任务)
 */
function abortUploadTask(params, callback) {
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var UploadId = params.UploadId;
    var Level = params.Level || 'task';
    var AsyncLimit = params.AsyncLimit;
    var self = this;

    var ep = new EventProxy();

    ep.on('error', function (errData) {
        return callback(errData);
    });

    // 已经获取到需要抛弃的任务列表
    ep.on('get_abort_array', function (AbortArray) {
        abortUploadTaskArray.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            Headers: params.Headers,
            AsyncLimit: AsyncLimit,
            AbortArray: AbortArray
        }, function (err, data) {
            if (err) {
                return callback(err);
            }
            callback(null, data);
        });
    });

    if (Level === 'bucket') {
        // Bucket 级别的任务抛弃，抛弃该 Bucket 下的全部上传任务
        wholeMultipartList.call(self, {
            Bucket: Bucket,
            Region: Region
        }, function (err, data) {
            if (err) {
                return callback(err);
            }
            ep.emit('get_abort_array', data.UploadList || []);
        });
    } else if (Level === 'file') {
        // 文件级别的任务抛弃，抛弃该文件的全部上传任务
        if (!Key) return callback({error: 'abort_upload_task_no_key'});
        wholeMultipartList.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key
        }, function (err, data) {
            if (err) {
                return callback(err);
            }
            ep.emit('get_abort_array', data.UploadList || []);
        });
    } else if (Level === 'task') {
        // 单个任务级别的任务抛弃，抛弃指定 UploadId 的上传任务
        if (!UploadId) return callback({error: 'abort_upload_task_no_id'});
        if (!Key) return callback({error: 'abort_upload_task_no_key'});
        ep.emit('get_abort_array', [{
            Key: Key,
            UploadId: UploadId
        }]);
    } else {
        return callback({error: 'abort_unknown_level'});
    }
}

// 批量抛弃分块上传任务
function abortUploadTaskArray(params, callback) {

    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var AbortArray = params.AbortArray;
    var AsyncLimit = params.AsyncLimit || 1;
    var self = this;

    var index = 0;
    var resultList = new Array(AbortArray.length);
    Async.eachLimit(AbortArray, AsyncLimit, function (AbortItem, callback) {
        var eachIndex = index;
        if (Key && Key !== AbortItem.Key) {
            resultList[eachIndex] = {error: {KeyNotMatch: true}};
            callback(null);
            return;
        }
        var UploadId = AbortItem.UploadId || AbortItem.UploadID;

        self.multipartAbort({
            Bucket: Bucket,
            Region: Region,
            Key: AbortItem.Key,
            Headers: params.Headers,
            UploadId: UploadId
        }, function (err, data) {
            var task = {
                Bucket: Bucket,
                Region: Region,
                Key: AbortItem.Key,
                UploadId: UploadId
            };
            resultList[eachIndex] = {error: err, task: task};
            callback(null);
        });
        index++;

    }, function (err) {
        if (err) {
            return callback(err);
        }

        var successList = [];
        var errorList = [];

        for (var i = 0, len = resultList.length; i < len; i++) {
            var item = resultList[i];
            if (item['task']) {
                if (item['error']) {
                    errorList.push(item['task']);
                } else {
                    successList.push(item['task']);
                }
            }
        }

        return callback(null, {
            successList: successList,
            errorList: errorList
        });
    });
}

// 获取符合条件的全部上传任务 (条件包括 Bucket, Region, Prefix)
function wholeMultipartList(params, callback) {
    var self = this;
    var UploadList = [];
    var sendParams = {
        Bucket: params.Bucket,
        Region: params.Region,
        Prefix: params.Key
    };
    var next = function () {
        self.multipartList(sendParams, function (err, data) {
            if (err) return callback(err);
            UploadList.push.apply(UploadList, data.Upload || []);
            if (data.IsTruncated == 'true') { // 列表不完整
                sendParams.KeyMarker = data.NextKeyMarker;
                sendParams.UploadIdMarker = data.NextUploadIdMarker;
                next();
            } else {
                callback(null, {UploadList: UploadList});
            }
        });
    };
    next();
}


// 分片复制文件
function sliceCopyFile(params, callback) {
    var ep = new EventProxy();

    var self = this;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var CopySource = params.CopySource;
    var m = CopySource.match(/^([^.]+-\d+)\.cos(v6)?\.([^.]+)\.[^/]+\/(.+)$/);
    if (!m) {
        callback({error: 'CopySource format error'});
        return;
    }

    var SourceBucket = m[1];
    var SourceRegion = m[3];
    var SourceKey = decodeURIComponent(m[4]);
    var CopySliceSize = params.SliceSize === undefined ? self.options.CopySliceSize : params.SliceSize;
    CopySliceSize = Math.max(0, Math.min(CopySliceSize, 5 * 1024 * 1024 * 1024));

    var ChunkSize = params.ChunkSize || this.options.CopyChunkSize;
    var ChunkParallel = this.options.CopyChunkParallelLimit;

    var FinishSize = 0;
    var FileSize;
    var onProgress;

    // 分片复制完成，开始 multipartComplete 操作
    ep.on('copy_slice_complete', function (UploadData) {
        self.multipartComplete({
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            UploadId: UploadData.UploadId,
            Parts: UploadData.PartList,
        },function (err, data) {
            if (err) {
                onProgress(null, true);
                return callback(err);
            }
            onProgress({loaded: FileSize, total: FileSize}, true);
            callback(null, data);
        });
    });

    ep.on('get_copy_data_finish',function (UploadData) {
        Async.eachLimit(UploadData.PartList, ChunkParallel, function (SliceItem, asyncCallback) {
            var PartNumber = SliceItem.PartNumber;
            var CopySourceRange = SliceItem.CopySourceRange;
            var currentSize = SliceItem.end - SliceItem.start;
            var preAddSize = 0;

            copySliceItem.call(self,{
                Bucket: Bucket,
                Region: Region,
                Key: Key,
                CopySource: CopySource,
                UploadId: UploadData.UploadId,
                PartNumber: PartNumber,
                CopySourceRange: CopySourceRange,
                onProgress: function (data) {
                    FinishSize += data.loaded - preAddSize;
                    preAddSize = data.loaded;
                    onProgress({loaded: FinishSize, total: FileSize});
                }
            },function (err,data) {
                if (err) {
                    return asyncCallback(err);
                }
                onProgress({loaded: FinishSize, total: FileSize});

                FinishSize += currentSize - preAddSize;
                SliceItem.ETag = data.ETag;
                asyncCallback(err || null, data);
            });
        }, function (err) {
            if (err) {
                onProgress(null, true);
                return callback(err);
            }

            ep.emit('copy_slice_complete', UploadData);
        });
    });

    ep.on('get_file_size_finish', function (SourceHeaders) {
        // 控制分片大小
        (function () {
            var SIZE = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 1024 * 2, 1024 * 4, 1024 * 5];
            var AutoChunkSize = 1024 * 1024;
            for (var i = 0; i < SIZE.length; i++) {
                AutoChunkSize = SIZE[i] * 1024 * 1024;
                if (FileSize / AutoChunkSize <= self.options.MaxPartNumber) break;
            }
            params.ChunkSize = ChunkSize = Math.max(ChunkSize, AutoChunkSize);

            var ChunkCount = Math.ceil(FileSize / ChunkSize);

            var list = [];
            for (var partNumber = 1; partNumber <= ChunkCount; partNumber++) {
                var start = (partNumber - 1) * ChunkSize;
                var end = partNumber * ChunkSize < FileSize ? (partNumber * ChunkSize - 1) : FileSize - 1;
                var item = {
                    PartNumber: partNumber,
                    start: start,
                    end: end,
                    CopySourceRange: "bytes=" + start + "-" + end,
                };
                list.push(item);
            }
            params.PartList = list;
        })();

        var TargetHeader;
        if (params.Headers['x-cos-metadata-directive'] === 'Replaced') {
            TargetHeader = params.Headers;
        } else {
            TargetHeader = SourceHeaders;
        }
        TargetHeader['x-cos-storage-class'] = params.Headers['x-cos-storage-class'] || SourceHeaders['x-cos-storage-class'];
        TargetHeader = util.clearKey(TargetHeader);
        self.multipartInit({
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            Headers: TargetHeader,
        },function (err,data) {
            if (err) {
                return callback(err);
            }
            params.UploadId = data.UploadId;
            ep.emit('get_copy_data_finish', params);
        });
    });

    // 获取远端复制源文件的大小
    self.headObject({
        Bucket: SourceBucket,
        Region: SourceRegion,
        Key: SourceKey,
    },function(err, data) {
        if (err) {
            if (err.statusCode && err.statusCode === 404) {
                callback({ErrorStatus: SourceKey + ' Not Exist'});
            } else {
                callback(err);
            }
            return;
        }

        FileSize = params.FileSize = data.headers['content-length'];
        if (FileSize === undefined || !FileSize) {
            callback({error: 'get Content-Length error, please add "Content-Length" to CORS ExposeHeader setting.'});
            return;
        }

        onProgress = util.throttleOnProgress.call(self, FileSize, params.onProgress);

        // 开始上传
        if (FileSize <= CopySliceSize) {
            if (!params.Headers['x-cos-metadata-directive']) {
                params.Headers['x-cos-metadata-directive'] = 'Copy';
            }
            self.putObjectCopy(params, function (err, data) {
                if (err) {
                    onProgress(null, true);
                    return callback(err);
                }
                onProgress({loaded: FileSize, total: FileSize}, true);
                callback(err, data);
            });
        } else {
            var resHeaders = data.headers;
            var SourceHeaders = {
                'Cache-Control': resHeaders['cache-control'],
                'Content-Disposition': resHeaders['content-disposition'],
                'Content-Encoding': resHeaders['content-encoding'],
                'Content-Type': resHeaders['content-type'],
                'Expires': resHeaders['expires'],
                'x-cos-storage-class': resHeaders['x-cos-storage-class'],
            };
            util.each(resHeaders, function (v, k) {
                var metaPrefix = 'x-cos-meta-';
                if (k.indexOf(metaPrefix) === 0 && k.length > metaPrefix.length) {
                    SourceHeaders[k] = v;
                }
            });
            ep.emit('get_file_size_finish', SourceHeaders);
        }
    });
}

// 复制指定分片
function copySliceItem(params, callback) {
    var TaskId = params.TaskId;
    var Bucket = params.Bucket;
    var Region = params.Region;
    var Key = params.Key;
    var CopySource = params.CopySource;
    var UploadId = params.UploadId;
    var PartNumber = params.PartNumber * 1;
    var CopySourceRange = params.CopySourceRange;

    var ChunkRetryTimes = this.options.ChunkRetryTimes + 1;
    var self = this;

    Async.retry(ChunkRetryTimes, function (tryCallback) {
        self.uploadPartCopy({
            TaskId: TaskId,
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            CopySource: CopySource,
            UploadId: UploadId,
            PartNumber:PartNumber,
            CopySourceRange:CopySourceRange,
            onProgress:params.onProgress,
        },function (err,data) {
            tryCallback(err || null, data);
        })
    }, function (err, data) {
        return callback(err, data);
    });
}


var API_MAP = {
    abortUploadTask: abortUploadTask,
    sliceCopyFile: sliceCopyFile,
};

module.exports.init = function (COS, task) {
    util.each(API_MAP, function (fn, apiName) {
        COS.prototype[apiName] = util.apiWrapper(apiName, fn);
    });
};
