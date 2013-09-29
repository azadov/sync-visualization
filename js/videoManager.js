var VIDEO_MANAGER = (function (me) {
    /**
     * current videos that are available and passed all filters
     * @type {Array}
     */
    var currentVideoIdsThatPassedAllFilters = [];

    var videos = {};

    /**
     * initialize video manager
     */
    me.init = function () {
        console.log("initializing video manager");

        initYouTubeAPI();

        me.clear();
    };

    /**
     *
     * @param videoId
     */
    me.addVideo = function (videoId, video) {
        videos[videoId] = video;
    };

    me.getVideo = function (videoId) {
        return videos[videoId];
    };

    /**
     * returns list of video objects
     */
    me.getVideos = function () {
        return videos;
    };

    me.videoExist = function (videoId) {
        return videos.hasOwnProperty(videoId);
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
        videos = [];
        currentVideoIdsThatPassedAllFilters = {};
    };

    me.getCurrentVideoIdsThatPassedAllFilters = function() {
        return currentVideoIdsThatPassedAllFilters;
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

        if (videos[videoToEnlarge].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {
            enlargeVideoDiv(videoToEnlarge);
        } else  if (videos[videoToEnlarge].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
            if (videos[videoToEnlarge].getPlayer().getPlayerState() !== YT.PlayerState.PLAYING && videos[videoToEnlarge].getPlayer().getPlayerState() !== YT.PlayerState.BUFFERING) {
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
    };

    me.onMouseOverVideoSegment = function(d) {
        'use strict';

        //console.log("videoID rect: " + d.videoID);
        enlargeVideoDiv(d.videoID);
        gui.setSegmentQuality(d.segmentConfidence);
        G.segmentNextToCursor = d;
        G.videoIDNextToCursor = d.videoID;
    };

    me.onMouseOverCurve = function(d) {
        //console.log("videoID rect: " + d[0].videoID);
        enlargeVideoDiv(d.videoID);
    };

    me.updateVideoPosition = function (videoId, videoTime) {
        console.log("UpdateVideoPosition: " + videoId);

        if (videoId == "") return;

        if (videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
            videos[videoId].getPlayer().seekTo(Math.max(0, videoTime));
            videos[videoId].getPlayer().playVideo();

        } else if (videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {

            G.videoStartPosition[videoId] = videoTime;
            loadVideo(videoId);
        }

    };

    me.checkVideoAvailabilities = function (scoreId, onDone) {
        var videoProperties = CONTROLLER.getSyncedVideosForScore(scoreId),
            counter = new FiringCounter(Object.keys(videoProperties).length, onDone),
            videoId;

        for (videoId in videoProperties) {
            if (videoProperties.hasOwnProperty(videoId)) {
                if (videoId.substring(0, 5) == "IMSLP") continue;
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

        if (typeof videos[videoId].getAvailability() !== 'undefined') {
            counter.increment();
            return;
        }

        var url, success = false;

        setTimeout(function() {
            if (!success) {
                // Handle error accordingly
                videos[videoId].setTitle("Data not available");
                videos[videoId].setAvailability(false);
                counter.increment();
            }
        }, 500);

        url = "http://gdata.youtube.com/feeds/api/videos/" + videoId + "?v=2&alt=json-in-script&callback=?"; // prettyprint=true
        $.getJSON(url)
            .done(function (data) {
                success = true;

                if (data['entry'].hasOwnProperty("app$control") &&
                    data['entry']['app$control'].hasOwnProperty("yt$state") &&
                    data['entry']['app$control']['yt$state']['$t'] === "This video is not available in your region.") {
                    console.log("video " + videoId + " is not available");
                    videos[videoId].setAvailability(false);
                } else {
                    console.log("video " + videoId + " is available");
                    videos[videoId].setTitle(data['entry']['title']['$t']);
                    videos[videoId].setAvailability(true);
                }
                counter.increment();
            })
            .fail(function (jqxhr, textStatus, error) {
                success = true;

                videos[videoId].setTitle("Data not available");
                videos[videoId].setAvailability(true);
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

        currentVideoIdsThatPassedAllFilters = [];

        var videoId;
        for (videoId in alignedVideos) {
            if (alignedVideos.hasOwnProperty(videoId) && videos[videoId].getAvailability() && !videoIsFilteredOut(scoreId, videoId)) {
                currentVideoIdsThatPassedAllFilters.push(videoId);
            }
        }

        createThumbnailAndVideoHolderDiv(scoreId, currentVideoIdsThatPassedAllFilters);

        createVideoThumbnails(scoreId, currentVideoIdsThatPassedAllFilters);

        initVideoDivs(scoreId, currentVideoIdsThatPassedAllFilters);

        setTimeout(function() {preloadVideos(scoreId, currentVideoIdsThatPassedAllFilters);}, 3000);

    };

    function enlargeVideoDiv(videoId) {
        'use strict';

        if (videoId === "") return;

        var elementToEnlarge, secondElementToEnlarge, thumbnail, i, vID, someVideoPlaying = false, currentVideos = currentVideoIdsThatPassedAllFilters,
            newWidth = CONSTANTS.PLAYING_VIDEO_WIDTH,
            newHeight = CONSTANTS.PLAYING_VIDEO_HEIGHT,
            pw = Math.ceil(CONSTANTS.PLAYING_VIDEO_WIDTH / 2 - 38.5),
            ph = Math.ceil(CONSTANTS.PLAYING_VIDEO_HEIGHT / 2 + 38.5);

        if (videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY
            && videos[videoId].getThumbnailSizeStatus() !== CONSTANTS.VIDEO_PLAYER_SIZE_STATUS_LARGE) { // enlarge thumbnail

            elementToEnlarge = document.getElementById(getThumbnailDivId(videoId)).firstChild;
            elementToEnlarge.style.width = newWidth + "px";
            elementToEnlarge.style.height = newHeight + "px";

            secondElementToEnlarge = document.getElementById(getThumbnailDivId(videoId)).firstChild.firstChild.firstChild;
            secondElementToEnlarge.style.width = newWidth + "px";
            secondElementToEnlarge.style.height = newHeight + "px";

            thumbnail = document.getElementById(getThumbnailDivId(videoId)).firstChild.firstChild.lastChild;
            thumbnail.style.marginLeft = pw + "px";
            thumbnail.style.marginTop = "-" + ph + "px";


//        var thumbnailDiv = $('#' + getThumbnailDivId(videoId));
//        thumbnailDiv.first().animate({
//            width: newWidth + "px",
//            height: newHeight + "px"
//        }, CONSTANTS.ANIMATION_TIME);
//        thumbnailDiv.first().first().first().animate({
//            width: newWidth + "px",
//            height: newHeight + "px"
//        }, CONSTANTS.ANIMATION_TIME);
//
//        thumbnailDiv.first().first().last().animate({
//            marginLeft: pw + "px",
//            marginTop: "-" + ph + "px"
//        }, CONSTANTS.ANIMATION_TIME);

            //var thumbnailDiv = $('#' + getThumbnailDivId(videoId));
//        thumbnailDiv.first().css('width', newWidth + "px").css('height', newHeight + "px");
//        thumbnailDiv.first().first().first().css('width', newWidth + "px").css('height', newHeight + "px");
//        thumbnailDiv.first().first().last().css('marginLeft', pw + "px").css('marginTop', "-" + ph + "px");
//        thumbnailDiv.first().css('width', newWidth).css('height', newHeight);
//        thumbnailDiv.first().first().first().css('width', newWidth).css('height', newHeight);
//        thumbnailDiv.first().first().last().css('marginLeft', pw).css('marginTop', - ph);

            videos[videoId].setThumbnailSizeStatus(CONSTANTS.VIDEO_PLAYER_SIZE_STATUS_LARGE);
        }

        if (videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY
            && videos[videoId].getPlayerSizeStatus() !== CONSTANTS.VIDEO_PLAYER_SIZE_STATUS_LARGE) { // enlarge video div
//        elementToEnlarge = document.getElementById(getVideoDivId(videoId));  //.firstChild.firstChild
//        elementToEnlarge.width = newWidth;
//        elementToEnlarge.height = newHeight;
            //console.log("to enlarge: " + videoId);
            $('#' + getVideoDivId(videoId)).animate({
                width: newWidth,
                height: newHeight
            }, CONSTANTS.ANIMATION_TIME );

            videos[videoId].setPlayerSizeStatus(CONSTANTS.VIDEO_PLAYER_SIZE_STATUS_LARGE);
        }

        for (i = 0; i < currentVideos.length; i = i + 1) {
            vID = currentVideos[i];
            if (vID !== videoId && videos[vID].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_READY) {
                if (videos[vID].getPlayer().getPlayerState() === YT.PlayerState.PLAYING || videos[vID].getPlayer().getPlayerState() === YT.PlayerState.BUFFERING) {
                    someVideoPlaying = true;
                }
            }
        }
        if (!someVideoPlaying) {
            G.gui.setVideoTitle(videos[videoId].getTitle());
        }
    }

    function resetVideoDiv(_videoID) {
        'use strict';

        if (_videoID === "") return;

        var elementToReset, secondElementToReset, thumbnail,
            pw = Math.ceil(CONSTANTS.VIDEO_WIDTH / 2 - 38.5),
            ph = Math.ceil(CONSTANTS.VIDEO_HEIGHT / 2 + 38.5);

        if (videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY
            && videos[_videoID].getThumbnailSizeStatus() !== CONSTANTS.VIDEO_PLAYER_SIZE_STATUS_NORMAL) { // reset thumbnail
            elementToReset = document.getElementById(getThumbnailDivId(_videoID)).firstChild;
            elementToReset.style.width = CONSTANTS.VIDEO_WIDTH + "px";
            elementToReset.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

            secondElementToReset = document.getElementById(getThumbnailDivId(_videoID)).firstChild.firstChild.firstChild;
            secondElementToReset.style.width = CONSTANTS.VIDEO_WIDTH + "px";
            secondElementToReset.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

            thumbnail = document.getElementById(getThumbnailDivId(_videoID)).firstChild.firstChild.lastChild;
            thumbnail.style.marginLeft = pw + "px";
            thumbnail.style.marginTop = "-" + ph + "px";
//        $('#' + getThumbnailDivId(_videoID)).first().animate({
//            width: CONSTANTS.VIDEO_WIDTH + "px",
//            height: CONSTANTS.VIDEO_HEIGHT + "px"
//        }, CONSTANTS.ANIMATION_TIME);
//        $('#' + getThumbnailDivId(_videoID)).first().first().first().animate({
//            width: CONSTANTS.VIDEO_WIDTH + "px",
//            height: CONSTANTS.VIDEO_HEIGHT + "px"
//        }, CONSTANTS.ANIMATION_TIME);
//        $('#' + getThumbnailDivId(_videoID)).first().first().last().animate({
//            marginLeft: pw + "px",
//            marginTop: "-" + ph + "px"
//        }, CONSTANTS.ANIMATION_TIME);

            videos[_videoID].setThumbnailSizeStatus(CONSTANTS.VIDEO_PLAYER_SIZE_STATUS_NORMAL);
        }

        if (videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
            if (videos[_videoID].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_READY
                && videos[_videoID].getPlayerSizeStatus() !== CONSTANTS.VIDEO_PLAYER_SIZE_STATUS_NORMAL
                && videos[_videoID].getPlayer().getPlayerState() !== YT.PlayerState.PLAYING
                && videos[_videoID].getPlayer().getPlayerState() !== YT.PlayerState.BUFFERING) {
//            elementToReset = document.getElementById(getVideoDivId(_videoID));
//            elementToReset.width = CONSTANTS.VIDEO_WIDTH;
//            elementToReset.height = CONSTANTS.VIDEO_HEIGHT;
                //console.log("to reset: " + _videoID);
                $('#' + getVideoDivId(_videoID)).animate({
                    width: CONSTANTS.VIDEO_WIDTH,
                    height: CONSTANTS.VIDEO_HEIGHT
                }, CONSTANTS.ANIMATION_TIME );

                videos[_videoID].setPlayerSizeStatus(CONSTANTS.VIDEO_PLAYER_SIZE_STATUS_NORMAL);
            }
        }
    }

    me.resetSizeOfAllVideos = function() {
        var i;
        if (!G.gui.shouldHideVideos()) {
            for (i = 0; i < currentVideoIdsThatPassedAllFilters.length; i = i + 1) {
                resetVideoDiv(currentVideoIdsThatPassedAllFilters[i]);
            }
        }
    };

    function getNewYoutubePlayer(_videoContainerId, _videoId) {
        return new YT.Player(_videoContainerId, {
            height: CONSTANTS.VIDEO_HEIGHT,
            width: CONSTANTS.VIDEO_WIDTH,
            videoId: _videoId,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    }

    function tryToLoad(_videoID) {
        'use strict';

        var videoContainerID = getVideoDivId(_videoID), player;

        if (videos[_videoID].getLoadingStatus() !== CONSTANTS.VIDEO_LOADING_STATUS_READY && videos[_videoID].getNumOfLoadingAttempts() === 3) {
            deactivateVideo(_videoID);
            clearInterval(G.videoLoadingInterval[_videoID]);
            console.log("VideoID: " + _videoID + "   deactivate");
        } else if (videos[_videoID].getLoadingStatus()!== CONSTANTS.VIDEO_LOADING_STATUS_READY && videos[_videoID].getNumOfLoadingAttempts() < 3) {

            console.log("VideoID: " + _videoID + "   LoadingAttempts: " + videos[_videoID].getNumOfLoadingAttempts() + "   VideoContainer: " + videoContainerID);
            //G.ytPlayers[_videoID] = getNewYoutubePlayer(videoContainerID, _videoID);
            player = getNewYoutubePlayer(videoContainerID, _videoID);

            videos[_videoID].increaseNumOfLoadingAttempts();
        }
    }

    function preloadVideo(videoId) {

        if (typeof YT === "undefined") {
            setTimeout(function () {
                preloadVideo(videoId);
            }, 250);
            console.log("waiting for YT API to load, retrying in 250ms");
            return;
        }

        if (videos[videoId].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_UNLOADED) {
            console.log("preload " + videoId);

            videos[videoId].setLoadingStatus(CONSTANTS.VIDEO_LOADING_STATUS_LOAD);

            tryToLoad(videoId);
            G.videoLoadingInterval[videoId] = setInterval(function () {
                tryToLoad(videoId);
            }, CONSTANTS.VIDEO_LOADING_WAITING_TIME);
        }
    }

    function onPlayerError(event) {
        'use strict';

        //console.log("OnPlayerError: " + event.data + "      VideoID: " + event.target.getVideoData().video_id);
        var videoId = event.target.getVideoData().video_id;
        console.log("OnPlayerError: " + videoId);
        deactivateVideo(videoId);
        clearInterval(G.videoLoadingInterval[videoId]);
    }


    function onPlayerReady(event) {
        'use strict';

        var videoId = event.target.getVideoData().video_id;

        console.log("onPlayerReady: " + videoId);

        videos[videoId].setLoadingStatus(CONSTANTS.VIDEO_LOADING_STATUS_READY);

        videos[videoId].setPlayer(event.target);

        event.target.seekTo(Math.max(0, G.videoStartPosition[videoId]));

        if (videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {
            console.log("       " + videoId + " out of display -> pause");
            event.target.pauseVideo();
        } else if (videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
            console.log("       " + videoId + " in display -> play");
            event.target.playVideo();
            enlargeVideoDiv(videoId);
        }

        clearInterval(G.videoLoadingInterval[videoId]);
    }

/*    function playVideo(videoId, videoTime) {
        'use strict';

        var i, vId;
        for (i = 0; i < currentVideoIdsThatPassedAllFilters.length; i = i + 1) {
            vId = currentVideoIdsThatPassedAllFilters[i];
            if (vId !== videoId) {
                if (videos[vId].getPlayerStatus() === CONSTANTS.VIDEO_PLAYER_STATUS_PLAYING) {
                    pauseVideo(vId);
                }
            }
        }

        videos[videoId].setPlayerStatus(CONSTANTS.VIDEO_PLAYER_STATUS_PLAYING);

        videos[videoId].getPlayer().seekTo(Math.max(0, videoTime));
        videos[videoId].getPlayer().playVideo();

        enlargeVideoDiv(videoId);

        G.gui.setVideoTitle(videos[videoId].getTitle());
    }

    function pauseVideo(videoId) {
        //clearInterval(videoId);
        videos[videoId].setPlayerStatus(CONSTANTS.VIDEO_PLAYER_STATUS_NOTPLAYING);

        videos[videoId].getPlayer().pauseVideo();

        videos[videoId].clearPlayerTrackingInterval();

        //console.log("video to reset: " + G.lastPlayedYTVideoID);
        resetVideoDiv(videoId);
    }*/


    //var deleteInterval = true;
    function onPlayerStateChange(event) {
        'use strict';

        var newState = event.data, videoId, i,
            currentVideoId = event.target.getVideoData().video_id;

        //console.log("state: " + event.data + "     target: " + event.target.id);

        console.log("OnPlayerStateChange: " + "   " + currentVideoId + "   " + newState);


        if (newState === YT.PlayerState.PLAYING || newState === YT.PlayerState.BUFFERING) {
            if (G.currentPlayingYTVideoID !== event.target.getVideoData().video_id) {
                G.lastPlayedYTVideoID = G.currentPlayingYTVideoID;
                G.currentPlayingYTVideoID = event.target.getVideoData().video_id;
            }

            for (i = 0; i < currentVideoIdsThatPassedAllFilters.length; i = i + 1) {
                videoId = currentVideoIdsThatPassedAllFilters[i];
                if (videoId !== currentVideoId) {
                    if (videos[videoId].getPlayer().getPlayerState() === YT.PlayerState.PLAYING || videos[videoId].getPlayer().getPlayerState() === YT.PlayerState.BUFFERING) {
                        videos[videoId].getPlayer().pauseVideo();
                        console.log("currentVideoId " + currentVideoId + ", clearing " + videoId);
                        videos[videoId].clearPlayerTrackingInterval();
                    }
                }
            }

            videos[currentVideoId].setPlayerTrackingInterval(setInterval(function() {
                var currentVideoTime = VIDEO_MANAGER.getVideo(currentVideoId).getPlayer().getCurrentTime();
                CONTROLLER.updatePosition(currentVideoId, currentVideoTime, CONSTANTS.FORE_RUNNING_TIME);
            }, 500));

            //clearInterval(G.updatePositionInterval);
            //G.updatePositionInterval = setInterval(function() {CONTROLLER.updatePosition();}, 500);

            //console.log("LastPlayedVideo: " + G.lastPlayedYTVideoID + "     current: " + G.currentPlayingYTVideoID);

            resetVideoDiv(G.lastPlayedYTVideoID);

            enlargeVideoDiv(G.currentPlayingYTVideoID);

            gui.setVideoTitle(videos[G.currentPlayingYTVideoID].getTitle());

        } else if (newState === YT.PlayerState.ENDED || newState === YT.PlayerState.PAUSED) {
//            if (deleteInterval) {
//                clearInterval(G.updatePositionInterval);
//            } else {
//                deleteInterval = true;
//            }

            console.log("clearing currentVideoId " + currentVideoId);

            videos[currentVideoId].clearPlayerTrackingInterval();

            //console.log("video to reset: " + G.lastPlayedYTVideoID);
            resetVideoDiv(G.lastPlayedYTVideoID);
        }

    }

    function preloadVideos(scoreId, videos) {
        var i, videoId;
        for (i = 0; i < videos.length; i = i + 1) {
            videoId = videos[i];
            preloadVideo(videoId);
        }
    }

    function loadVideo(videoId) {
        'use strict';

        console.log("Load video: " + videoId);

        videos[videoId].setDisplayStatus(CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY);

        $("#" + getThumbnailDivId(videoId)).remove(); // remove thumbnail div

        $("#" + getVideoDivId(videoId)).css('position', '').css('left', '').css('background-color', 'lightgrey');

        enlargeVideoDiv(videoId);

        if (videos[videoId].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_READY) {
            console.log("id: " + videoId + " already preloaded");

            videos[videoId].getPlayer().seekTo(Math.max(0, G.videoStartPosition[videoId]));
            videos[videoId].getPlayer().playVideo();

            console.log("id: " + videoId + " play");
        }
    }

    function showAndHideVideos() {
        'use strict';

        var videoId;
        for (videoId in G.visibilityOfVideos) {
            if (G.visibilityOfVideos.hasOwnProperty(videoId)) {
                if (G.visibilityOfVideos[videoId]) {
                    //console.log("SHOW");
                    showVideo(videoId);
                } else {
                    if (videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
                        //console.log("Video in ytPlayer: " + videoId);
                        if (videos[videoId].getPlayer().getPlayerState() !== YT.PlayerState.PLAYING && videos[videoId].getPlayer().getPlayerState() !== YT.PlayerState.BUFFERING) {
                            //console.log("HideVideoID: " + videoId + "    state: " + G.ytPlayers[videoId].getPlayerState());
                            hideVideo(videoId);
                        }
                    }
                    if (videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {
                        hideVideo(videoId);
                    }
                }
            }
        }
    }

    function hideVideo(_videoID) {
        'use strict';

        //document.getElementById(_videoID).style.display = "none";
        //document.getElementById(_videoID).style.visibility = "hidden";
        var elementToHide, secondElementToHide, thirdElementToHide;
        if (videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
            elementToHide = document.getElementById(getVideoDivId(_videoID));
            elementToHide.width = 0;
            elementToHide.height = 0;
        }

        if (videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {
            elementToHide = document.getElementById(getThumbnailDivId(_videoID)).firstChild;
            elementToHide.style.width = 0 + "px";
            elementToHide.style.height = 0 + "px";

            secondElementToHide = document.getElementById(getThumbnailDivId(_videoID)).firstChild.firstChild.firstChild;
            secondElementToHide.style.width = 0 + "px";
            secondElementToHide.style.height = 0 + "px";

            thirdElementToHide = document.getElementById(getThumbnailDivId(_videoID)).firstChild.firstChild.lastChild;
            thirdElementToHide.style.width = 0 + "px";
            thirdElementToHide.style.height = 0 + "px";
        }
    }

    function showVideo(_videoID) {
        'use strict';

        //document.getElementById(_videoID).style.display = "";
        //document.getElementById(_videoID).style.visibility = "visible";
        var elementToShow, secondElementToShow, thirdElementToShow,
            pw = Math.ceil(CONSTANTS.VIDEO_WIDTH / 2 - 38.5),
            ph = Math.ceil(CONSTANTS.VIDEO_HEIGHT / 2 + 38.5);

        if (videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
            elementToShow = document.getElementById(getVideoDivId(_videoID));
            elementToShow.width = CONSTANTS.VIDEO_WIDTH;
            elementToShow.height = CONSTANTS.VIDEO_HEIGHT;

            if (videos[_videoID].getPlayer().getPlayerState() === YT.PlayerState.PLAYING || videos[_videoID].getPlayer().getPlayerState() === YT.PlayerState.BUFFERING) {
                elementToShow.width = CONSTANTS.PLAYING_VIDEO_WIDTH;
                elementToShow.height = CONSTANTS.PLAYING_VIDEO_HEIGHT;
            }
        }

        if (videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {
            elementToShow = document.getElementById(getThumbnailDivId(_videoID)).firstChild;
            elementToShow.style.width = CONSTANTS.VIDEO_WIDTH + "px";
            elementToShow.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

            secondElementToShow = document.getElementById(getThumbnailDivId(_videoID)).firstChild.firstChild.firstChild;
            secondElementToShow.style.width = CONSTANTS.VIDEO_WIDTH + "px";
            secondElementToShow.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

            thirdElementToShow = document.getElementById(getThumbnailDivId(_videoID)).firstChild.firstChild.lastChild;
            thirdElementToShow.style.width = 77 + "px";
            thirdElementToShow.style.height = 77 + "px";
            thirdElementToShow.style.marginLeft = pw + "px";
            thirdElementToShow.style.marginTop = "-" + ph + "px";
        }
    }

    me.pausePlayback = function() {
        'use strict';

        var vID, i, currentVideos = currentVideoIdsThatPassedAllFilters;
        for (i = 0; i < currentVideos.length; i = i + 1) {
            vID = currentVideos[i];
            if (videos[vID].getPlayer().getPlayerState() === YT.PlayerState.PLAYING) {
                //console.log(vID + " playing -> pause");
                videos[vID].getPlayer().pauseVideo();
            } else {
                //console.log(vID + " not playing");
            }
        }
    }

    return me;

}(VIDEO_MANAGER || {}));