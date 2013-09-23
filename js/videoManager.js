var VIDEO_MANAGER = (function (me) {


    /**
     * initialize video manager
     */
    me.init = function () {
        console.log("initializing video manager");

        initYouTubeAPI();
    };

    /**
     *
     * @param videoId
     */
    me.addVideo = function (videoId) {
    };

    /**
     * returns list of video objects
     */
    me.getVideos = function () {
    };

    /**
     *
     * @param filterParams
     */
    me.filterVideos = function (filterParams) {
    };

    /**
     *
     * @param shouldPreloadPlayers
     */
    me.preloadPlayers = function (shouldPreloadPlayers) {
    };


    /**
     * remove all videos
     */
    me.clear = function () {
    };

    me.updateVideoPosition = function (videoId, videoTime) {
        console.log("UpdateVideoPosition: " + videoId);
        if (videoId !== "") {
            if (G.videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {

                G.ytPlayers[videoId].seekTo(Math.max(0, videoTime));
                G.ytPlayers[videoId].playVideo();

            } else if (G.videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {

                G.videoStartPosition[videoId] = videoTime;
                loadVideo(videoId);
            }
        }
    };

    me.checkVideoAvailabilities = function (scoreId, onDone) {
        var videoProperties = G.syncPairs[scoreId],
            counter = new FiringCounter(Object.keys(videoProperties).length, onDone),
            videoId;

        for (videoId in videoProperties) {
            if (videoProperties.hasOwnProperty(videoId)) {
                checkYouTubeVideoAvailability(videoId, counter);
            }
        }
    };

    function initYouTubeAPI() {
        var tag = document.createElement('script'), firstScriptTag;
        tag.src = "https://www.youtube.com/iframe_api";
        firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }


    function checkYouTubeVideoAvailability(videoId, counter) {

        if (typeof G.videos[videoId].getAvailability() !== 'undefined') {
            counter.increment();
            return;
        }

        var url = "http://gdata.youtube.com/feeds/api/videos/" + videoId + "?v=2&alt=json-in-script&callback=?"; // prettyprint=true
        $.getJSON(url)
            .done(function (data) {
                G.videos[videoId].setAvailability(true);

                if (data['entry'].hasOwnProperty("app$control") &&
                    data['entry']['app$control'].hasOwnProperty("yt$state") &&
                    data['entry']['app$control']['yt$state']['$t'] === "This video is not available in your region.") {
                    console.log("video " + videoId + " is not available");
                    G.videos[videoId].setAvailability(false);
                } else {
                    console.log("video " + videoId + " is available");
                }

                G.videos[videoId].setTitle(data['entry']['title']['$t']);
                counter.increment();
            })
            .fail(function (jqxhr, textStatus, error) {
                G.videos[videoId].setTitle("Data not available");
                G.videos[videoId].setAvailability(true);
                counter.increment();
            });
    }

    function loadVideo(_videoID) {
        'use strict';

        console.log("Load video: " + _videoID);

        G.videos[_videoID].setDisplayStatus(CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY);

        $("#" + getThumbnailDivId(_videoID)).remove(); // remove thumbnail div

        $("#" + getVideoDivId(_videoID)).css('position', '').css('left', '').css('background-color', 'lightgrey');

        enlargeVideoDiv(_videoID);

        if (G.videos[_videoID].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_READY) {
            console.log("id: " + _videoID + " already preloaded");

            G.ytPlayers[_videoID].seekTo(Math.max(0, G.videoStartPosition[_videoID]));
            G.ytPlayers[_videoID].playVideo();

            console.log("id: " + _videoID + " play");
        }
    }

    me.initVideos = function(scoreId, alignedVideos) {
        'use strict';

        if (typeof YT === "undefined") {
            setTimeout(function () {
                initVideos(scoreId, alignedVideos);
            }, 250);
            console.log("waiting for YT API to load, retrying in 250ms");
            return;
        }

        createThumbnailAndVideoHolderDiv(scoreId, alignedVideos);

        createVideoThumbnails(scoreId, alignedVideos);

        initVideoDivs(scoreId, alignedVideos);

        setTimeout(function() {preloadVideos(scoreId, alignedVideos);}, 3000);

    }

    return me;
}(VIDEO_MANAGER || {}));