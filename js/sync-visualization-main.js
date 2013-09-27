var gui;

// we have four modules that control functionality in our application
// SCORE_MANAGER, VIDEO_MANAGER, PLOT, CONTROLS, CONTROLLER;


// they communicate via an interface
var MessageBus;

var MessageBus = (function() {
    var me = {};

    return me;
}());

gui = G.gui;

CONTROLLER.init();


function videoIsFilteredOut(scoreId, videoId) {
    return VIDEO_MANAGER.getVideo(videoId).getTitle().toLowerCase().indexOf(gui.getVideoTitleFilterString().toLowerCase()) == -1 ||
        CONTROLLER.getSyncedVideosForScore(scoreId)[videoId].confidence < gui.getAlignmentQualityFilter() ||
           !VIDEO_MANAGER.getVideo(videoId).getAvailability();
}


function clearVideoAndPlotState() {
    'use strict';

    G.mouseTrackLineExist = false;
    G.videoTrackLineExist = false;
    G.numberOfVideoSegmentLevels = 1;
    G.allVideoSegments = [];
    G.curves = [];
    G.radiobuttons = [];
    G.visibilityOfVideos = {};
    G.videoTimeMaps = {};
    G.videoStatus = {};
    G.maxPlotX = 0;
    G.ytPlayers = {};
    G.ytPlayerThumbnails = {};
    G.videoReadiness = {};
    G.videoNumOfLoadingAttempts = {};
    G.averageVelocity = [];
    G.velocities = [];
}


function computePlotElements(scoreId, syncPairs) {
    'use strict';

    for (var videoId in syncPairs) {
        if (syncPairs.hasOwnProperty(videoId)) {
            computePlotElementsForVideo(scoreId, videoId);
        }
    }
}


function computePlotElementsForVideo(scoreId, videoId) {
    var videoSegments = [],
        alignment = CONTROLLER.getAlignment(scoreId, videoId),
        segment, videoSegment, confidence;

    if (!VIDEO_MANAGER.videoExist(videoId) || !VIDEO_MANAGER.getVideo(videoId).getAvailability()
        || videoIsFilteredOut(scoreId, videoId)) {
        return;
    }

    G.visibilityOfVideos[videoId] = G.visibilityOfVideos[videoId] ? G.visibilityOfVideos[videoId] : false;
    G.videoTimeMaps[videoId] = G.videoTimeMaps[videoId] ? G.videoTimeMaps[videoId] : alignment.localTimeMaps;
    G.videoStartPosition[videoId] = G.videoStartPosition[videoId] ? G.videoStartPosition[videoId] : 0;
    G.videoReadiness[videoId] = G.videoReadiness[videoId] ? G.videoReadiness[videoId] : 0;
    G.videoNumOfLoadingAttempts[videoId] = G.videoNumOfLoadingAttempts[videoId] ? G.videoNumOfLoadingAttempts[videoId] : 0;
    if (typeof YT.PlayerState !== "undefined") {
        G.videoStatus[videoId] = G.videoStatus[videoId] ? G.videoStatus[videoId] : YT.PlayerState.PAUSED;
    } else {
        G.videoStatus[videoId] = G.videoStatus[videoId] ? G.videoStatus[videoId] : 2;
    }

    // iterating over video segments, creating their rendering data
    for (segment = 0; segment < alignment.localTimeMaps.length; segment = segment + 1) {
        confidence = Math.min(alignment.confidences[segment][0], alignment.confidences[segment][1]);
        videoSegment = createVideoSegment(alignment.localTimeMaps[segment], videoId, segment, confidence);
        videoSegments.push(videoSegment);
    }

    videoSegments = sortRects(videoSegments);

    assignSegmentYCoordinates(videoSegments);

    createSegmentConnections(videoSegments, videoId);

    createSegmentSwitches(videoSegments, videoId);

    appendArrays(G.allVideoSegments, videoSegments);

    console.log("video " + videoId + " is in process");
}
