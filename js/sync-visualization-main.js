var gui;

function main() {

    // needed for IE to have browser console.log
    if (!window.console) {window.console = {}; window.console.log = function () {}; }

    gui = G.gui;

    initYouTubeAPI();
    initScoreViewer();

    configureScoreViewer();

    bindScoreFilterInputWithFilteringAction();

    initQualityFilterDropdown();

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
    checkVideoAvailability(scoreId, function() {onVideoAvailabilityChecked(scoreId);});
}

function onVideoAvailabilityChecked(scoreId) {
    console.log("video availability checked for score " + scoreId);
    console.log(G.videos);
    getAlignments(scoreId, function() {onAlignmentsFetched(scoreId)();});
}

function onAlignmentsFetched(scoreId) {
    return function() {
        initializeVisualization(scoreId);
    };
}

function initializeVisualization(scoreId) {
    console.log("interface for " + scoreId);

    clearVideoAndPlotState();
    gui.resetScoreDOM();

    loadScoreInViewer(scoreId);

    computePlotElements(scoreId, G.syncPairs[scoreId]);
    computePlotDimensions();
    drawPlot();
    initVideos(scoreId, G.syncPairs[scoreId]);
}

function videoIsFilteredOut(scoreId, videoId) {
    return G.videos[videoId].getTitle().toLowerCase().indexOf(gui.getVideoTitleFilterString().toLowerCase()) == -1 ||
        G.syncPairs[scoreId][videoId].confidence < gui.getAlignmentQualityFilter();
}

function populateScoreSelectionDropdown() {
    for (var scoreId in G.syncPairs) {
        if (G.syncPairs.hasOwnProperty(scoreId)) {
            gui.addScoreToDropdown(scoreId);
        }
    }
}

