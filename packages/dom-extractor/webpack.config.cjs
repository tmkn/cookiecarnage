const path = require("path");

const scraperSettings = {
    target: "web",
    mode: "development",
    entry: path.join(process.cwd(), `src`, `main.ts`),
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
        extensions: [".ts"],
        extensionAlias: {
            ".js": ".ts"
        }
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        library: "Domageddon",
        filename: "domageddon.js",
        clean: true
    }
};

module.exports = function (env, argv) {
    return [scraperSettings];
};
