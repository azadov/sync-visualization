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
    _pnq.push(['widgetHeight', 590]);
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

function getPageTimes(scoreId) {
    var videoId;
    for (videoId in G.syncPairs[scoreId]) {
        if (G.videos.hasOwnProperty(videoId) && G.videos[videoId].getAvailability()) {
            break;
        }
    }
    console.log(videoId);
    console.log(G.alignments.get(scoreId, videoId));
    return G.alignments.get(scoreId, videoId).streamTimes0;
}


function createVideoSegment(segmentTimeMap, videoID, _conf) {
    'use strict';

    var scoreTimeAxis = segmentTimeMap[0], videoSegmentAxis = segmentTimeMap[1], newRectangle = {},
        currentAvgVelInd, firstInd, secondInd, tpInd, velocity, indVel = [], sectionLength;

    if (G.maxPlotX < scoreTimeAxis[scoreTimeAxis.length - 1]) {
        G.maxPlotX = scoreTimeAxis[scoreTimeAxis.length - 1];
    }

    newRectangle.x1 = scoreTimeAxis[0];
    newRectangle.x2 = scoreTimeAxis[scoreTimeAxis.length - 1];
    newRectangle.width = scoreTimeAxis[scoreTimeAxis.length - 1] - scoreTimeAxis[0];
    newRectangle.x1_notbasis = videoSegmentAxis[0];
    newRectangle.segmentConfidence = _conf;
    newRectangle.videoID = videoID;
    newRectangle.timeMap = segmentTimeMap;

    currentAvgVelInd = Math.floor(scoreTimeAxis[0] / G.velocityWindow);
    firstInd = 0;
    for (tpInd = 1; tpInd < scoreTimeAxis.length; tpInd = tpInd + 1) {
        if (Math.floor(scoreTimeAxis[tpInd] / G.velocityWindow) > currentAvgVelInd) {
            secondInd = tpInd - 1;

            if (scoreTimeAxis[secondInd] !== scoreTimeAxis[firstInd] && videoSegmentAxis[secondInd] !== videoSegmentAxis[firstInd]) {
                velocity = (scoreTimeAxis[secondInd] - scoreTimeAxis[firstInd]) / (videoSegmentAxis[secondInd] - videoSegmentAxis[firstInd]);
//                if (velocity === Infinity) {
//                    console.log("Numerator: " + segmTimeMap[0][tpInd] + "      " + segmTimeMap[0][tpInd - 1] +
//                                "\nDenominator: " + segmTimeMap[1][tpInd] + "      " + segmTimeMap[1][tpInd - 1]);
//                }
                sectionLength = scoreTimeAxis[secondInd] - scoreTimeAxis[firstInd];
                //console.log(velocity + "      " + sectionLength);
                if (G.velocities[currentAvgVelInd]) {
                    G.velocities[currentAvgVelInd].push([velocity, sectionLength]);
                } else {
                    G.velocities[currentAvgVelInd] = [velocity, sectionLength];
                }

                indVel.push([currentAvgVelInd, velocity]);
            }

            currentAvgVelInd = Math.floor(scoreTimeAxis[tpInd] / G.velocityWindow);
            firstInd = tpInd;
        }
    }

    newRectangle.indVel = indVel;

    return newRectangle;
}

function createCurve(currSegment, nextSegment, videoID) {
    'use strict';

    var firstPoint = {x: currSegment.x2, y: currSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT / 2},
        secondPoint = {x: currSegment.x2 + 10, y: currSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT  / 2},
        thirdPoint = {x: currSegment.x2 + 10,
            y: currSegment.y + modulus(currSegment.y - nextSegment.y) / 2 - CONSTANTS.SEGMENT_RECT_HEIGHT / 2},
        fourthPoint = {x: nextSegment.x1 - 10,
            y: currSegment.y + modulus(currSegment.y - nextSegment.y) / 2 - CONSTANTS.SEGMENT_RECT_HEIGHT / 2},
        fifthPoint = {x: nextSegment.x1 - 10, y: nextSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT / 2},
        sixthPoint = {x: nextSegment.x1, y: nextSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT / 2},
        points = [],
        curve = {},
        strokeDasharray = "0,0",
        diff = nextSegment.timeMap[1][nextSegment.timeMap[1].length - 1] - currSegment.timeMap[1][currSegment.timeMap[1].length - 1];

    points.push(firstPoint);
    points.push(secondPoint);
    points.push(thirdPoint);
    points.push(fourthPoint);
    points.push(fifthPoint);
    points.push(sixthPoint);

    curve.points = points;

    if (diff < 1) {
        strokeDasharray = "2,2";
    }
    curve.strokeDash = strokeDasharray;
    curve.videoID =  videoID;
    //curve.timeMap = timeMap;

    return curve;
}

