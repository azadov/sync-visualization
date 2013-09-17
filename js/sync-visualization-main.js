var gui;

// we have four modules that control functionality in our application
// SCORE_MANAGER, VIDEO_MANAGER, PLOT, CONTROLS, CONTROLLER;


// they communicate via an interface
var MessageBus;

var MessageBus = (function() {
    var me = {};

    return me;
}());

function main() {

    gui = G.gui;

    CONTROLLER.init();



    loadAlignmentList(function onSuccess() {

        console.log("alignment list loaded");

        populateScoreSelectionDropdown();

        prepareVideosForScore(G.defaultScoreID);

    }, function onFailure() {
        console.log("couldn't load alignment json file!");
    });
}

main();

function prepareVideosForScore(scoreId) {
    console.log("preparing videos for score " + scoreId);
    checkVideoAvailabilities(scoreId, function () {
        onVideoAvailabilityChecked(scoreId);
    });
}

function onVideoAvailabilityChecked(scoreId) {
    console.log("video availability checked for score " + scoreId);
    console.log(G.videos);
    getAlignments(scoreId, function () {
        onAlignmentsFetched(scoreId)();
    });
}

function onAlignmentsFetched(scoreId) {
    return function () {
        initializeVisualization(scoreId);
    };
}

function initializeVisualization(scoreId) {
    console.log("interface for " + scoreId);

    clearVideoAndPlotState();
    gui.resetScoreDOM();

    loadScoreInViewer(scoreId);

    calculateSegmentVelocity(scoreId);

    computePlotElements(scoreId, G.syncPairs[scoreId]);
    computePlotDimensions();
    drawPlot(scoreId);

    initVideos(scoreId, G.syncPairs[scoreId]);
}

function videoIsFilteredOut(scoreId, videoId) {
    return G.videos[videoId].getTitle().toLowerCase().indexOf(gui.getVideoTitleFilterString().toLowerCase()) == -1 ||
        G.syncPairs[scoreId][videoId].confidence < gui.getAlignmentQualityFilter() || !G.videos[videoId].getAvailability();
}

function populateScoreSelectionDropdown() {
    var scoreId;
    for (scoreId in G.syncPairs) {
        if (G.syncPairs.hasOwnProperty(scoreId)) {
            gui.addScoreToDropdown(scoreId);
        }
    }
}


function initScoreViewer() {
    var pnsv = document.createElement('script');
    pnsv.type = 'text/javascript';
    pnsv.async = true;
    pnsv.src = 'http://pchnote.appspot.com/scoreviewer/scoreviewer.nocache.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(pnsv);
}

function configureScoreViewer() {
    window._pnq = window._pnq || [];
    _pnq.push(['rootElement', 'PeachnoteViewerContainerId']);
    _pnq.push(['widgetHeight', 620]);
    _pnq.push(['widgetWidth', 450]);
    _pnq.push(['addMeasureClickHandler', measureClickHandler]);
}


function bindScoreFilterInputWithFilteringAction() {

    gui.addScoreDropdownChangeCallback(function () {
        prepareVideosForScore(gui.getSelectedScoreId())
    });

    gui.addAlignmentQualityChangeCallback(function () {
        initializeVisualization(gui.getSelectedScoreId());
    });

    gui.addVideoTitleChangeCallback(function () {
        initializeVisualization(gui.getSelectedScoreId());
    });
}

