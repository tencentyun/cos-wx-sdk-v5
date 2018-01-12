var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: path.resolve(__dirname, './index.js'),
    output: {
        path: path.resolve(__dirname, './demo/lib/'),
        publicPath: path.resolve(__dirname, './demo/lib/'),
        filename: 'cos-wx-sdk-v5.js',
        libraryTarget: 'umd',
        library: 'COS'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/
            }
        ]
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true
    },
    performance: {
        hints: false
    },
};

if (process.env.NODE_ENV === 'production') {
    module.exports.output.filename = 'cos-wx-sdk-v5.js';
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false
            }
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        }),
    ])
}