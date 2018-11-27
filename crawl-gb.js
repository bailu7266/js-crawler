/*
 */

'use strict';

const request = require('request-promise');
const qs = require('qs');
const cheerio = require('cheerio');
// const URL = require('url-parse');
const fs = require('fs');
const fsPromises = fs.promises;
const cookiejar = request.jar();
const mongoClient = require('mongodb').MongoClient;

const MAX_RESULT_PAGES = 10;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36';

var resultLinks = [];
// var adLinks = [];
var {
    crawl,
    protocol,
    host,
    searchPath,
    proxy
} = require('./bing.js');

var numResultPages = 0;
var gDb = null;
var fhJson = null;

// main entry
(() => {
    // Initialize mongodb database
    const dbUrl = "mongodb://localhost:27017/";
    mongoClient.connect(dbUrl, { useNewUrlParser: true }, (err, db) => {
        if (err) {
            console.log(err.message);
        } else {
            gDb = db;
            let dbo = db.db('crawl_db');
            dbo.createCollection('links', (err, collection) => {
                if (err) {
                    console.log(err.message);
                } else {
                    _main(collection)
                        .catch((err) => {
                            console.log(err.message);
                            fhJson.close();
                            db.close();
                        })

                    // db.close();
                }
            });
        }
    });
})();

async function _main(collection) {
    let keyWords = process.argv.slice(2);
    if (keyWords.length === 0)
        keyWords = await inputKeyWords();

    // let url = new URL(keyWords);
    // let baseUrl = url.protocol + '//' + url.hostname;

    let nextUrl = protocol + '//' + host + searchPath;
    let qStr = keyWords.join('+');

    let $ = await firstPage(nextUrl, qStr)
        .catch(err => {
            console.log(err.message);
        });

    // collect links from the first SERP
    nextUrl = crawl($, resultLinks);

    // save links to Json file
    appendJsonFile(resultLinks);

    // save links to mongodb
    saveLinks(collection, resultLinks);

    let myRequest = request.defaults({
        baseUrl: protocol + '//' + host,
        headers: {
            'User-Agent': userAgent
        },
        proxy: proxy,
        jar: true, // store cookies
        transform: body => {
            return cheerio.load(body);
        }
    });

    while (nextUrl && numResultPages < MAX_RESULT_PAGES) {
        numResultPages++;

        $ = await nextSerp(myRequest, nextUrl)
            .catch(err => {
                console.log(err.message);
            });
        nextUrl = crawl($, resultLinks);

        appendJsonFile(resultLinks);
        saveLinks(collection, resultLinks);
    }

    await report(collection);
    fhJson.close();
    gDb.close();

    console.log('Done!!!');
}

async function appendJsonFile(links) {
    // 使用异步操作时，会由于优先执行后面的saveLinks，导致resultLinks被清空
    let strJson = JSON.stringify(links, null, 2);
    try {
        if (!fhJson)
            fhJson = await fsPromises.open('./tmp/links.json', 'w+');

        let offset = 0;
        let stats = await fhJson.stat();
        if (stats.size) {
            // await fh.truncate(stats.size - 1);
            // let newStats = await fh.stat();
            // console.log('JSON 文件大小从：' + stats.size + '变成了：' + newStats.size);
            // Eliminate the last ']'
            offset = 2;
        }
        await fhJson.appendFile(strJson.slice(offset));
    } catch (err) {
        throw err;
    }
}

async function saveLinks(myCollection, links) {
    try {
        let res = await myCollection.insertMany(links);
        // console.log(`Insert ${res.insertedCount} links to crawl_db.`);
        links.splice(0, res.insertedCount);
        // console.log('resultLinks的长度变为：' + links.length);
    } catch (err) {
        console.log(err.message);
        throw err;
    }
}

function inputKeyWords() {
    const readline = require('readline');
    if (process.stdin.isTTY) {
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
    }

    const rli = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(async(resolve) => {
        let line = [];
        while (line.length === 0) {
            let inkey = await (() => {
                return new Promise((res) => {
                    rli.question('请输入关键词: ', answer => {
                        res(answer);
                    });
                })();
            });
            line = inkey.split(' ');
        }

        rli.close();

        resolve(line);
    });
}

function firstPage(url, qStr) {
    return new Promise(async(resolve, reject) => {
        try {
            if (process.env.SERP_FILE) {
                resolve(cheerio.load(fs.readFileSync(process.env.SERP_FILE)));
            }

            let $ = await request({
                uri: url,
                qs: {
                    q: qStr
                },
                headers: {
                    'User-Agent': userAgent
                },
                proxy: proxy,
                jar: cookiejar, // store cookies
                resolveWithFullResponse: true,
                transform: function(body, response) {
                    if (response.statusCode === 200) {
                        console.log(
                            'Visiting: ' +
                            decodeURI(
                                this.uri + '?' + qs.stringify(this.qs)
                            )
                        );
                        // console.log(cookiejar.getCookieString(this.uri));
                        fs.writeFileSync('./tmp/page0.html', body);
                        return cheerio.load(body);
                    } else {
                        throw new Error(
                            'Transform failed with ret code： ' +
                            response.statusCode
                        );
                    }
                }
            })

            resolve($);
        } catch (err) {
            console.log(err.message);
            reject(err);
        }
    });
}

function nextSerp(myRequest, nextUrl) {
    return new Promise(async(resolve, reject) => {
        try {
            let $ = await myRequest(nextUrl);
            // 保持$中的内容，供调试用
            fs.writeFileSync(`./tmp/${numResultPages}.html`, $.html());

            resolve($);
        } catch (err) {
            console.log(err.message);
            reject(err);
        }
    });
}

function report(collection) {
    return new Promise(async(resolve) => {
        // console log collected links
        let cursor = collection.find();
        let bi = 0;
        do {
            resultLinks = await cursor.limit(5).toArray();
            resultLinks.forEach((lnk, i) => {
                console.log(`No ${i + bi}: ` + lnk.name);
                console.log(lnk.uri);
                console.log(lnk.descr);
                console.log('\n');
            });
            bi += 5;
            cursor = collection.find().skip(bi);
        } while (resultLinks.length)
        resolve();
    });
}