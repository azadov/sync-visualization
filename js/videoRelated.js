function enlargeVideoDiv(_videoID) {
    'use strict';

    if (_videoID === "") return;

    var elementToEnlarge, secondElementToEnlarge, thumbnail, vID, someVideoPlaying = false,
        newWidth = CONSTANTS.PLAYING_VIDEO_WIDTH,
        newHeight = CONSTANTS.PLAYING_VIDEO_HEIGHT,
        pw = Math.ceil(CONSTANTS.PLAYING_VIDEO_WIDTH / 2 - 38.5),
        ph = Math.ceil(CONSTANTS.PLAYING_VIDEO_HEIGHT / 2 + 38.5);

    if (G.videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY
        && G.videos[_videoID].getSizeStatus() !== CONSTANTS.VIDEO_SIZE_STATUS_LARGE) { // enlarge thumbnail
        elementToEnlarge = document.getElementById(getThumbnailDivId(_videoID)).firstChild;
        elementToEnlarge.style.width = newWidth + "px";
        elementToEnlarge.style.height = newHeight + "px";

        secondElementToEnlarge = document.getElementById(getThumbnailDivId(_videoID)).firstChild.firstChild.firstChild;
        secondElementToEnlarge.style.width = newWidth + "px";
        secondElementToEnlarge.style.height = newHeight + "px";

        thumbnail = document.getElementById(getThumbnailDivId(_videoID)).firstChild.firstChild.lastChild;
        thumbnail.style.marginLeft = pw + "px";
        thumbnail.style.marginTop = "-" + ph + "px";
//        $('#' + getThumbnailDivId(_videoID)).first().animate({
//            width: newWidth + "px",
//            height: newHeight + "px"
//        }, CONSTANTS.ANIMATION_TIME);
//        $('#' + getThumbnailDivId(_videoID)).first().first().first().animate({
//            width: newWidth + "px",
//            height: newHeight + "px"
//        }, CONSTANTS.ANIMATION_TIME);
//        $('#' + getThumbnailDivId(_videoID)).first().first().last().animate({
//            marginLeft: pw + "px",
//            marginTop: "-" + ph + "px"
//        }, CONSTANTS.ANIMATION_TIME);

        G.videos[_videoID].setSizeStatus(CONSTANTS.VIDEO_SIZE_STATUS_LARGE);
    }

    if (G.videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY
        && G.videos[_videoID].getSizeStatus() !== CONSTANTS.VIDEO_SIZE_STATUS_LARGE) { // enlarge video div
//        elementToEnlarge = document.getElementById(getVideoDivId(_videoID));  //.firstChild.firstChild
//        elementToEnlarge.width = newWidth;
//        elementToEnlarge.height = newHeight;
        //console.log("to enlarge: " + _videoID);
        $('#' + getVideoDivId(_videoID)).animate({
            width: newWidth,
            height: newHeight
        }, CONSTANTS.ANIMATION_TIME );

        G.videos[_videoID].setSizeStatus(CONSTANTS.VIDEO_SIZE_STATUS_LARGE);
    }

    for (vID in G.ytPlayers) {
        if (G.ytPlayers.hasOwnProperty(vID) && vID !== _videoID && G.videos[vID].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_READY) {
            if (G.ytPlayers[vID].getPlayerState() === YT.PlayerState.PLAYING || G.ytPlayers[vID].getPlayerState() === YT.PlayerState.BUFFERING) {
                someVideoPlaying = true;
            }
        }
    }
    if (!someVideoPlaying) {
        G.gui.setVideoTitle(G.videos[_videoID].getTitle());
    }
}

