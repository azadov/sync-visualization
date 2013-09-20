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
    return G.videos[videoId].getTitle().toLowerCase().indexOf(gui.getVideoTitleFilterString().toLowerCase()) == -1 ||
        G.syncPairs[scoreId][videoId].confidence < gui.getAlignmentQualityFilter() || 
        !G.videos[videoId].getAvailability();
}


function loadAlignmentList(onSuccess, onFailure) {

    $.getJSON('IMSLP-YT-AlignmentQuality.json', function (json) {
        'use strict';

        var i, scoreId, videoId,
            alignmentFileName,
            confidence, video;

        for (i = 0; i < json.length; i = i + 1) {
            scoreId = json[i].id0;
            videoId = json[i].id1;
            alignmentFileName = "alignments/" + scoreId + '_' + videoId + '.json';
            confidence = json[i].minConfidence;

            video = new Video(videoId);

            G.videos[videoId] = video;

            G.syncPairs[scoreId] = G.syncPairs[scoreId] ? G.syncPairs[scoreId] : {};
            G.syncPairs[scoreId][videoId] = {alignmentFileName: alignmentFileName, confidence: confidence};
        }
    })
        .done(onSuccess)
        .fail(onFailure)
    ;
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

    if (!G.videos.hasOwnProperty(videoId) || !G.videos[videoId].getAvailability() ||
        videoIsFilteredOut(scoreId, videoId)) {
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
