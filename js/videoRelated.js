
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



function createThumbnailAndVideoHolderDiv(scoreId, videos) {
    var i, videoId;
    for (i = 0; i < videos.length; i = i + 1) {
        videoId = videos[i];
        console.log('create thumbnail and video holder ' + videoId);
        $('<div>')
            .attr('id', getThumbnailAndVideoHolderDivId(videoId))
            .appendTo(G.gui.getVideoContainer());
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
    var i, videoId;
    for (i = 0; i <  videos.length; i = i + 1) {
        videoId = videos[i];
        console.log("create thumbnail: " + videoId);
        createThumbnailDiv(videoId);
    }
}

function initVideoDivs(scoreId, videos) {
    var i, videoId;
    for (i = 0; i < videos.length; i = i + 1) {
        videoId = videos[i];
        console.log('init video div ' + videoId);
        createVideoDiv(videoId);
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