function resetVideoDiv(_videoID) {
    'use strict';

    if (_videoID === "") return;

    var elementToReset, secondElementToReset, thumbnail,
        pw = Math.ceil(CONSTANTS.VIDEO_WIDTH / 2 - 38.5),
        ph = Math.ceil(CONSTANTS.VIDEO_HEIGHT / 2 + 38.5);

    if (G.videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY
        && G.videos[_videoID].getSizeStatus() !== CONSTANTS.VIDEO_SIZE_STATUS_NORMAL) { // reset thumbnail
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

        G.videos[_videoID].setSizeStatus(CONSTANTS.VIDEO_SIZE_STATUS_NORMAL);
    }

    if (G.videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
        if (G.videos[_videoID].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_READY
            && G.videos[_videoID].getSizeStatus() !== CONSTANTS.VIDEO_SIZE_STATUS_NORMAL
            && G.ytPlayers[_videoID].getPlayerState() !== YT.PlayerState.PLAYING
            && G.ytPlayers[_videoID].getPlayerState() !== YT.PlayerState.BUFFERING) {
//            elementToReset = document.getElementById(getVideoDivId(_videoID));
//            elementToReset.width = CONSTANTS.VIDEO_WIDTH;
//            elementToReset.height = CONSTANTS.VIDEO_HEIGHT;
            //console.log("to reset: " + _videoID);
            $('#' + getVideoDivId(_videoID)).animate({
                width: CONSTANTS.VIDEO_WIDTH,
                height: CONSTANTS.VIDEO_HEIGHT
            }, CONSTANTS.ANIMATION_TIME );

            G.videos[_videoID].setSizeStatus(CONSTANTS.VIDEO_SIZE_STATUS_NORMAL);
        }
    }
}

function deactivateVideo(_videoID) {
    'use strict';

    var i, rbID;

    d3.selectAll("#" + _videoID + "Rect")
        .style("fill", "lightgrey")
        .on("mouseover", function () {
            return;
        });

    d3.selectAll("#" + _videoID + "Curve")
        .attr("stroke", "lightgrey")
        .on("mouseover", function () {
            return;
        });

    for (i = 0; i < G.radiobuttons.length; i = i + 1) {
        if (G.radiobuttons[i].videoID === _videoID) {
            rbID = G.radiobuttons[i].videoID + "_" + G.radiobuttons[i].segmentIndex + "_RB";
            document.getElementById(rbID).disabled = true;
        }
    }
}

function getThumbnailDivId(_videoId) {
    return _videoId + "Thumbnail";
}

function getVideoDivId(_videoId) {
    return _videoId + "Video";
}

function getPreloadedVideoContainerID(_videoID) {
    return _videoID + "_p";
}

function createVideoDiv(_videoID) {
    $('<div>').attr('class', 'yt-videos').attr('id', getVideoDivId(_videoID))
        .css('position', 'absolute').css('left', -1000)
        .appendTo(G.gui.getVideoContainer());
}

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

function preloadVideo(_videoId) {
    if (typeof YT === "undefined") {
        setTimeout(function () {
            preloadVideo(_videoId);
        }, 250);
        console.log("waiting for YT API to load, retrying in 250ms");
        return;
    }

    if (G.videos[_videoId].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_UNLOADED) {
        console.log("preload " + _videoId);

        G.videos[_videoId].setLoadingStatus(CONSTANTS.VIDEO_LOADING_STATUS_LOAD);

        createVideoDiv(_videoId);

        //G.ytPlayers[_videoId] = getNewYoutubePlayer(changedVideoContainerId, _videoId);

        tryToLoad(_videoId);
        G.videoLoadingInterval[_videoId] = setInterval(function () {
            tryToLoad(_videoId);
        }, CONSTANTS.VIDEO_LOADING_WAITING_TIME);
    }
}

function tryToLoad(_videoID) {
    'use strict';

    var videoContainerID = getVideoDivId(_videoID), player;

    if (G.videos[_videoID].getLoadingStatus() !== CONSTANTS.VIDEO_LOADING_STATUS_READY && G.videos[_videoID].getNumOfLoadingAttempts() === 3) {
        deactivateVideo(_videoID);
        clearInterval(G.videoLoadingInterval[_videoID]);
        console.log("VideoID: " + _videoID + "   deactivate");
    } else if (G.videos[_videoID].getLoadingStatus()!== CONSTANTS.VIDEO_LOADING_STATUS_READY && G.videos[_videoID].getNumOfLoadingAttempts() < 3) {

        console.log("VideoID: " + _videoID + "   LoadingAttempts: " + G.videos[_videoID].getNumOfLoadingAttempts() + "   VideoContainer: " + videoContainerID);
        //G.ytPlayers[_videoID] = getNewYoutubePlayer(videoContainerID, _videoID);
        player = getNewYoutubePlayer(videoContainerID, _videoID);

        G.videos[_videoID].increaseNumOfLoadingAttempts();
    }
}

