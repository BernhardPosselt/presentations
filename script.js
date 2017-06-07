function createSlideShow(url) {
    return remark.create({
        sourceUrl: url
    });
};

// this function is supposed to be a hack
function getSlide(key) {
    const regex = new RegExp(key+"=([^&#=]*)");
    const result = regex.exec(window.location.search);
    if (result && result[1] && decodeURIComponent(result[1])) {
        return decodeURIComponent(result[1]);
    } else {
        return 'monoids';
    }
}

window.onload = function () {
    createSlideShow('slides/' + getSlide('slide') + '.md');
};
