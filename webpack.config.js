let webpack = require("webpack");
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    // 가장 처음 읽을 스크립트파일
    // 여기서부터 import 되어있는 다른 스크립트를 불러온다.
    entry: './src/index.js',

    // 파일을 합치고 ./public/bundle.js 에 저장한다.
    output: {
        path: __dirname + '/public/js',
        filename: 'bundle.js'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    cacheDirectory: true,
                    presets: ['@babel/preset-env']
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
       test: /\.vue$/,
       loader: 'vue-loader'
     },
          ]
    },

    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        }),
        new webpack.SourceMapDevToolPlugin({}),
        new VueLoaderPlugin()
    ],

    resolve: {
        alias: {
          vue: 'vue/dist/vue.min.js'
        }
    }
};
