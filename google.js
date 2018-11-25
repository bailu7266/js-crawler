module.exports = {
    crawl: _crawl,
    protocol: 'https:',
    host: 'www.google.com',
    searchPath: '/search',
    proxy: 'http://127.0.0.1:49454'
};

function _crawl($, resultLinks) {
    // let resultItems = $('#rso > div > div > div.g');
    let resultItems = $('#search div.g');

    resultItems.each((i, item) => {
        // let $ = cheerio.load(item);
        resultLinks.push({
            name: $('.r > a:not(".fl")', item).text(),
            uri: $('.r > a:not(".fl")', item).attr('href'),
            descr: $('div.s span.st', item).text()
        });
    });

    // 在支持Javascript的浏览器中，当前页的class是‘cur’，但在不支持的js的request中，这个class是‘csb’
    // 同样的，代表起始项的class也只保留‘b’，没有‘navend’了
    let nextNavTd = $('#nav td:has("> span.csb")')
        .last()
        .next(':has("> a.fl")');
    if (nextNavTd.length) {
        console.log(nextNavTd.children('a').text());
        return nextNavTd.children('a.fl').attr('href');
    }

    return null;
}