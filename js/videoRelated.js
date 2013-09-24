function enlargeVideoDiv(videoId) {
    'use strict';

    if (videoId === "") return;

    var elementToEnlarge, secondElementToEnlarge, thumbnail, vID, someVideoPlaying = false,
        newWidth = CONSTANTS.PLAYING_VIDEO_WIDTH,
        newHeight = CONSTANTS.PLAYING_VIDEO_HEIGHT,
        pw = Math.ceil(CONSTANTS.PLAYING_VIDEO_WIDTH / 2 - 38.5),
        ph = Math.ceil(CONSTANTS.PLAYING_VIDEO_HEIGHT / 2 + 38.5);

    if (G.videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY
        && G.videos[videoId].getThumbnailSizeStatus() !== CONSTANTS.VIDEO_SIZE_STATUS_LARGE) { // enlarge thumbnail

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

        G.videos[videoId].setThumbnailSizeStatus(CONSTANTS.VIDEO_SIZE_STATUS_LARGE);
    }

    if (G.videos[videoId].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY
        && G.videos[videoId].getVideoSizeStatus() !== CONSTANTS.VIDEO_SIZE_STATUS_LARGE) { // enlarge video div
//        elementToEnlarge = document.getElementById(getVideoDivId(videoId));  //.firstChild.firstChild
//        elementToEnlarge.width = newWidth;
//        elementToEnlarge.height = newHeight;
        //console.log("to enlarge: " + videoId);
        $('#' + getVideoDivId(videoId)).animate({
            width: newWidth,
            height: newHeight
        }, CONSTANTS.ANIMATION_TIME );

        G.videos[videoId].setVideoSizeStatus(CONSTANTS.VIDEO_SIZE_STATUS_LARGE);
    }

    for (vID in G.ytPlayers) {
        if (G.ytPlayers.hasOwnProperty(vID) && vID !== videoId && G.videos[vID].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_READY) {
            if (G.ytPlayers[vID].getPlayerState() === YT.PlayerState.PLAYING || G.ytPlayers[vID].getPlayerState() === YT.PlayerState.BUFFERING) {
                someVideoPlaying = true;
            }
        }
    }
    if (!someVideoPlaying) {
        G.gui.setVideoTitle(G.videos[videoId].getTitle());
    }
}