function calculateAverageVelocity() {
    'use strict';

    var pairInd, segmInd, i, j, segmTimeMap, tpInd, currentAvgVelInd, velocity = 0, velArray = [], firstInd, secondInd,
        numerator = 0, denominator = 0, sectionLength;

    G.averageVelocity = [];
    for (i = 0; i < G.velocities.length; i = i + 1) {
        numerator = 0;
        denominator = 0;
        if (G.velocities[i] !== undefined) {
            for (j = 0; j < G.velocities[i].length; j = j + 1) {
                velocity = G.velocities[i][j][0];
                sectionLength = G.velocities[i][j][1];
                //console.log(velocity + "     " + sectionLength);
                if (velocity !== undefined && sectionLength !== undefined) {
                    numerator = numerator + velocity * sectionLength;
                    denominator = denominator + sectionLength;
                }
            }
            if (denominator != 0) {
                velocity = numerator / denominator;
            } else {
                velocity = 0;
            }
        } else {
            velocity = 0;
        }

        console.log(velocity);
        G.averageVelocity.push(velocity);
    }

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



function updateScorePosition(d) {
    'use strict';

    console.log("update score position");
    var pageAndTime = getPageAndTime(G.x_scale.invert(d3.mouse(this)[0])),
        page = pageAndTime.page,
        pageTime = pageAndTime.pageTime,
        normalizedPageTime = getNormalizedTime(page, pageTime),
        timeInScore, timeInVideo;

    _pnq.push(['loadPage', page - 1]);
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page - 1, true]);

    if (G.videoIDNextToCursor !== "") {
        timeInScore = G.x_scale.invert(d3.mouse(this)[0]),
            timeInVideo = getVideoTimeFromScoreTime(timeInScore, G.segmentNextToCursor.timeMap); //G.videoTimeMaps[G.videoIDNextToCursor]
        if (G.ytPlayers.hasOwnProperty(G.videoIDNextToCursor)) {

            G.ytPlayers[G.videoIDNextToCursor].seekTo(Math.max(0, timeInVideo));
            G.ytPlayers[G.videoIDNextToCursor].playVideo();

        } else if (G.ytPlayerThumbnails.hasOwnProperty(G.videoIDNextToCursor)) {

            G.videoStartPosition[G.videoIDNextToCursor] = timeInVideo;
            loadVideo(G.videoIDNextToCursor, G.videoIDNextToCursor);
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


function getVideoTimeFromScoreTime(_timeInScore, _timeMap) {
    'use strict';

    var indexOfLastSynchronizedTimePointInScore = 0, i, segm;
    for (i = 0; i < _timeMap[0].length - 1; i = i + 1) {
        if ((_timeInScore >= _timeMap[0][i]) && (_timeInScore < _timeMap[0][i + 1])) {
            return _timeMap[1][i];
        }
    }
}


function getPageAndTime(_scoreTime) {
    'use strict';
    var page = 0, pageTime = 0, i;
    //console.log("score time: " + _scoreTime);
    for (i in G.pageTimes) {
        if (G.pageTimes.hasOwnProperty(i)) {
            page = i;
            pageTime = G.pageTimes[i];
            if (pageTime >= _scoreTime) {
                console.log("page: " + (page - 1));
                return {"page": (page - 1), "pageTime": _scoreTime};
            }
        }
    }
    //console.log("page: " + page);
    return {"page": page, "pageTime": _scoreTime};
}

function pageDuration(page) {
    'use strict';

    if (G.pageTimes[page + 1]) {
        return G.pageTimes[page + 1] - G.pageTimes[page];
    } else {
        var maxTime = 0, i, s, timeMap;
        for (i in G.videoTimeMaps) {
            if (G.videoTimeMaps.hasOwnProperty(i)) {
                timeMap = G.videoTimeMaps[i];
                for (s = 0; s < timeMap.length; s = s + 1) {
                    maxTime = Math.max(maxTime, Math.max.apply(null, timeMap[s][0]));
                }
            }
        }
        return maxTime - G.pageTimes[page];
    }
}

function getNormalizedTime(page, pageTime) {
    'use strict';

    return (pageTime - G.pageTimes[page]) / pageDuration(page);
}

function getYtOffsetByScoreTime(videoID, time) {
    'use strict';

    var timeMap = G.videoTimeMaps[videoID], s, i;
    for (s = 0; s < timeMap.length; s = s + 1) {
        if (timeMap[s][0][0] > time) {continue; }
        for (i in timeMap[s][0]) {
            if (timeMap[s][0].hasOwnProperty(i)) {
                if (timeMap[s][0][i] >= time) {return [s, i]; }
            }
        }
    }
}

function getVideoTimeForPagePosition(videoID, pt) {
    'use strict';

    //console.log("getting time for page position " + page + " " + relPos);
    //var pt = G.pageTimes[page] + pageDuration(page) * relPos;
    var segmentScoreTime = getYtOffsetByScoreTime(videoID, pt),
        timeMap = G.videoTimeMaps[videoID];
    return timeMap[segmentScoreTime[0]][1][segmentScoreTime[1]];
}

function getSegmentVideoTimeForPagePosition(_videoID, _segmentIndex, _pt) {
    'use strict';

    var segmTimeMap = G.allVideoSegments[_segmentIndex].timeMap, i, videoTime = 0;

    for (i = 0; i < segmTimeMap[0].length - 1; i = i + 1) {
        if ((segmTimeMap[0][i] <= _pt) && (_pt < segmTimeMap[0][i + 1])) {
            videoTime = segmTimeMap[1][i];
        }
    }

    return videoTime;
}

function getSegmentIndexFromVideoTime(_videoID, _vtime) {
    'use strict';

    var i, segm;
    for (i = 0; i < G.allVideoSegments.length; i = i + 1) {
        segm = G.allVideoSegments[i];
        if (segm.videoID === _videoID) {
            if ((segm.timeMap[1][0] <= _vtime) && (_vtime <= segm.timeMap[1][segm.timeMap[1].length - 1])) {
                return i;
            }
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

function getPageAndTimeForVideoTime(time, _videoID) {
    'use strict';

    var page = 0, pageTime = 0,
        timeMap = G.videoTimeMaps[_videoID],
        segmentScoreTime = getSegmentScoreTime(time, _videoID),
        segment, scoreTime,
        i;

    if (segmentScoreTime === undefined) {return undefined; }

    segment = segmentScoreTime[0];
    scoreTime = timeMap[segment][0][segmentScoreTime[1]];
//console.log("\nVideoTime: " + time + "    Segment: " + segment + "   ScoreTime: " + scoreTime + "\n");
    if (time < timeMap[segment][1][0]) {return {"page": 0, "pageTime": 0}; }

    for (i in G.pageTimes) {
        if (G.pageTimes.hasOwnProperty(i)) {
            page = i;
            pageTime = G.pageTimes[i];
            if (pageTime >= scoreTime) {
                return {"page": (page - 1), "pageTime": scoreTime};
            }
        }
    }
    return {"page": page, "pageTime": scoreTime};
}

function getSegmentScoreTime(ytTime, _videoID) {
    'use strict';

    var timeMap = G.videoTimeMaps[_videoID],
        s, i, out;

    for (s = 0; s < timeMap.length; s = s + 1) {
        //if (timeMap[s][1][0] > ytTime) {continue; }
        //console.log("segm: " + s + "   1st: " + timeMap[s][1][0] + "   ytime: " + ytTime);
        if ( timeMap[s][1][0] <= ytTime && ytTime < timeMap[s][1][timeMap[s][1].length - 1] ){
            out = [s, 0];
            for (i in timeMap[s][1]) {
                if (timeMap[s][1].hasOwnProperty(i)) {
                    //if (timeMap[s][1][i] >= ytTime) return [s, i];
                    if (timeMap[s][1][i] <= ytTime) {out = [s, i]; }
                }
            }
            //console.log("time: " + ytTime + "      segm: " + out[0] + "    scoretime: " + out[1]);
            return out;
        }
    }
}


function showSuitableVideoDivsForTimePoint(_tp) {
    'use strict';

    calculateVisibilityOfVideoIDs(_tp);

    showAndHideVideoDivs();
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
        showAndHideVideoDivs();
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
        for (id in G.visibilityOfVideoIDs) {
            if (G.visibilityOfVideoIDs.hasOwnProperty(id)) {
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
    for (videoID in G.visibilityOfVideoIDs) {
        //console.log(videoID + "                   " + G.visibilityOfVideoIDs[videoID]);
        if (G.visibilityOfVideoIDs.hasOwnProperty(videoID)) {
            G.visibilityOfVideoIDs[videoID] = false;
        }
    }

    for (i = 0; i < G.allVideoSegments.length; i = i + 1) {
        if (_scoreTime >= G.allVideoSegments[i].x1 && _scoreTime <= G.allVideoSegments[i].x2) {
            G.visibilityOfVideoIDs[G.allVideoSegments[i].videoID] = true;
        }
    }

    for (i = 0; i < G.curves.length; i = i + 1) {
        minX = getMin(G.curves[i].points[0].x, G.curves[i].points[5].x);
        maxX = getMax(G.curves[i].points[0].x, G.curves[i].points[5].x);

        if (_scoreTime >= minX && _scoreTime <= maxX) {
            G.visibilityOfVideoIDs[G.curves[i].videoID] = true;
        }
    }
}

function showAndHideVideoDivs() {
    'use strict';

    var videoID;
    for (videoID in G.visibilityOfVideoIDs) {
        if (G.visibilityOfVideoIDs.hasOwnProperty(videoID)) {
            if (G.visibilityOfVideoIDs[videoID]) {
                //console.log("SHOW");
                showDiv(videoID);
            } else {
                if (G.ytPlayers.hasOwnProperty(videoID)) {
                    //console.log("Video in ytPlayer: " + videoID);
                    if (G.ytPlayers[videoID].getPlayerState() !== YT.PlayerState.PLAYING && G.ytPlayers[videoID].getPlayerState() !== YT.PlayerState.BUFFERING) {
                        //console.log("HideVideoID: " + videoID + "    state: " + G.ytPlayers[videoID].getPlayerState());
                        hideDiv(videoID);
                    }
                }
                if (G.ytPlayerThumbnails.hasOwnProperty(videoID)) {
                    hideDiv(videoID);
                }
            }
        }
    }
}

function hideDiv(_videoID) {
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

function showDiv(_videoID) {
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

function pause() {
    'use strict';

//    for (var videoID in G.visibilityOfVideoIDs) {
//        if ( G.visibilityOfVideoIDs[videoID] ) {
//            G.ytPlayers[videoID].pauseVideo();}
//    }
    var vID;
    for (vID in G.ytPlayers) {
        if (G.ytPlayers.hasOwnProperty(vID)) {
            if (G.ytPlayers[vID].getPlayerState() === YT.PlayerState.PLAYING){
                G.ytPlayers[vID].pauseVideo();
            }
        }
    }
}

function measureClickHandler(scoreID, viewerPage, measureNumber, totalMeasures) {
    "use strict";

    var page = viewerPage - -1, oneVideoPlaying = false, videosToPlay = [], randomIndex;
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasure", measureNumber, page - 1]);

    console.log("clicked on page " + page + ", measure " + measureNumber + " of total " + totalMeasures + " measures");
    var scoreTime = G.pageTimes[page] + pageDuration(page) * (measureNumber - 1) / totalMeasures,
        videoID,
        videoTime;
    //console.log("hier");
    if (gui.shouldHideVideos()) {
        showSuitableVideoDivsForTimePoint(scoreTime);
    } else {
        calculateVisibilityOfVideoIDs(scoreTime);
    }
    //console.log("da");
    for (videoID in G.visibilityOfVideoIDs) {
        if (G.visibilityOfVideoIDs.hasOwnProperty(videoID)) {
            if (G.visibilityOfVideoIDs[videoID]) {
                videosToPlay.push(videoID);
            }
        }
    }

    randomIndex = getRandom(0, videosToPlay.length - 1);
    //console.log("length: " + videosToPlay.length + "      index: " + randomIndex);

    videoID = videosToPlay[randomIndex];
    videoTime = getVideoTimeForPagePosition(videoID, scoreTime);
    if (G.ytPlayers.hasOwnProperty(videoID)) {

        G.ytPlayers[videoID].seekTo(Math.max(0, videoTime));
        G.ytPlayers[videoID].playVideo();

    } else if (G.ytPlayerThumbnails.hasOwnProperty(videoID)) {

        G.videoStartPosition[videoID] = videoTime;
        loadVideo(videoID, videoID);
    }
}
