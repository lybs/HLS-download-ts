const fs = require('fs');
const path = require("path");
const request = require('request');

let m3u8Content = fs.readFileSync('test.m3u8');
let tsLinkList = getTsLinkList(m3u8Content.toString());
let dirPath = path.join(__dirname, "ts");
let mp4Path = path.join(dirPath, 'allTs.mp4');

if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
}

getAllTsFile(tsLinkList).then(function (filePathList) {
    if (fs.existsSync(mp4Path)) {
        fs.unlinkSync(mp4Path);
    }

    for (let filePath of filePathList) {
        fs.appendFileSync(mp4Path, fs.readFileSync(filePath));
    }
}).catch(function (err) {
    console.log(err);
});


// 获取全部ts文件
async function getAllTsFile(list) {
    let result = [];

    for (let item of list) {
        let res = await loadTsFile(item);
        if (!res.ok) {
            throw new Error(res.message);
        }

        result.push(res.data);
    }

    return result;
}

// 从网络下载ts文件
function loadTsFile(url) {
    return new Promise(function (resolve, reject) {
        let filePath = path.join(dirPath, url.split("/").reverse()[0]);

        if (fs.existsSync(filePath) && fs.statSync(filePath).size !== 0) {
            console.log(filePath, '文件已存在');

            resolve({ok: true, data: filePath});
            return;
        }

        request(url)
            .on('error', function (err) {
                reject({ok: false, msg: url + ' 下载失败：' + err.message});
            })
            .pipe(fs.createWriteStream(filePath))
            .on('close', function (err) {
                if (err) {
                    reject({ok: false, msg: url + ' 写入失败：' + err.message});
                    return;
                }

                resolve({ok: true, data: filePath});
            });
    });
}

// 从m3u8文件获取ts文件链接列表
function getTsLinkList(text) {
    let list = [];
    let reg = /(http:\/\/.*\.ts)/ig;
    let r = '';

    while (r = reg.exec(text)) {
        list.push(r[1]);
    }

    return list;
}