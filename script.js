function createSlideShow(url) {
    return remark.create({
        sourceUrl: url
    });
};

window.onload = function () {
    createSlideShow('slides/functors.md');
};