function onPlayerError(event) {
    'use strict';

    //console.log("OnPlayerError: " + event.data + "      VideoID: " + event.target.getVideoData().video_id);
    var videoID = event.target.getVideoData().video_id;
    console.log("OnPlayerError: " + event.target.getVideoData().video_id);
    deactivateVideo(videoID);
    clearInterval(G.videoLoadingInterval[videoID]);
}


function onPlayerReady(event) {
    'use strict';

    var videoID = event.target.getVideoData().video_id;

    event.target.seekTo(Math.max(0, G.videoStartPosition[videoID]));

    console.log("onPlayerReady: " + videoID);

    if (G.videos[videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {
        console.log("       " + videoID + " out of display -> pause");
        event.target.pauseVideo();
    } else if (G.videos[videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
        console.log("       " + videoID + " in display -> play");
        event.target.playVideo();
        enlargeVideoDiv(videoID);
    }

    G.videos[videoID].setLoadingStatus(CONSTANTS.VIDEO_LOADING_STATUS_READY);

    G.videos[videoID].setPlayer(event.target);

    G.ytPlayers[videoID] = event.target;

    clearInterval(G.videoLoadingInterval[videoID]);
}

var deleteInterval = true;
function onPlayerStateChange(event) {
    'use strict';

    var newState = event.data, videoID;
    //console.log("state: " + event.data + "     target: " + event.target.id);

    console.log("OnPlayerStateChange: " + "   " + event.target.getVideoData().video_id + "   " + newState);


    if (newState === YT.PlayerState.PLAYING || newState === YT.PlayerState.BUFFERING) {
        if (G.currentPlayingYTVideoID !== event.target.getVideoData().video_id) {
            G.lastPlayedYTVideoID = G.currentPlayingYTVideoID;
            G.currentPlayingYTVideoID = event.target.getVideoData().video_id;
        }

        for (videoID in G.ytPlayers) {
            if (G.ytPlayers.hasOwnProperty(videoID)) {
                if (videoID !== G.currentPlayingYTVideoID) {
                    if (G.ytPlayers[videoID].getPlayerState() === YT.PlayerState.PLAYING || G.ytPlayers[videoID].getPlayerState() === YT.PlayerState.BUFFERING) {
                        G.ytPlayers[videoID].pauseVideo();
                        deleteInterval = false;

                    }
                }
            }
        }
        clearInterval(G.updatePositionInterval);
        G.updatePositionInterval = setInterval(function() {CONTROLLER.updatePosition();}, 500);

        //console.log("LastPlayedVideo: " + G.lastPlayedYTVideoID + "     current: " + G.currentPlayingYTVideoID);

        resetVideoDiv(G.lastPlayedYTVideoID);

        enlargeVideoDiv(G.currentPlayingYTVideoID);

        G.gui.setVideoTitle(G.videos[G.currentPlayingYTVideoID].getTitle());

    } else if (newState === YT.PlayerState.ENDED || newState === YT.PlayerState.PAUSED) {
        if (deleteInterval) {
            clearInterval(G.updatePositionInterval);
        } else {
            deleteInterval = true;
        }
        //console.log("video to reset: " + G.lastPlayedYTVideoID);
        resetVideoDiv(G.lastPlayedYTVideoID);
    }

}


function loadVideo(_videoID) {
    'use strict';

    var videoContainerID = _videoID;

    delete G.ytPlayerThumbnails[_videoID];

    console.log("Load video: " + _videoID);

    G.videos[_videoID].setDisplayStatus(CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY);

    $("#" + getThumbnailDivId(_videoID)).remove(); // remove thumbnail div

    $("#" + getVideoDivId(_videoID)).css('position', '').css('left', '').css('background-color', 'lightgrey');

    if (G.videos[_videoID].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_READY) {
        console.log("id: " + _videoID + " already preloaded");

        G.ytPlayers[_videoID].seekTo(Math.max(0, G.videoStartPosition[_videoID]));
        G.ytPlayers[_videoID].playVideo();

        enlargeVideoDiv(_videoID);

        console.log("id: " + _videoID + " play");
    } //else {
//        console.log("");
//        G.videoLoadingInterval[_videoID] = setInterval(function () {
//            tryToLoad(videoContainerID, _videoID);
//        }, CONSTANTS.VIDEO_LOADING_WAITING_TIME);
//    }
}

function createThumbnailDiv(_videoID) {


    var videoContainerID = getThumbnailDivId(_videoID), thumbnailDiv = G.gui.getThumbnailDiv(_videoID);

    $('<div>').attr('class', 'yt-videos').attr('id', videoContainerID)
        .appendTo(G.gui.getVideoContainer());

    document.getElementById(videoContainerID).appendChild(thumbnailDiv);

    G.ytPlayerThumbnails[_videoID] = thumbnailDiv;
}

function initVideos(scoreId, alignedVideos) {
    'use strict';

    if (typeof YT === "undefined") {
        setTimeout(function () {
            initVideos(scoreId, alignedVideos);
        }, 250);
        console.log("waiting for YT API to load, retrying in 250ms");
        return;
    }

    var videoId;
    for (videoId in alignedVideos) {
        if (alignedVideos.hasOwnProperty(videoId) && G.videos[videoId].getAvailability() && !videoIsFilteredOut(scoreId, videoId)) {
            console.log('initializing video ' + videoId);

            createThumbnailDiv(videoId);

            preloadVideo(videoId);
        }
    }
    //optimizeYouTubeEmbeds();
}

function showAndHideVideos() {
    'use strict';

    var videoID;
    for (videoID in G.visibilityOfVideos) {
        if (G.visibilityOfVideos.hasOwnProperty(videoID)) {
            if (G.visibilityOfVideos[videoID]) {
                //console.log("SHOW");
                showVideo(videoID);
            } else {
                if (G.ytPlayers.hasOwnProperty(videoID)) {
                    //console.log("Video in ytPlayer: " + videoID);
                    if (G.ytPlayers[videoID].getPlayerState() !== YT.PlayerState.PLAYING && G.ytPlayers[videoID].getPlayerState() !== YT.PlayerState.BUFFERING) {
                        //console.log("HideVideoID: " + videoID + "    state: " + G.ytPlayers[videoID].getPlayerState());
                        hideVideo(videoID);
                    }
                }
                if (G.ytPlayerThumbnails.hasOwnProperty(videoID)) {
                    hideVideo(videoID);
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
    if (G.ytPlayers.hasOwnProperty(_videoID)) {
        elementToHide = document.getElementById(_videoID);
        elementToHide.width = 0;
        elementToHide.height = 0;
    }

    if (G.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
        elementToHide = document.getElementById(_videoID).firstChild;
        elementToHide.style.width = 0 + "px";
        elementToHide.style.height = 0 + "px";

        secondElementToHide = document.getElementById(_videoID).firstChild.firstChild.firstChild;
        secondElementToHide.style.width = 0 + "px";
        secondElementToHide.style.height = 0 + "px";

        thirdElementToHide = document.getElementById(_videoID).firstChild.firstChild.lastChild;
        thirdElementToHide.style.width = 0 + "px";
        thirdElementToHide.style.height = 0 + "px";
    }
}

function showVideo(_videoID) {
    'use strict';

    //document.getElementById(_videoID).style.display = "";
    //document.getElementById(_videoID).style.visibility = "visible";
    var elementToShow, secondElementToShow, thirdElementToShow;
    if (G.ytPlayers.hasOwnProperty(_videoID)) {
        elementToShow = document.getElementById(_videoID);
        elementToShow.width = CONSTANTS.VIDEO_WIDTH;
        elementToShow.height = CONSTANTS.VIDEO_HEIGHT;

        if (G.ytPlayers[_videoID].getPlayerState() === YT.PlayerState.PLAYING || G.ytPlayers[_videoID].getPlayerState() === YT.PlayerState.BUFFERING) {
            elementToShow.width = CONSTANTS.PLAYING_VIDEO_WIDTH;
            elementToShow.height = CONSTANTS.PLAYING_VIDEO_HEIGHT;
        }
    }

    if (G.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
        elementToShow = document.getElementById(_videoID).firstChild;
        elementToShow.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        elementToShow.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

        secondElementToShow = document.getElementById(_videoID).firstChild.firstChild.firstChild;
        secondElementToShow.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        secondElementToShow.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

        thirdElementToShow = document.getElementById(_videoID).firstChild.firstChild.lastChild;
        thirdElementToShow.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        thirdElementToShow.style.height = CONSTANTS.VIDEO_HEIGHT + "px";
    }
}

function pausePlayback() {
    'use strict';

//    for (var videoID in G.visibilityOfVideos) {
//        if ( G.visibilityOfVideos[videoID] ) {
//            G.ytPlayers[videoID].pauseVideo();}
//    }
    var vID;
    for (vID in G.ytPlayers) {
        if (G.ytPlayers.hasOwnProperty(vID)) {
            if (G.ytPlayers[vID].getPlayerState() === YT.PlayerState.PLAYING) {
                G.ytPlayers[vID].pauseVideo();
            }
        }
    }
}


function showSuitableVideoDivsForPlotPosition(currentMouseXPoint, currentMouseYPoint) {
    'use strict';


        var yAboveMousePoint = G.maxPlotY,
        yUnderMousePoint = 0,
        videoIDAbove = "",
        videoIDUnder = "",
        videoSegmentAbove,
        videoSegmentUnder,
        i,
        id,
        currentSegment,
        yAb,
        yUn,
        videoToEnlarge = "";


    calculateVisibilityOfVideos(currentMouseXPoint);

    if (gui.shouldHideVideos()) {
        showAndHideVideos();
    }


    for (i = 0; i < G.allVideoSegments.length; i = i + 1) {
        currentSegment = G.allVideoSegments[i];
        if (currentMouseXPoint >= currentSegment.x1 && currentMouseXPoint <= currentSegment.x2) {
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

    if (videoIDUnder === "" && videoIDAbove === "")  {
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

    if (G.ytPlayerThumbnails.hasOwnProperty(videoToEnlarge)) {
        enlargeVideoDiv(videoToEnlarge);
    } else  if (G.ytPlayers.hasOwnProperty(videoToEnlarge)) {
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

function calculateVisibilityOfVideos(_scoreTime) {
    'use strict';

    var videoID, i, minX, maxX;
    for (videoID in G.visibilityOfVideos) {
        //console.log(videoID + "                   " + G.visibilityOfVideos[videoID]);
        if (G.visibilityOfVideos.hasOwnProperty(videoID)) {
            G.visibilityOfVideos[videoID] = false;
        }
    }

    for (i = 0; i < G.allVideoSegments.length; i = i + 1) {
        if (_scoreTime >= G.allVideoSegments[i].x1 && _scoreTime <= G.allVideoSegments[i].x2) {
            G.visibilityOfVideos[G.allVideoSegments[i].videoID] = true;
        }
    }

    for (i = 0; i < G.curves.length; i = i + 1) {
        minX = Math.min(G.curves[i].points[0].x, G.curves[i].points[5].x);
        maxX = Math.max(G.curves[i].points[0].x, G.curves[i].points[5].x);

        if (_scoreTime >= minX && _scoreTime <= maxX) {
            G.visibilityOfVideos[G.curves[i].videoID] = true;
        }
    }
}


function updateVideoPositionCurve(d) {
    'use strict';

    console.log("videoID curve: " + d.videoID);
}

function enlargeVideoDivRect(d) {
    'use strict';

    //console.log("videoID rect: " + d.videoID);
    enlargeVideoDiv(d.videoID);
    gui.setSegmentQuality(d.segmentConfidence);
}

function enlargeVideoDivCurve(d) {
    'use strict';

    //console.log("videoID rect: " + d[0].videoID);
    enlargeVideoDiv(d.videoID);
}


function resetVideoDivRect(d) {
    'use strict';

    resetVideoDiv(d.videoID);
}

function resetVideoDivCurve(d) {
    'use strict';

    resetVideoDiv(d.videoID);
}

