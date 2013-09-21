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

    me.updateVideoPosition = function (videoTime) {
        if (G.videoIDNextToCursor !== "") {
            if (G.videos[G.videoIDNextToCursor].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {

                G.ytPlayers[G.videoIDNextToCursor].seekTo(Math.max(0, videoTime));
                G.ytPlayers[G.videoIDNextToCursor].playVideo();

            } else if (G.videos[G.videoIDNextToCursor].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {

                G.videoStartPosition[G.videoIDNextToCursor] = videoTime;
                loadVideo(G.videoIDNextToCursor, G.videoIDNextToCursor);
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

    return me;
}(VIDEO_MANAGER || {}));