const fs = require("fs");
const path = require("path");

const nodeExternals = require("webpack-node-externals");

const minerSettings = {
    target: "web",
    mode: "development",
    entry: path.join(process.cwd(), `src`, `level-miner-entry.ts`),
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        library: "LevelMiner",
        filename: "level-miner.js",
        libraryTarget: "umd"
        // clean: true
    }
};

const moduleSettings = {
    target: "node",
    mode: "development",
    entry: {
        index: path.join(process.cwd(), `src`, `index.ts`),
        test: path.join(process.cwd(), `src`, `test.ts`)
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            transpileOnly: false
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    externals: [nodeExternals(), "playwright"],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget: "commonjs2"
    }
};

module.exports = function (env, argv) {
    return [minerSettings, moduleSettings];
};
