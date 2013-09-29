/**
 * Created with IntelliJ IDEA.
 * User: V
 * Date: 16.09.13
 * Time: 13:34
 * To change this template use File | Settings | File Templates.
 */

function GUI() {
    this.scoreDropDown = $("#scoreIDs");
    this.qualityFilter = $("#qualityFilter");
    this.videoTitle = $("#videoTitle");
    this.videoTitelFilter = $("#videoTitelFilter");
    this.videoContainer = $("#videos");
    this.plotContainer = $('#plotContainer');
    this.hideVideosCheckbox = $('#hideVideoDivs');
    this.segmentQuality = $("#segmQual");
}

/**
 * add a scoreId to the dropdown
 * @param scoreId
 */
GUI.prototype.addScoreToDropdown = function(scoreId) {
    this.scoreDropDown.append($("<option />").val(scoreId).text(scoreId));
};

GUI.prototype.populateQualityFilter = function (qualities) {
    for (ind = 0; ind < qualities.length; ind = ind + 1) {
        this.qualityFilter.append($("<option />").val(qualities[ind]).text(qualities[ind]));
    }
};

GUI.prototype.shouldHideVideos = function() {
    return this.hideVideosCheckbox.prop('checked') === true;
};

GUI.prototype.getSelectedScoreId = function() {
    return this.scoreDropDown.val();
};

GUI.prototype.getAlignmentQualityFilter = function() {
    return this.qualityFilter.val();
};

GUI.prototype.setVideoTitle = function(title) {
    this.videoTitle.text(title);
};

GUI.prototype.getVideoTitleFilterString = function() {
    return this.videoTitelFilter.val();
};

GUI.prototype.setSegmentQuality = function(quality) {
     this.segmentQuality.text(quality)
};

GUI.prototype.addScoreDropdownChangeCallback = function(callback) {
    this.scoreDropDown.change(callback);
};

GUI.prototype.addAlignmentQualityChangeCallback = function(callback) {
    this.qualityFilter.change(callback);
};

GUI.prototype.addVideoTitleChangeCallback = function(callback) {
    this.videoTitelFilter.keyup(callback);
};

GUI.prototype.resetScoreDOM = function() {
    d3.select('svg').remove();
    d3.select(".mouseTrackLine").remove();
    this.videoContainer.empty();
    this.plotContainer.empty();
};

GUI.prototype.getVideoContainer = function() {
    return this.videoContainer;
}


GUI.prototype.getThumbnailDiv = function(_videoID) {
    // Thease are to position the play button centrally.
    var pw = Math.ceil(CONSTANTS.VIDEO_WIDTH / 2 - 38.5),
        ph = Math.ceil(CONSTANTS.VIDEO_HEIGHT / 2 + 38.5);

    // The image+button overlay code.
    var code = '<div style="width:'
        + CONSTANTS.VIDEO_WIDTH + 'px; height:' + CONSTANTS.VIDEO_HEIGHT
        + 'px; margin:0 auto"><a href="#"  onclick="CONTROLLER.onThumbnailClick(\'' + _videoID
        + '\');return false;" id="skipser-youtubevid-' + _videoID + '"><img src="http://i.ytimg.com/vi/' + _videoID
        + '/hqdefault.jpg" style="width:' + CONSTANTS.VIDEO_WIDTH + 'px; height:' + CONSTANTS.VIDEO_HEIGHT
        + 'px;" /><div class="yt-thumbnail-playbutton" style="margin-left:'
        + pw + 'px; margin-top:-' + ph + 'px;"></div></a></div>';

    // Replace the iframe with a the image+button code.
    var div = document.createElement('div');
    div.innerHTML = code;
    div = div.firstChild;

    return div;
};