function resetVideoDiv(_videoID) {
    'use strict';

    if (_videoID === "") return;

    var elementToReset, secondElementToReset, thumbnail,
        pw = Math.ceil(CONSTANTS.VIDEO_WIDTH / 2 - 38.5),
        ph = Math.ceil(CONSTANTS.VIDEO_HEIGHT / 2 + 38.5);

    if (G.videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY
        && G.videos[_videoID].getThumbnailSizeStatus() !== CONSTANTS.VIDEO_SIZE_STATUS_NORMAL) { // reset thumbnail
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

        G.videos[_videoID].setThumbnailSizeStatus(CONSTANTS.VIDEO_SIZE_STATUS_NORMAL);
    }

    if (G.videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
        if (G.videos[_videoID].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_READY
            && G.videos[_videoID].getVideoSizeStatus() !== CONSTANTS.VIDEO_SIZE_STATUS_NORMAL
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

            G.videos[_videoID].setVideoSizeStatus(CONSTANTS.VIDEO_SIZE_STATUS_NORMAL);
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


function getThumbnailAndVideoHolderDivId(_videoId) {
    return _videoId + "ThumbnailAndVideoHolder";
}

function getThumbnailDivId(_videoId) {
    return _videoId + "Thumbnail";
}

function getVideoDivId(_videoId) {
    return _videoId + "Video";
}

function createVideoDiv(videoId) {
    $('<div>').attr('class', 'yt-videos')
        .attr('id', getVideoDivId(videoId))
        .css('position', 'absolute').css('left', -1000)
        .appendTo($('#' + getThumbnailAndVideoHolderDivId(videoId)));
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

function preloadVideo(videoId) {

    if (typeof YT === "undefined") {
        setTimeout(function () {
            preloadVideo(videoId);
        }, 250);
        console.log("waiting for YT API to load, retrying in 250ms");
        return;
    }

    if (G.videos[videoId].getLoadingStatus() === CONSTANTS.VIDEO_LOADING_STATUS_UNLOADED) {
        console.log("preload " + videoId);

        G.videos[videoId].setLoadingStatus(CONSTANTS.VIDEO_LOADING_STATUS_LOAD);

        //createVideoDiv(videoId);

        //G.ytPlayers[_videoId] = getNewYoutubePlayer(changedVideoContainerId, _videoId);

        tryToLoad(videoId);
        G.videoLoadingInterval[videoId] = setInterval(function () {
            tryToLoad(videoId);
        }, CONSTANTS.VIDEO_LOADING_WAITING_TIME);
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

function createThumbnailAndVideoHolderDiv(scoreId, videos) {
    var videoId;
    for (videoId in videos) {
        if (videos.hasOwnProperty(videoId) && G.videos[videoId].getAvailability() && !videoIsFilteredOut(scoreId, videoId)) {
            console.log('create thumbnail and video holder ' + videoId);
            $('<div>')
                .attr('id', getThumbnailAndVideoHolderDivId(videoId))
                .appendTo(G.gui.getVideoContainer());
        }
    }
}

function createThumbnailDiv(videoId) {

    var videoContainerID = getThumbnailDivId(videoId),
        thumbnailDiv = G.gui.getThumbnailDiv(videoId);

    $('<div>')
        .attr('id', videoContainerID)
        .attr('class', 'yt-videos')
        .appendTo($('#' + getThumbnailAndVideoHolderDivId(videoId)));

    document.getElementById(videoContainerID).appendChild(thumbnailDiv);
}

function createVideoThumbnails(scoreId, videos) {
    var videoId;
    for (videoId in videos) {
        if (videos.hasOwnProperty(videoId) && G.videos[videoId].getAvailability() && !videoIsFilteredOut(scoreId, videoId)) {
            createThumbnailDiv(videoId);
        }
    }
}

function initVideoDivs(scoreId, videos) {
    var videoId;
    for (videoId in videos) {
        if (videos.hasOwnProperty(videoId) && G.videos[videoId].getAvailability() && !videoIsFilteredOut(scoreId, videoId)) {
            console.log('init video div ' + videoId);
            createVideoDiv(videoId);
        }
    }
}

function preloadVideos(scoreId, videos) {
    var videoId;
    for (videoId in videos) {
        if (videos.hasOwnProperty(videoId) && G.videos[videoId].getAvailability() && !videoIsFilteredOut(scoreId, videoId)) {
            preloadVideo(videoId);
        }
    }
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

function showAndHideVideos() {
    'use strict';

    var videoID;
    for (videoID in G.visibilityOfVideos) {
        if (G.visibilityOfVideos.hasOwnProperty(videoID)) {
            if (G.visibilityOfVideos[videoID]) {
                //console.log("SHOW");
                showVideo(videoID);
            } else {
                if (G.videos[videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
                    //console.log("Video in ytPlayer: " + videoID);
                    if (G.ytPlayers[videoID].getPlayerState() !== YT.PlayerState.PLAYING && G.ytPlayers[videoID].getPlayerState() !== YT.PlayerState.BUFFERING) {
                        //console.log("HideVideoID: " + videoID + "    state: " + G.ytPlayers[videoID].getPlayerState());
                        hideVideo(videoID);
                    }
                }
                if (G.videos[videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {
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
    if (G.videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
        elementToHide = document.getElementById(getVideoDivId(_videoID));
        elementToHide.width = 0;
        elementToHide.height = 0;
    }

    if (G.videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {
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

    if (G.videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_IN_DISPLAY) {
        elementToShow = document.getElementById(getVideoDivId(_videoID));
        elementToShow.width = CONSTANTS.VIDEO_WIDTH;
        elementToShow.height = CONSTANTS.VIDEO_HEIGHT;

        if (G.ytPlayers[_videoID].getPlayerState() === YT.PlayerState.PLAYING || G.ytPlayers[_videoID].getPlayerState() === YT.PlayerState.BUFFERING) {
            elementToShow.width = CONSTANTS.PLAYING_VIDEO_WIDTH;
            elementToShow.height = CONSTANTS.PLAYING_VIDEO_HEIGHT;
        }
    }

    if (G.videos[_videoID].getDisplayStatus() === CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY) {
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


