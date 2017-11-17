function getPages(currentPage, totalPage) {
    var pages = [currentPage];
    var left = currentPage - 1;
    var right = currentPage + 1;
    while (pages.length < 3 && (left >= 1 || right <= totalPage)) {
        if (left >= 1) pages.unshift(left--);
        if (right <= totalPage) pages.push(right++);
    }
    return pages;
}

module.exports = { getPages }