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

    var div = G.gui.getThumbnailDiv(_videoContainerID, _videoID);

    document.getElementById(_videoContainerID).appendChild(div);

    G.ytPlayerThumbnails[_videoID] = div;
}

function initVideos(scoreId, alignedVideos) {
    'use strict';

    if (!YT) {
        setTimeout(function() {
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