function initYouTubeAPI() {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
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




// example of loading a viewer in an iframe as an anonymous function call. the fn can be made reusable of course.

function newViewerAPIExperiment() {
    (function(p) {
        $('<iframe id="' + p.rootElement + '_iframe" src="http://www.peachnote.com/viewer-embedded.html?'
            + 'scoreId=' + p.scoreId
            + '&width=' + p.widgetWidth
            + '&height=' + p.widgetHeight
            + '" height=' + (p.widgetHeight + 2) + ' width=' + (p.widgetWidth + 4)
            + ' frameborder=0 />')
            .appendTo('#' + p.rootElement)
    })({
        'rootElement':'PeachnoteViewerContainer2',
        'widgetHeight': 590,
        'widgetWidth': 450,
        'scoreId': 'IMSLP03796'
    });

// example of communication with the viewer in the iframe
    document.getElementById('PeachnoteViewerContainer2_iframe').contentWindow._pnq =
        document.getElementById('PeachnoteViewerContainer2_iframe').contentWindow._pnq || [];
    document.getElementById('PeachnoteViewerContainer2_iframe').contentWindow._pnq.push(['loadPage', 2]);
}


function bindScoreFilterInputWithFilteringAction() {

    gui.addScoreDropdownChangeCallback(function() {
        prepareVideosForScore(gui.getSelectedScoreId())
    });

    gui.addAlignmentQualityChangeCallback(function() {
        initializeVisualization(gui.getSelectedScoreId());
    });

    gui.addVideoTitleChangeCallback(function() {
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
            confidence;

        for (i = 0; i < json.length; i = i + 1) {
            scoreId = json[i].id0;
            videoId = json[i].id1;
            alignmentFileName = "alignments/" + scoreId + '_' + videoId + '.json';
            confidence = json[i].minConfidence;

            var video = new Video(videoId);

            G.videos[videoId] = video;

            G.syncPairs[scoreId] = G.syncPairs[scoreId] ? G.syncPairs[scoreId] : {};
            G.syncPairs[scoreId][videoId] = {alignmentFileName: alignmentFileName, confidence: confidence};
        }
    })
        .done(function() { onSuccess();})
        .fail(function() { onFailure();})
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
    G.visibilityOfVideoIDs = {};
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


function loadScoreInViewer(scoreId) {
    _pnq.push(['loadScore', scoreId]);
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
    var syncedVideos = G.syncPairs[scoreId];
    var counter = new FiringCounter(Object.keys(syncedVideos).length, onAlignmentsFetched);

    for (var videoId in syncedVideos) {
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

            var jsonPath = syncedVideos[videoId].alignmentFileName;
            fetchAlignmentData(scoreId, videoId, jsonPath, counter);
        }
    }
}

function checkVideoAvailability(scoreId, onDone) {
    var videoProperties = G.syncPairs[scoreId];

    var counter = new FiringCounter(Object.keys(videoProperties).length, onDone);

    for (var videoId in videoProperties) {
        if (videoProperties.hasOwnProperty(videoId)) {
            checkYouTubeVideoAvailability(videoId, counter);
        }
    }
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

function computePlotDimensions() {
    'use strict';

    var pt;
    for (pt in G.pageTimes) {
        if (G.pageTimes.hasOwnProperty(pt)) {
            if (G.maxPlotX < G.pageTimes[pt]) {
                G.maxPlotX = G.pageTimes[pt];
            }
        }
    }
    G.x_scale.domain([0, G.maxPlotX]);
    G.minPlotY = 0;
    G.maxPlotY = G.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS) + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS / 2;
    G.y_scale.domain([G.minPlotY, G.maxPlotY]);
    //console.log("extremes: " + G.maxPlotX_basis + "     " + G.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT+CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS));
}

function computePlotElements(scoreId, syncPairs) {
    'use strict';

    var videoSegments = [], currSegment, nextSegment, curve;

    G.pageTimes = getPageTimes(scoreId);

    for (var videoId in syncPairs) {
        if (syncPairs.hasOwnProperty(videoId)) {

            videoSegments = [];
            var alignment = G.alignments.get(scoreId, videoId),
                segm, videoSegment, conf, rbutton;

            if (!G.videos.hasOwnProperty(videoId) ||
                !G.videos[videoId].getAvailability() ||
                videoIsFilteredOut(scoreId, videoId)) {
                continue;
            }

            if (!G.visibilityOfVideoIDs.hasOwnProperty(videoId)) {
                G.visibilityOfVideoIDs[videoId] = false;
            }
            if (!G.videoTimeMaps.hasOwnProperty(videoId)) {
                G.videoTimeMaps[videoId] =  alignment.localTimeMaps;
            }
            if (!G.videoStatus.hasOwnProperty(videoId)) {
                G.videoStatus[videoId] = YT.PlayerState.PAUSED;
            }
            if (!G.videoStartPosition.hasOwnProperty(videoId)) {
                G.videoStartPosition[videoId] = 0;
            }
            if (!G.videoReadiness.hasOwnProperty(videoId)) {
                G.videoReadiness[videoId] = 0;
            }
            if (!G.videoNumOfLoadingAttempts.hasOwnProperty(videoId)) {
                G.videoNumOfLoadingAttempts[videoId] = 0;
            }

            //pairSyncData.localTimeMaps.forEach(function (segmentTimeMap) {
            for (segm = 0; segm < alignment.localTimeMaps.length; segm = segm + 1) {
                conf = getMin(alignment.confidences[segm][0], alignment.confidences[segm][1]);
                videoSegment = createVideoSegment(alignment.localTimeMaps[segm], videoId, conf);

                videoSegments.push(videoSegment);

            }

            videoSegments = sortRects(videoSegments);

            assignSegmentYCoordinates(videoSegments);


            for (segm = 0; segm < videoSegments.length - 1; segm = segm + 1) {
                currSegment = videoSegments[segm];
                nextSegment = videoSegments[segm + 1];
                curve = createCurve(currSegment, nextSegment, videoId);
                G.curves.push(curve);
            }

            for (segm = 0; segm < videoSegments.length; segm = segm + 1) {
                rbutton = {};
                rbutton.videoID = videoId;
                rbutton.segmentIndex = G.allVideoSegments.length + segm; // index in G.allVideoSegments array
                rbutton.y = videoSegments[segm].y - CONSTANTS.SEGMENT_RECT_HEIGHT / 2;
                G.radiobuttons.push(rbutton);
                //console.log("Length: " + G.allVideoSegments.length + "    i: " + "     index: " + rbutton.index);
            }

            appendArrays(G.allVideoSegments, videoSegments);
        }
    }

    calculateAverageVelocity();
}




function updatePosition() {
    'use strict';

    //console.log("updatePosition: videoID: " + G.currentPlayingYTVideoID + "");
    var videoTime = G.ytPlayers[G.currentPlayingYTVideoID].getCurrentTime(),
        pageAndTime = getPageAndTimeForVideoTime(videoTime, G.currentPlayingYTVideoID),
        pageAndTimePlus = getPageAndTimeForVideoTime(videoTime + G.foreRunningTime, G.currentPlayingYTVideoID),
        page,
        pageTime,
        normalizedPageTime,
        pagePlus,
        rbID;

    //if (typeof pageAndTime == "undefined") return;
    if (pageAndTime === undefined) {return; }

    page = pageAndTime.page;
    pageTime = pageAndTime.pageTime;
    normalizedPageTime = getNormalizedTime(pageAndTime.page, pageAndTime.pageTime);
    pagePlus = pageAndTimePlus ? pageAndTimePlus.page : pageAndTime.page;

    //console.log("page: " + page + " pageTime: " + pageTime);

    if (pagePlus !== G.prevPage) {
        _pnq.push(['loadPage', pagePlus - 1]);
        G.prevPage = pagePlus;
    }

    updateVideoTrackLine(pageTime);

    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page - 1, true]);

    rbID = G.currentPlayingYTVideoID + "_" + getSegmentIndexFromVideoTime(G.currentPlayingYTVideoID, videoTime) + "_RB";
    if (!document.getElementById(rbID).checked) {
        document.getElementById(rbID).checked = true;
        document.getElementById(rbID).focus();
    }
    //document.getElementById(rbID).focus(); <- not here, because if video plays you will have no possibility to select another
    //                                          IMSLP-ID in the check box
}