function initQualityFilterDropdown() {
    var qualities = [0, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];
    gui.populateQualityFilter(qualities)
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


function fetchAlignmentData(scoreId, videoId, jsonPath, counter) {
    $.getJSON(jsonPath)
        .done(function (json) {
            G.alignments.add(scoreId, videoId, json);
            counter.increment();
        })
        .fail(function (jqxhr, textStatus, error) {
            counter.increment();
        });
}


function getAlignments(scoreId, onAlignmentsFetched) {
    var syncedVideos = G.syncPairs[scoreId],
        counter = new FiringCounter(Object.keys(syncedVideos).length, onAlignmentsFetched),
        videoId, jsonPath;

    for (videoId in syncedVideos) {
        if (syncedVideos.hasOwnProperty(videoId)) {

            console.log(G.videos[videoId]);

            if (!G.videos[videoId].getAvailability() ||
                G.videos[videoId].getTitle().indexOf(gui.getVideoTitleFilterString()) == -1 ||
                syncedVideos[videoId].quality < gui.getAlignmentQualityFilter() ||
                G.alignments.get(scoreId, videoId)
                ) {
                counter.increment();
                continue;
            }

            jsonPath = syncedVideos[videoId].alignmentFileName;
            fetchAlignmentData(scoreId, videoId, jsonPath, counter);
        }
    }
}

function checkVideoAvailabilities(scoreId, onDone) {
    var videoProperties = G.syncPairs[scoreId],
        counter = new FiringCounter(Object.keys(videoProperties).length, onDone),
        videoId;

    for (videoId in videoProperties) {
        if (videoProperties.hasOwnProperty(videoId)) {
            checkYouTubeVideoAvailability(videoId, counter);
        }
    }
}


function computePlotElements(scoreId, syncPairs) {
    'use strict';

    var videoSegments = [];

    G.pageTimes = getPageTimes(scoreId);

    for (var videoId in syncPairs) {
        if (syncPairs.hasOwnProperty(videoId)) {

            videoSegments = [];
            var alignment = G.alignments.get(scoreId, videoId),
                segment, videoSegment, confidence, rbutton;

            if (!G.videos.hasOwnProperty(videoId) || !G.videos[videoId].getAvailability() ||
                videoIsFilteredOut(scoreId, videoId)) {
                continue;
            }

            G.visibilityOfVideos[videoId] = G.visibilityOfVideos[videoId] ? G.visibilityOfVideos[videoId] : false;
            G.videoTimeMaps[videoId] = G.videoTimeMaps[videoId] ? G.videoTimeMaps[videoId] : alignment.localTimeMaps;
            G.videoStatus[videoId] = G.videoStatus[videoId] ? G.videoStatus[videoId] : YT.PlayerState.PAUSED;
            G.videoStartPosition[videoId] = G.videoStartPosition[videoId] ? G.videoStartPosition[videoId] : 0;
            G.videoReadiness[videoId] = G.videoReadiness[videoId] ? G.videoReadiness[videoId] : 0;
            G.videoNumOfLoadingAttempts[videoId] = G.videoNumOfLoadingAttempts[videoId] ? G.videoNumOfLoadingAttempts[videoId] : 0;

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
        }
    }
}


function updatePosition() {
    'use strict';

    //console.log("updatePosition: videoID: " + G.currentPlayingYTVideoID + "");
    var videoTime = G.ytPlayers[G.currentPlayingYTVideoID].getCurrentTime(),
        pageAndTime = getPageAndTimeForVideoTime(videoTime, G.currentPlayingYTVideoID),
        pageAndTimePlus = getPageAndTimeForVideoTime(videoTime + G.foreRunningTime, G.currentPlayingYTVideoID),
        page,
        scoreTime,
        normalizedPageTime,
        pagePlus,
        rbID;

    //if (typeof pageAndTime == "undefined") return;
    if (pageAndTime === undefined) {
        return;
    }

    page = pageAndTime.page;
    scoreTime = pageAndTime.scoreTime;
    normalizedPageTime = getNormalizedTime(pageAndTime.page, pageAndTime.scoreTime);
    pagePlus = pageAndTimePlus ? pageAndTimePlus.page : pageAndTime.page;

    //console.log("page: " + page + " scoreTime: " + scoreTime);

    if (pagePlus !== G.prevPage) {
        _pnq.push(['loadPage', pagePlus - 1]);
        G.prevPage = pagePlus;
    }

    updateVideoTrackLine(scoreTime);

    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page - 1, true]);

    rbID = G.currentPlayingYTVideoID + "_" + getSegmentIndexFromVideoTime(G.currentPlayingYTVideoID, videoTime) + "_RB";
    if (!document.getElementById(rbID).checked) {
        document.getElementById(rbID).checked = true;
        document.getElementById(rbID).focus();
    }
}
