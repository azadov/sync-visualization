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

    me.showSuitableVideoDivsForPlotPosition = function(currentMouseXPoint, currentMouseYPoint) {
        'use strict';


        var yAboveMousePoint = G.maxPlotY,
            yUnderMousePoint = 0,
            videoIDAbove = "",
            videoIDUnder = "",
            videoSegmentAbove,
            videoSegmentUnder,
            i, id, yAb, yUn,
            currentSegment,
            videoToEnlarge = "",
            cursorOnVideoSegment = false;


        calculateVisibilityOfVideos(currentMouseXPoint);

        if (gui.shouldHideVideos()) {
            showAndHideVideos();
        }


        for (i = 0; i < G.allVideoSegments.length; i = i + 1) {
            currentSegment = G.allVideoSegments[i];
            if (currentMouseXPoint >= currentSegment.x1 && currentMouseXPoint <= currentSegment.x2) {
                //console.log(currentSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT + "     " + currentMouseYPoint + "   " + currentSegment.y);
//            if (currentSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT <= currentMouseYPoint && currentMouseYPoint <= currentSegment.y) {
//                cursorOnVideoSegment = true;
//                G.videoIDNextToCursor = currentSegment.videoID;
//                G.segmentNextToCursor = currentSegment;
//            }
                yUn = currentSegment.y;// - CONSTANTS.SEGMENT_RECT_HEIGHT;
                if (currentMouseYPoint > yUn && yUn > yUnderMousePoint) {
                    yUnderMousePoint = yUn;
                    videoIDUnder = currentSegment.videoID;
                    videoSegmentUnder = currentSegment;
                }
                yAb = currentSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT;
                if (currentMouseYPoint < yAb && yAb < yAboveMousePoint) {
                    yAboveMousePoint = yAb;
                    videoIDAbove = currentSegment.videoID;
                    videoSegmentAbove = currentSegment;
                }
            }
        }
        //console.log("toenlargeornottoenlarge   " + videoIDUnder + "    " + videoIDAbove + "    " + cursorOnVideoSegment);
        if (videoIDUnder === "" && videoIDAbove === "")  {  // && !cursorOnVideoSegment
            G.videoIDNextToCursor = "";
            // resize all videos
            for (id in G.visibilityOfVideos) {
                if (G.visibilityOfVideos.hasOwnProperty(id)) {
                    resetVideoDiv(id);
                }
            }
            return;
        }
        //console.log("above: " + videoIDAbove + "  yAb: " + yAboveMousePoint + "        under: " + videoIDUnder + "  yUn: " + yUnderMousePoint);
        var factor = 1;
        if (videoIDUnder === "") {
            //factor = currentMouseYPoint / yAboveMousePoint;
            videoToEnlarge = videoIDAbove;
            G.segmentNextToCursor = videoSegmentAbove;
        } else if (videoIDAbove === "") {
            //factor = 1 - (currentMouseYPoint - yUnderMousePoint) / (G.maxPlotY - yUnderMousePoint);
            videoToEnlarge = videoIDUnder;
            G.segmentNextToCursor = videoSegmentUnder;
        } else if (videoIDUnder === videoIDAbove) {
            factor = 1;
            videoToEnlarge = videoIDUnder;
            if ((yAboveMousePoint - currentMouseYPoint) >= (currentMouseYPoint - yUnderMousePoint)) {
                G.segmentNextToCursor = videoSegmentUnder;
            } else {
                G.segmentNextToCursor = videoSegmentAbove;
            }
        } else {
            if ((yAboveMousePoint - currentMouseYPoint) >= (currentMouseYPoint - yUnderMousePoint)) {
                // point under is the next to mouse point
                //factor = 1 - (currentMouseYPoint - yUnderMousePoint) / ((yAboveMousePoint - yUnderMousePoint) / 2);
                videoToEnlarge = videoIDUnder;
                G.segmentNextToCursor = videoSegmentUnder;
            } else {
                // point above is the next to mouse point
                //factor = (currentMouseYPoint - yUnderMousePoint) / ((yAboveMousePoint - yUnderMousePoint) / 2) - 1;
                videoToEnlarge = videoIDAbove;
                G.segmentNextToCursor = videoSegmentAbove;
            }
        }

        if (G.videos[videoToEnlarge].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {
            enlargeVideoDiv(videoToEnlarge);
        } else  if (G.videos[videoToEnlarge].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
            if (G.ytPlayers[videoToEnlarge].getPlayerState() !== YT.PlayerState.PLAYING && G.ytPlayers[videoToEnlarge].getPlayerState() !== YT.PlayerState.BUFFERING) {
                enlargeVideoDiv(videoToEnlarge);
            }
        }

        if (!gui.shouldHideVideos()) {
            for (id in G.visibilityOfVideos) {
                if (G.visibilityOfVideos.hasOwnProperty(id)) {
                    //if (id !== videoIDAbove && id !== videoIDUnder) {
                    if (id !== videoToEnlarge) {
                        //console.log("video to reset: " + id);
                        resetVideoDiv(id);
                    }
                }
            }
        }

        G.videoIDNextToCursor = videoToEnlarge;
    }

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