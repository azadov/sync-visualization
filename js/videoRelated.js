function enlargeVideoDiv(_videoID) {
    'use strict';

    var elementToEnlarge, secondElementToEnlarge, thumbnail, vID, someVideoPlaying = false,
        newWidth = CONSTANTS.PLAYING_VIDEO_WIDTH,
        newHeight = CONSTANTS.PLAYING_VIDEO_HEIGHT,
        pw = Math.ceil(CONSTANTS.PLAYING_VIDEO_WIDTH / 2 - 38.5),
        ph = Math.ceil(CONSTANTS.PLAYING_VIDEO_HEIGHT / 2 + 38.5);

    if (G.ytPlayers.hasOwnProperty(_videoID)) {
        elementToEnlarge = document.getElementById(_videoID);  //.firstChild.firstChild
        elementToEnlarge.width = newWidth;
        elementToEnlarge.height = newHeight;
    }

    if (G.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
        elementToEnlarge = document.getElementById(_videoID).firstChild;
        elementToEnlarge.style.width = newWidth + "px";
        elementToEnlarge.style.height = newHeight + "px";

        secondElementToEnlarge = document.getElementById(_videoID).firstChild.firstChild.firstChild;
        secondElementToEnlarge.style.width = newWidth + "px";
        secondElementToEnlarge.style.height = newHeight + "px";

        thumbnail = document.getElementById(_videoID).firstChild.firstChild.lastChild;
        thumbnail.style.marginLeft = pw + "px";
        thumbnail.style.marginTop = "-" + ph + "px";
    }

    for (vID in G.ytPlayers) {
        if (G.ytPlayers.hasOwnProperty(vID) && vID !== _videoID) {
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

    var elementToReset, secondElementToReset, thumbnail,
        pw = Math.ceil(CONSTANTS.VIDEO_WIDTH / 2 - 38.5),
        ph = Math.ceil(CONSTANTS.VIDEO_HEIGHT / 2 + 38.5);

    if (G.ytPlayers.hasOwnProperty(_videoID)) {
        if (G.ytPlayers[_videoID].getPlayerState() !== YT.PlayerState.PLAYING && G.ytPlayers[_videoID].getPlayerState() !== YT.PlayerState.BUFFERING) {
            elementToReset = document.getElementById(_videoID);
            elementToReset.width = CONSTANTS.VIDEO_WIDTH;
            elementToReset.height = CONSTANTS.VIDEO_HEIGHT;
        }
    }

    if (G.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
        elementToReset = document.getElementById(_videoID).firstChild;
        elementToReset.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        elementToReset.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

        secondElementToReset = document.getElementById(_videoID).firstChild.firstChild.firstChild;
        secondElementToReset.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        secondElementToReset.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

        thumbnail = document.getElementById(_videoID).firstChild.firstChild.lastChild;
        thumbnail.style.marginLeft = pw + "px";
        thumbnail.style.marginTop = "-" + ph + "px";
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

function tryToLoad(_videoContainerID, _videoID) {
    'use strict';

    var ytplayer;
    if (G.videoReadiness[_videoID] === 0 && G.videoNumOfLoadingAttempts[_videoID] === 3) {
        deactivateVideo(_videoID);
        clearInterval(G.videoLoadingInterval[_videoID]);
        //console.log("VideoID: " + _videoID + "   deactivate");
    } else if (G.videoReadiness[_videoID] === 0 && G.videoNumOfLoadingAttempts[_videoID] < 3) {

        //console.log("VideoID: " + _videoID + "    Attempt: " + G.videoNumOfLoadingAttempts[_videoID]);

        ytplayer = new YT.Player(_videoContainerID, {
            height: CONSTANTS.VIDEO_HEIGHT,
            width: CONSTANTS.VIDEO_WIDTH,
            videoId: _videoID,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });

        G.ytPlayers[_videoID] = ytplayer;

        G.videoNumOfLoadingAttempts[_videoID] = G.videoNumOfLoadingAttempts[_videoID] + 1;
    }
}

function onPlayerError(event) {
    'use strict';

    //console.log("OnPlayerError: " + event.data + "      VideoID: " + event.target.getVideoData().video_id);
    var videoID = event.target.getVideoData().video_id;

    deactivateVideo(videoID);
    clearInterval(G.videoLoadingInterval[_videoID]);
}

function onPlayerReady(event) {
    'use strict';

    var videoID = event.target.getVideoData().video_id;
    event.target.seekTo(Math.max(0, G.videoStartPosition[videoID]));
    event.target.playVideo();

    enlargeVideoDiv(videoID);

    G.videoReadiness[videoID] = 1;

    clearInterval(G.videoLoadingInterval[videoID]);

    //console.log("OnPlayerReady: " + videoID);
    //G.ytPlayers[videoID].addEventListener('onStateChange', onPlayerStateChange);
}

var deleteInterval = true;
function onPlayerStateChange(event) {
    'use strict';

    var newState = event.data, videoID;
    //console.log("state: " + event.data + "     target: " + event.target.id);
//    for (var videoID in G.ytPlayers) {
//        if ( G.ytPlayers[videoID] == event.target ) {
//            console.log("videoId: " + videoID);
//        }
//    }
//    console.log("videoID: " + event.target.getVideoData().video_id);
//    for (var key in event.target.getVideoData().video_id) {
//        console.log("key: " + key);
//    }

    console.log("OnPlayerStateChange: " + newState);

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
        clearInterval(G.loopId);
        G.loopId = setInterval(updatePosition, 500);

        //console.log("LastPlayedVideo: " + G.lastPlayedYTVideoID + "     current: " + G.currentPlayingYTVideoID);

        resetVideoDiv(G.lastPlayedYTVideoID);

        enlargeVideoDiv(G.currentPlayingYTVideoID);

        G.gui.setVideoTitle(G.videos[G.currentPlayingYTVideoID].getTitle());

    } else if (newState === YT.PlayerState.ENDED || newState === YT.PlayerState.PAUSED) {
        if (deleteInterval) {
            clearInterval(G.loopId);
        } else {
            deleteInterval = true;
        }

        resetVideoDiv(G.lastPlayedYTVideoID);
    }

}


function loadVideo(_videoContainerID, _videoID) {
    'use strict';

    //console.log("Video clicked: " + _videoContainerID + "   " + _videoID);
    //$('#' + _videoContainerID).empty();

    delete G.ytPlayerThumbnails[_videoID];

    G.videoLoadingInterval[_videoID] = setInterval(function () {
        tryToLoad(_videoContainerID, _videoID);
    }, 1000);
}

function initVideo(_videoContainerID, _videoID) {
    'use strict';

    var thumbnailDiv = G.gui.getThumbnailDiv(_videoContainerID, _videoID);

    document.getElementById(_videoContainerID).appendChild(thumbnailDiv);

    G.ytPlayerThumbnails[_videoID] = thumbnailDiv;
}

function initVideos(scoreId, alignedVideos) {
    'use strict';

    if (typeof YT === 'undefined') {
        setTimeout(function () {
            initVideos(scoreId, alignedVideos);
        }, 250);
        console.log("waiting for YT API to load, retrying in 250ms");
        return;
    }

    for (var videoId in alignedVideos) {
        if (alignedVideos.hasOwnProperty(videoId) && G.videos[videoId].getAvailability() && !videoIsFilteredOut(scoreId, videoId)) {

            $('<div>').attr('class', 'yt-videos').attr('id', videoId).appendTo($('#videos'));

            console.log('initializing video ' + videoId);
            initVideo(videoId, videoId);
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


function showSuitableVideoDivsForCurrentMousePosition() {
    'use strict';

    var currentMouseXPoint = G.x_scale.invert(d3.mouse(this)[0]),
        currentMouseYPoint = G.y_scale.invert(d3.mouse(this)[1]),
        yAboveMousePoint = G.maxPlotY,
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
        factor = 0,
        videoToEnlarge = "";

    //console.log("hide video ID " + currentMouseXPoint);
    calculateVisibilityOfVideoIDs(currentMouseXPoint);

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
        return;
    }
    //console.log("above: " + videoIDAbove + "  yAb: " + yAboveMousePoint + "        under: " + videoIDUnder + "  yUn: " + yUnderMousePoint);
    factor = 1;
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
    if (G.ytPlayers.hasOwnProperty(videoToEnlarge)) {
        if (G.ytPlayers[videoToEnlarge].getPlayerState() !== YT.PlayerState.PLAYING && G.ytPlayers[videoToEnlarge].getPlayerState() !== YT.PlayerState.BUFFERING) {
            enlargeVideoDiv(videoToEnlarge);
        }
    } else if (G.ytPlayerThumbnails.hasOwnProperty(videoToEnlarge)) {
        enlargeVideoDiv(videoToEnlarge);
    }

    if (!gui.shouldHideVideos()) {
        for (id in G.visibilityOfVideos) {
            if (G.visibilityOfVideos.hasOwnProperty(id)) {
                //if (id !== videoIDAbove && id !== videoIDUnder) {
                if (id !== videoToEnlarge) {
                    resetVideoDiv(id);
                }
            }
        }
    }

    G.videoIDNextToCursor = videoToEnlarge;
}

function calculateVisibilityOfVideoIDs(_scoreTime) {
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
        .fail(function(jqxhr, textStatus, error) {
            G.videos[videoId].setTitle("Data not available");
            G.videos[videoId].setAvailability(true);
            counter.increment();
        });
}