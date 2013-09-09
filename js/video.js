function enlargeVideoDiv(_videoID, _coefficient) {
    'use strict';

    var elementToEnlarge, secondElementToEnlarge, thumbnail, vID, someVideoPlaying = false,
        newWidth = _coefficient * CONSTANTS.VIDEO_WIDTH,
        newHeight = _coefficient * CONSTANTS.VIDEO_HEIGHT,
        pw=Math.ceil(_coefficient * CONSTANTS.VIDEO_WIDTH/2 - 38.5),
        ph=Math.ceil(_coefficient * CONSTANTS.VIDEO_HEIGHT/2 + 38.5);

    if (GLVARS.ytPlayers.hasOwnProperty(_videoID)) {
        elementToEnlarge = document.getElementById(_videoID);  //.firstChild.firstChild
        elementToEnlarge.width = newWidth;
        elementToEnlarge.height = newHeight;
    }

    if (GLVARS.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
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

    for (vID in GLVARS.ytPlayers) {
        if (GLVARS.ytPlayers.hasOwnProperty(vID) && vID !== _videoID) {
            if (GLVARS.ytPlayers[vID].getPlayerState() === YT.PlayerState.PLAYING || GLVARS.ytPlayers[vID].getPlayerState() === YT.PlayerState.BUFFERING) {
                someVideoPlaying = true;
            }
        }
    }
    if (!someVideoPlaying) {
        $("#videoTitle").text(GLVARS.videoTitle[_videoID]);
    }
}

function resetVideoDiv(_videoID) {
    'use strict';

    var elementToReset, secondElementToReset, thumbnail,
        pw=Math.ceil(CONSTANTS.VIDEO_WIDTH/2 - 38.5),
        ph=Math.ceil(CONSTANTS.VIDEO_HEIGHT/2 + 38.5);

    if (GLVARS.ytPlayers.hasOwnProperty(_videoID)) {
        if (GLVARS.ytPlayers[_videoID].getPlayerState() !== YT.PlayerState.PLAYING && GLVARS.ytPlayers[_videoID].getPlayerState() !== YT.PlayerState.BUFFERING) {
            elementToReset = document.getElementById(_videoID);
            elementToReset.width = CONSTANTS.VIDEO_WIDTH;
            elementToReset.height = CONSTANTS.VIDEO_HEIGHT;
        }
    }

    if (GLVARS.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
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

function onPlayerReady(event) {
    'use strict';

    var videoID = event.target.getVideoData().video_id;
    event.target.seekTo(Math.max(0, GLVARS.videoStartPosition[videoID]));
    event.target.playVideo();
    enlargeVideoDiv(videoID, 2);
    //console.log("OnPlayerReady: " + videoID);
    //GLVARS.ytPlayers[videoID].addEventListener('onStateChange', onPlayerStateChange);
}

var deleteInterval = true;
function onPlayerStateChange(event) {
    'use strict';

    var newState = event.data, videoID;
    //console.log("state: " + event.data + "     target: " + event.target.id);
//    for (var videoID in GLVARS.ytPlayers) {
//        if ( GLVARS.ytPlayers[videoID] == event.target ) {
//            console.log("videoId: " + videoID);
//        }
//    }
//    console.log("videoID: " + event.target.getVideoData().video_id);
//    for (var key in event.target.getVideoData().video_id) {
//        console.log("key: " + key);
//    }

    console.log("OnPlayerStateChange: " + newState );

    if (newState === YT.PlayerState.PLAYING || newState === YT.PlayerState.BUFFERING) {
        GLVARS.currentPlayingYTVideoID = event.target.getVideoData().video_id;

        for (videoID in GLVARS.ytPlayers) {
            if (GLVARS.ytPlayers.hasOwnProperty(videoID)) {
                if (videoID !== GLVARS.currentPlayingYTVideoID) {
                    if (GLVARS.ytPlayers[videoID].getPlayerState() === YT.PlayerState.PLAYING || GLVARS.ytPlayers[videoID].getPlayerState() === YT.PlayerState.BUFFERING) {
                        GLVARS.ytPlayers[videoID].pauseVideo();
                        deleteInterval = false;
                    }
                }
            }
        }
        clearInterval(GLVARS.loopId);
        GLVARS.loopId = setInterval(updatePosition, 500);

        enlargeVideoDiv(GLVARS.currentPlayingYTVideoID, 2);

        $("#videoTitle").text(GLVARS.videoTitle[GLVARS.currentPlayingYTVideoID]);

    } else if (newState === YT.PlayerState.ENDED || newState === YT.PlayerState.PAUSED) {
        if (deleteInterval) {
            clearInterval(GLVARS.loopId);
        } else {
            deleteInterval = true;
        }

        resetVideoDiv(event.target.getVideoData().video_id);
    }

}


function loadVideo(_videoContainerID, _videoID) {
    'use strict';

    //console.log("Video clicked: " + _videoContainerID + "   " + _videoID);
    //$('#' + _videoContainerID).empty();

    var ytplayer = new YT.Player(_videoContainerID, {
        height: CONSTANTS.VIDEO_HEIGHT,
        width: CONSTANTS.VIDEO_WIDTH,
        videoId: _videoID,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

    GLVARS.ytPlayers[_videoID] = ytplayer;
    delete GLVARS.ytPlayerThumbnails[_videoID];
}

function initVideo(_videoContainerID, _videoID) {
    'use strict';

    // Thease are to position the play button centrally.
    var pw=Math.ceil(CONSTANTS.VIDEO_WIDTH/2-38.5),
        ph=Math.ceil(CONSTANTS.VIDEO_HEIGHT/2+38.5);

    // The image+button overlay code.
    var code='<div style="width:'
        + CONSTANTS.VIDEO_WIDTH + 'px; height:' + CONSTANTS.VIDEO_HEIGHT
        + 'px; margin:0 auto"><a href="#"  onclick="loadVideo(\'' + _videoContainerID + '\', \'' + _videoID
        + '\');return false;" id="skipser-youtubevid-' + _videoID + '"><img src="http://i.ytimg.com/vi/'+ _videoID
        + '/hqdefault.jpg" style="width:' + CONSTANTS.VIDEO_WIDTH + 'px; height:'+ CONSTANTS.VIDEO_HEIGHT
        +'px;" /><div class="yt-thumbnail-playbutton" style="margin-left:'
        + pw + 'px; margin-top:-' + ph + 'px;"></div></a></div>';

    // Replace the iframe with a the image+button code.
    var div = document.createElement('div');
    div.innerHTML=code;
    div=div.firstChild;

    document.getElementById(_videoContainerID).appendChild(div);

    GLVARS.ytPlayerThumbnails[_videoID] = div;
}

function initVideos(_allScoreToVideoPairsSyncData) {
    'use strict';

    _allScoreToVideoPairsSyncData.forEach(function (pairSyncData) {
        var videoId = pairSyncData.uri1;

        $('<div>').attr('class', 'yt-videos').attr('id', videoId).appendTo($('#videos'));

        initVideo(videoId, videoId);
    });

    //optimizeYouTubeEmbeds();
}


