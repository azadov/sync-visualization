var CONSTANTS = {};
CONSTANTS.SEGMENT_RECT_HEIGHT = 0.1;
CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS = 0.3;
CONSTANTS.VIDEO_WIDTH = 140;
CONSTANTS.VIDEO_HEIGHT = 90;

var GLVARS = {};
GLVARS.numberOfVideoSegmentLevels = 1;
GLVARS.labelShift = 4;

GLVARS.plot_margin = {top: 20, right: 20, bottom: 30, left: 40};
GLVARS.plot_width = 600 - GLVARS.plot_margin.left - GLVARS.plot_margin.right;
GLVARS.plot_height = 320 - GLVARS.plot_margin.top - GLVARS.plot_margin.bottom;

/*global d3, $, document, window*/

GLVARS.x_scale = d3.scale.linear()
    .range([0, GLVARS.plot_width]);

GLVARS.y_scale = d3.scale.linear()
    .range([GLVARS.plot_height, 0]);

GLVARS.xAxis = d3.svg.axis()
    .scale(GLVARS.x_scale)
    .orient("bottom");

GLVARS.maxPlotX = 0;
GLVARS.minPlotY = 0;
GLVARS.maxPlotY = 0;

GLVARS.scoreToSyncFileNames = {};          // list of file names of video syncs for a scoreId
GLVARS.sIDs = [];
GLVARS.pageTimes = [];


GLVARS.scoreSyncFileNames = [];

GLVARS.allVideoSegments = [];
GLVARS.curves = [];

GLVARS.visibilityOfVideoIDs = {}; // maps videoId to the visibility of the corresponding video
GLVARS.videoTimeMaps = {};        // maps videoId to localTimeMaps
GLVARS.videoStatus = {};          // maps videoId to status
GLVARS.videoStartPosition = {};   // maps videoId to start position

GLVARS.ytPlayers = {};
GLVARS.ytPlayerThumbnails = {};

GLVARS.mouseTrackLineExist = false;
GLVARS.videoTrackLineExist = false;

GLVARS.currentPlayingYTVideoID = "";
GLVARS.videoIDNextToCursor = "";
GLVARS.videoSegmentIndexNextToCursor;
GLVARS.loopId = 0;
GLVARS.prevPage = 0;
GLVARS.foreRunningTime = 2.0;


var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// needed for IE to have browser console.log
if (!window.console) {window.console = {}; window.console.log = function () {'use strict'; }; }



(function () {
    "use strict";

    var pnsv = document.createElement('script');
    pnsv.type = 'text/javascript';
    pnsv.async = true;
    pnsv.src = 'http://pchnote.appspot.com/scoreviewer/scoreviewer.nocache.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(pnsv);
})();

var _pnq = _pnq || [];
_pnq.push(['rootElement', 'PeachnoteViewerContainerId']);
_pnq.push(['widgetHeight', 590]);
_pnq.push(['widgetWidth', 450]);
_pnq.push(['addMeasureClickHandler', measureClickHandler]);


$('#scoreIDs').change(function () {
    'use strict';

    var scoreId = "";
//    $("select option:selected").each(function () {
//        scoreId = $(this).text();
//    });
    scoreId = $("#scoreIDs").val();

    var quality = $("#qualityFilter").val();
    console.log("ScoreID: " + scoreId + "    Qual: " + quality);
    _pnq.push(['loadScore', scoreId]);
    loadDataForScoreID(scoreId, quality);
});

$('#qualityFilter').change(function () {
    'use strict';

    var quality = 0;
    $("select option:selected").each(function () {
        quality = $(this).text();
    });

    var scoreId = $("#scoreIDs").val();

    _pnq.push(['loadScore', scoreId]);
    loadDataForScoreID(scoreId, quality);
});
// populate the dropdown for quality selection
var ind;
var qualities = [0, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];
for (ind = 0; ind < qualities.length; ind = ind + 1) {
    $('#qualityFilter').append($("<option />").val(qualities[ind]).text(qualities[ind]));
}


$.getJSON('IMSLP-YT-AlignmentQuality.json', function (json) {
    'use strict';

    var i, sid, id1, fname, select = $("#scoreIDs"), initialScoreId, confidence;

    for (i = 0; i < json.length; i = i + 1) {
        sid = json[i].id0;
        id1 = json[i].id1;
        fname = "alignments/" + sid + '_' + id1 + '.json';
        confidence = json[i].minConfidence;

        //console.log(sid + "      " + fname);
        if (GLVARS.scoreToSyncFileNames[sid]) {
            GLVARS.scoreToSyncFileNames[sid].push([fname, confidence]);
        } else {
            GLVARS.scoreToSyncFileNames[sid] = [[fname, confidence]];
            GLVARS.sIDs.push(sid);
        }
    }

    // populate the dropdown for score selection
    for (i = 0; i < GLVARS.sIDs.length; i = i + 1) {
        select.append($("<option />").val(GLVARS.sIDs[i]).text(GLVARS.sIDs[i]));
    }

    initialScoreId = GLVARS.sIDs[0];

    _pnq.push(['loadScore', initialScoreId]);
    loadDataForScoreID(initialScoreId, 0);
    setTimeout(function () {loadDataForScoreID(initialScoreId, 0); }, 1000);

});


function resetScoreVariables(_sID) {
    'use strict';

    GLVARS.mouseTrackLineExist = false;
    GLVARS.videoTrackLineExist = false;
    GLVARS.numberOfVideoSegmentLevels = 1;
    GLVARS.allVideoSegments = [];
    GLVARS.curves = [];
    GLVARS.visibilityOfVideoIDs = {};
    GLVARS.videoTimeMaps = {};
    GLVARS.videoStatus = {};
    GLVARS.scoreSyncFileNames = GLVARS.scoreToSyncFileNames[_sID];
    GLVARS.maxPlotX = 0;
    GLVARS.ytPlayers = {};
    GLVARS.ytPlayerThumbnails = {};

}

function resetScoreDOM() {
    'use strict';

    d3.select('svg').remove();
    d3.select(".mouseTrackLine").remove();
    $('#videos').empty();
}

function loadDataForScoreID(_sID, _quality) {
    'use strict';

    resetScoreVariables(_sID);
    resetScoreDOM();

    var svg = createPlotSVG(), doneCount = 0, allPairsSyncData = [];

    function whenDone() {
        computePlotElements(allPairsSyncData, svg);
        computePlotDimensions();
        drawPlot(svg);
        initVideos(allPairsSyncData);
    }

    $.each(GLVARS.scoreSyncFileNames, function (i, fileQual) {
        if (fileQual[1] >= _quality) {
            $.getJSON(fileQual[0])
                .done(function (json) {
                    doneCount = doneCount + 1;
                    allPairsSyncData.push(json);
                    if (doneCount === GLVARS.scoreSyncFileNames.length) {
                        whenDone();
                    }
                })
                .fail(function (jqxhr, textStatus, error) {
                    doneCount = doneCount + 1;
                    var err = textStatus + ', ' + error;
                    console.log("Request Failed: " + err);
                    if (doneCount === GLVARS.scoreSyncFileNames.length) {
                        whenDone();
                    }
                });
        } else {
            doneCount = doneCount + 1;
            if (doneCount === GLVARS.scoreSyncFileNames.length) {
                whenDone();
            }
        }
    });
}


function createVideoSegment(segmentTimeMap, videoId, _conf) {
    'use strict';

    var scoreTimeAxis = segmentTimeMap[0], videoSegmentAxis = segmentTimeMap[1], newRectangle = {};

    if (GLVARS.maxPlotX < scoreTimeAxis[scoreTimeAxis.length - 1]) {
        GLVARS.maxPlotX = scoreTimeAxis[scoreTimeAxis.length - 1];
    }

    newRectangle.x1 = scoreTimeAxis[0];
    newRectangle.x2 = scoreTimeAxis[scoreTimeAxis.length - 1];
    newRectangle.width = scoreTimeAxis[scoreTimeAxis.length - 1] - scoreTimeAxis[0];
    newRectangle.x1_notbasis = videoSegmentAxis[0];
    newRectangle.segmentConfidence = _conf;
    newRectangle.videoID = videoId;
    newRectangle.timeMap = segmentTimeMap;


    return newRectangle;
}

function createCurve(currSegment, nextSegment, videoId) {
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
    curve.videoID =  videoId;
    //curve.timeMap = timeMap;

    return curve;
}

function computePlotDimensions() {
    'use strict';

    var pt;
    for (pt in GLVARS.pageTimes) {
        if (GLVARS.pageTimes.hasOwnProperty(pt)) {
            if (GLVARS.maxPlotX < GLVARS.pageTimes[pt]) {
                GLVARS.maxPlotX = GLVARS.pageTimes[pt];
            }
        }
    }
    GLVARS.x_scale.domain([0, GLVARS.maxPlotX]);
    GLVARS.minPlotY = 0;
    GLVARS.maxPlotY = GLVARS.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS);
    GLVARS.y_scale.domain([GLVARS.minPlotY, GLVARS.maxPlotY]);
    //console.log("extremes: " + GLVARS.maxPlotX_basis + "     " + GLVARS.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT+CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS));
}

function drawPlot(_svg) {
    'use strict';

    // add blank rectangle
    _svg.append("rect")
        .attr("class", "blankrectangle")
        .attr("x", GLVARS.x_scale(0))
        .attr("width", GLVARS.x_scale(GLVARS.maxPlotX))
        .attr("y", GLVARS.y_scale(GLVARS.maxPlotY))
        .attr("height", GLVARS.plot_height - GLVARS.y_scale(GLVARS.maxPlotY))
        //.on("click", updateScorePosition)
        //.on("mousemove", updateMouseTrackLine)
        //.on("mouseout", removeMouseTrackLine)
        .on("mousemove", showSuitableVideoDivsForCurrentMousePosition)
        ;

    createPageTicks(_svg, GLVARS.pageTimes);

    createRectangles(_svg, GLVARS.allVideoSegments);

    createCurves(_svg, GLVARS.curves);
}

function computePlotElements(_allPairsSyncData) {
    'use strict';

    var videoSegments = [], currSegment, nextSegment, curve;

    GLVARS.pageTimes = _allPairsSyncData[0].streamTimes0;

    _allPairsSyncData.forEach(function (pairSyncData) {

        videoSegments = [];
        var videoId = pairSyncData.uri1, i, videoSegment, conf;

        if (!GLVARS.visibilityOfVideoIDs.hasOwnProperty(videoId)) {
            GLVARS.visibilityOfVideoIDs[videoId] = false;
        }
        if (!GLVARS.videoTimeMaps.hasOwnProperty(videoId)) {
            GLVARS.videoTimeMaps[videoId] =  pairSyncData.localTimeMaps;
        }
        if (!GLVARS.videoStatus.hasOwnProperty(videoId)) {
            GLVARS.videoStatus[videoId] = YT.PlayerState.PAUSED;
        }
        if (!GLVARS.videoStartPosition.hasOwnProperty((videoId))) {
            GLVARS.videoStartPosition[videoId] = 0;
        }

        //pairSyncData.localTimeMaps.forEach(function (segmentTimeMap) {
        for (i = 0; i < pairSyncData.localTimeMaps.length; i = i + 1) {
            conf = getMin(pairSyncData.confidences[i][0], pairSyncData.confidences[i][1]);
            videoSegment = createVideoSegment(pairSyncData.localTimeMaps[i], videoId, conf);

            videoSegments.push(videoSegment);

        }

        videoSegments = sortRects(videoSegments);

        assignSegmentYCoordinates(videoSegments);

        appendArrays(GLVARS.allVideoSegments, videoSegments);

        for (i = 0; i < videoSegments.length - 1; i = i + 1) {
            currSegment = videoSegments[i];
            nextSegment = videoSegments[i + 1];
            curve = createCurve(currSegment, nextSegment, videoId);
            GLVARS.curves.push(curve);
        }
    });
}

function initVideos(_allPairsSyncData) {
    'use strict';

    _allPairsSyncData.forEach(function (pairSyncData) {
        var videoId = pairSyncData.uri1;

        $('<div>').attr('class', 'yt-videos').attr('id', videoId).appendTo($('#videos'));

        initVideo(videoId, videoId);
    });

    //optimizeYouTubeEmbeds();
}

/**
 * sorts rectangles according the x coordinate of video id axis file
 * @param _arrayOfRects
 * @returns {*}
 */
function sortRects(_arrayOfRects) {
    'use strict';

    var sortedArrayOfRects = [], minElem, indexOfMinElem, i;

    while (_arrayOfRects.length > 0) {

        minElem = 1000000;
        indexOfMinElem = 0;
        for (i = 0; i < _arrayOfRects.length; i = i + 1) {
            if (minElem > _arrayOfRects[i].x1_notbasis) {
                minElem = _arrayOfRects[i].x1_notbasis;
                indexOfMinElem = i;
            }
        }

        sortedArrayOfRects.push(_arrayOfRects[indexOfMinElem]);

        _arrayOfRects.splice(indexOfMinElem, 1);
    }

    return sortedArrayOfRects;
}

/**
 *  calculates the y coordinate of video segments, updates the total number of video segment levels if needed
 *
 * @param _arrayOfSortedRects    sorted segments for a video
 */
function assignSegmentYCoordinates(_arrayOfSortedRects) {
    'use strict';

    GLVARS.numberOfVideoSegmentLevels = GLVARS.numberOfVideoSegmentLevels + 1;

    _arrayOfSortedRects[0].y = GLVARS.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS);

    var i;
    for (i = 1; i < _arrayOfSortedRects.length; i = i + 1) {

        if (_arrayOfSortedRects[i - 1].x2 < _arrayOfSortedRects[i].x1) {
            _arrayOfSortedRects[i].y = _arrayOfSortedRects[i - 1].y;

        } else {
            GLVARS.numberOfVideoSegmentLevels = GLVARS.numberOfVideoSegmentLevels + 1;

            _arrayOfSortedRects[i].y = GLVARS.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS);

        }
    }
}


// put page numbers at appropriate times on the score time axis
function createPageTicks(_svg, _pageTimes) {
    'use strict';

    var key, betterLabelShift;
    for (key in _pageTimes) {
        if (_pageTimes.hasOwnProperty(key)) {
            betterLabelShift = (0 - - key) > 9 ? GLVARS.labelShift : GLVARS.labelShift / 2;
            _svg.append("text")
                .attr("x", GLVARS.x_scale(_pageTimes[key]) - betterLabelShift)
                .attr("y", GLVARS.y_scale(0))
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr("fill", "grey")
                .text(key)
            ;
        }
    }
}

function createRectangles(_svg, _rects) {
    'use strict';

    _svg.selectAll(".bar")
        .data(_rects)
        .enter().append("rect")
        .attr("class", "rectangle")
        .attr("x", function (d) { return GLVARS.x_scale(d.x1); })
        .attr("width", function (d) { return GLVARS.x_scale(d.width); })
        .attr("y", function (d) { return GLVARS.y_scale(d.y); })
        .attr("height", GLVARS.plot_height - GLVARS.y_scale(CONSTANTS.SEGMENT_RECT_HEIGHT))
        //.on("click", updateVideoPositionRect)
        .on("mouseover", enlargeVideoDivRect)
        //.on("mouseout", resetVideoDivRect)
        ;
}

function createCurves(_svg, _curves) {
    'use strict';

    // http://www.dashingd3js.com/svg-paths-and-d3js
    // var lineData = [ { "x": 61,  "y": 0.75}, { "x": 80,  "y": 0.75},
    //                  { "x": 55,  "y": 2.75}, { "x": 61,  "y": 2.75}];
    var lineFunction = d3.svg.line()
        .x(function (d) { return GLVARS.x_scale(d.x); })
        .y(function (d) { return GLVARS.y_scale(d.y); })
        .interpolate("basis");

    _svg.selectAll(".curve")
        .data(_curves)
        .enter().append("path")
        .attr("d", function (d) {return lineFunction(d.points); })
        .attr("stroke", "blue")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", function (d) {return d.strokeDash; })
        //.attr("stroke-dasharray", "0,0")
        .attr("fill", "none")
        .on("click", updateVideoPositionCurve)
        .on("mouseover", enlargeVideoDivCurve)
        //.on("mouseout", resetVideoDivCurve)
        //;
}


function createPlotSVG() {
    'use strict';

    var svg_basis = d3.select("#plotContainer").append("svg")
        .attr("width", GLVARS.plot_width + GLVARS.plot_margin.left + GLVARS.plot_margin.right)
        .attr("height", GLVARS.plot_height + GLVARS.plot_margin.top + GLVARS.plot_margin.bottom)
        .append("g")
        .attr("transform", "translate(" + GLVARS.plot_margin.left + "," + GLVARS.plot_margin.top + ")")

        .on("click", updateScorePosition)
        .on("mousemove", updateMouseTrackLine)
        //.on("mousemove", showSuitableVideoDivsForCurrentMousePosition)
        //.on("mousemove", handleMouseMoveEvent)
        .on("mouseout", removeMouseTrackLine)
        ;

    svg_basis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + GLVARS.plot_height + ")")
        .call(GLVARS.xAxis);

    GLVARS.xAxis.tickFormat(function (d) { return ''; });

    drawYAxis(svg_basis);

    return svg_basis;
}


function drawYAxis(svg_basis) {
    'use strict';

    var yAxis = d3.svg.axis()
        .scale(GLVARS.y_scale)
        .orient("left");
    svg_basis.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Frequency");
}

function updateScorePosition(d) {
    'use strict';

    console.log("update score position");
    var pageAndTime = getPageAndTime(GLVARS.x_scale.invert(d3.mouse(this)[0])),
        page = pageAndTime.page,
        pageTime = pageAndTime.pageTime,
        normalizedPageTime = getNormalizedTime(page, pageTime),
        timeInScore, timeInVideo;

    _pnq.push(['loadPage', page - 1]);
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page - 1, true]);

    timeInScore = GLVARS.x_scale.invert(d3.mouse(this)[0]),
    timeInVideo = getVideoTimeFromScoreTime(timeInScore, GLVARS.videoTimeMaps[GLVARS.videoIDNextToCursor]);
    if (GLVARS.ytPlayers.hasOwnProperty(GLVARS.videoIDNextToCursor)) {

        GLVARS.ytPlayers[GLVARS.videoIDNextToCursor].seekTo(Math.max(0, timeInVideo));
        GLVARS.ytPlayers[GLVARS.videoIDNextToCursor].playVideo();

    } else if (GLVARS.ytPlayerThumbnails.hasOwnProperty(GLVARS.videoIDNextToCursor)) {

        GLVARS.videoStartPosition[GLVARS.videoIDNextToCursor] = timeInVideo;
        loadVideo(GLVARS.videoIDNextToCursor, GLVARS.videoIDNextToCursor);
    }
}

//function updateVideoPositionRect(d) {
//    'use strict';
//
//    var videoID = d.videoID,
//    //console.log("update video position rect: " + videoID);
//        timeInScore = GLVARS.x_scale.invert(d3.mouse(this)[0]),
//        timeInVideo = getVideoTimeFromScoreTime(timeInScore, GLVARS.videoTimeMaps[videoID]);
//
//    GLVARS.ytPlayers[videoID].seekTo(Math.max(0, timeInVideo));
//    GLVARS.ytPlayers[videoID].playVideo();
//}

function updateVideoPositionCurve(d) {
    'use strict';

    console.log("videoID curve: " + d.videoID);
}

function enlargeVideoDivRect(d) {
    'use strict';

    //console.log("videoID rect: " + d.videoID);
    enlargeVideoDiv(d.videoID, 2);
    $("#segmQual").text(d.segmentConfidence);
}

function enlargeVideoDivCurve(d) {
    'use strict';

    //console.log("videoID rect: " + d[0].videoID);
    enlargeVideoDiv(d.videoID, 2);
}

function enlargeVideoDiv(_videoID, _coefficient) {
    'use strict';

    var elementToEnlarge;
    if (GLVARS.ytPlayers.hasOwnProperty(_videoID)) {
        elementToEnlarge = document.getElementById(_videoID);  //.firstChild.firstChild
        elementToEnlarge.width = _coefficient * CONSTANTS.VIDEO_WIDTH;
        elementToEnlarge.height = _coefficient * CONSTANTS.VIDEO_HEIGHT;
    }

    if (GLVARS.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
        elementToEnlarge = document.getElementById(_videoID).firstChild;
        elementToEnlarge.style.width = _coefficient * CONSTANTS.VIDEO_WIDTH + "px";
        elementToEnlarge.style.height = _coefficient * CONSTANTS.VIDEO_HEIGHT + "px";

        var secondElementToEnlarge = document.getElementById(_videoID).firstChild.firstChild.firstChild;
        secondElementToEnlarge.style.width = _coefficient * CONSTANTS.VIDEO_WIDTH + "px";
        secondElementToEnlarge.style.height = _coefficient * CONSTANTS.VIDEO_HEIGHT + "px";
    }
}

function resetVideoDivRect(d) {
    'use strict';

    resetVideoDiv(d.videoID);
}

function resetVideoDivCurve(d) {
    'use strict';

    resetVideoDiv(d.videoID);
}

function resetVideoDiv(_videoID) {
    'use strict';

    var elementToReset;

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

        var secondElementToReset = document.getElementById(_videoID).firstChild.firstChild.firstChild;
        secondElementToReset.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        secondElementToReset.style.height = CONSTANTS.VIDEO_HEIGHT + "px";
    }
}

//function handleMouseMoveEvent(d){
//    updateMouseTrackLine(d);
//    showSuitableVideoDivsForCurrentMousePosition();
//}

function updateMouseTrackLine(d) {
    'use strict';

    //var mouseTrackLine = document.getElementsByClassName("mouseTrackLine"); //d3.select(".mouseTrackLine");
    var currentMouseX = d3.mouse(this)[0], svgContainer;

    if (GLVARS.mouseTrackLineExist) {
        d3.select(".mouseTrackLine").attr("x1", currentMouseX)
            .attr("y1", GLVARS.y_scale(0))
            .attr("x2", currentMouseX)
            .attr("y2", GLVARS.y_scale(GLVARS.maxPlotY));
    } else {
        svgContainer = d3.select("g");
        svgContainer.append("line")
            .attr("class", "mouseTrackLine")
            .attr("x1", currentMouseX)
            .attr("y1", GLVARS.y_scale(0))
            .attr("x2", currentMouseX)
            .attr("y2", GLVARS.y_scale(GLVARS.maxPlotY))
            .attr("stroke-width", 2)
            .attr("stroke", "grey")
            .attr("pointer-events", "none");
        GLVARS.mouseTrackLineExist = true;
    }
}

function removeMouseTrackLine(d) {
    'use strict';

    console.log("remove mouseTrackLine");
    d3.select(".mouseTrackLine").remove();
    GLVARS.mouseTrackLineExist = false;

    var id;
    if (!$('#hideVideoDivs').prop('checked')) {
        for (id in GLVARS.visibilityOfVideoIDs) {
            if (GLVARS.visibilityOfVideoIDs.hasOwnProperty(id)) {
                resetVideoDiv(id);
            }
        }
    }
}

function updateVideoTrackLine(_scorePos) {
    'use strict';

    var svgContainer;
    if (GLVARS.videoTrackLineExist) {
        d3.select(".videoTrackLine").attr("x1", GLVARS.x_scale(_scorePos))
            .attr("y1", GLVARS.y_scale(0))
            .attr("x2", GLVARS.x_scale(_scorePos))
            .attr("y2", GLVARS.y_scale(GLVARS.maxPlotY));
    } else {
        svgContainer = d3.select("g");
        svgContainer.append("line")
            .attr("class", "videoTrackLine")
            .attr("x1", GLVARS.x_scale(_scorePos))
            .attr("y1", GLVARS.y_scale(0))
            .attr("x2", GLVARS.x_scale(_scorePos))
            .attr("y2", GLVARS.y_scale(GLVARS.maxPlotY))
            .attr("stroke-width", 2)
            .attr("stroke", "lightblue");
        GLVARS.videoTrackLineExist = true;
    }
}

function getVideoTimeFromScoreTime(_timeInScore, _timeMap) {
    'use strict';

    var indexOfLastSynchronizedTimePointInScore = 0, i, segm;
//    for (i = 0; i < _timeMap[0].length - 1; i = i + 1) {
//        if ((_timeInScore >= _timeMap[0][i]) && (_timeInScore < _timeMap[0][i + 1])) {
//            indexOfLastSynchronizedTimePointInScore = i;
//        }
//    }
//    return _timeMap[1][indexOfLastSynchronizedTimePointInScore];

    for (segm = 0; segm < _timeMap.length; segm = segm + 1) {
        if ((_timeMap[segm][0][0] <= _timeInScore) && (_timeInScore <= _timeMap[segm][0][_timeMap[segm][0].length - 1])) {
            for (i = 0; i < _timeMap[segm][0].length - 1; i = i + 1) {
                if ((_timeMap[segm][0][i] <= _timeInScore) && (_timeInScore < _timeMap[segm][0][i + 1])) {
                     return _timeMap[segm][1][i];
                }
            }
        }
    }
}


function getPageAndTime(_scoreTime) {
    'use strict';
    var page = 0, pageTime = 0, i;
    //console.log("score time: " + _scoreTime);
    for (i in GLVARS.pageTimes) {
        if (GLVARS.pageTimes.hasOwnProperty(i)) {
            page = i;
            pageTime = GLVARS.pageTimes[i];
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

    if (GLVARS.pageTimes[page + 1]) {
        return GLVARS.pageTimes[page + 1] - GLVARS.pageTimes[page];
    } else {
        var maxTime = 0, s = 0;
        for (s = 0; s < timeMap.length; s = s + 1) {
            maxTime = Math.max(maxTime, Math.max.apply(null, timeMap[s][0]));
        }
        return maxTime - GLVARS.pageTimes[page];
    }
}

function getNormalizedTime(page, pageTime) {
    'use strict';

    return (pageTime - GLVARS.pageTimes[page]) / pageDuration(page);
}

function getYtOffsetByScoreTime(videoID, time) {
    'use strict';

    var timeMap = GLVARS.videoTimeMaps[videoID], s, i;
    for (s = 0; s < timeMap.length; s = s + 1) {
        if (timeMap[s][0][0] > time) {continue; }
        for (i in timeMap[s][0]) {
            if (timeMap[s][0].hasOwnProperty(i)) {
                if (timeMap[s][0][i] >= time) {return [s, i]; }
            }
        }
    }
}

function getVideoTimeForPagePosition(videoID, page, pt) {
    'use strict';

    //console.log("getting time for page position " + page + " " + relPos);
    //var pt = GLVARS.pageTimes[page] + pageDuration(page) * relPos;
    var segmentScoreTime = getYtOffsetByScoreTime(videoID, pt),
        timeMap = GLVARS.videoTimeMaps[videoID];
    return timeMap[segmentScoreTime[0]][1][segmentScoreTime[1]];
}

function initVideo(_videoContainerID, _videoID) {
    'use strict';

    // Thease are to position the play button centrally.
    var pw=Math.ceil(CONSTANTS.VIDEO_WIDTH/2-38.5),
        ph=Math.ceil(CONSTANTS.VIDEO_HEIGHT/2+38.5);

    // The image+button overlay code.
    var code='<div alt="For this Google+ like YouTube trick, please see http://www.skipser.com/510" style="width:'
               + CONSTANTS.VIDEO_WIDTH + 'px; height:' + CONSTANTS.VIDEO_HEIGHT
               + 'px; margin:0 auto"><a href="#"  onclick="loadVideo(\'' + _videoContainerID + '\', \'' + _videoID
               + '\');return false;" id="skipser-youtubevid-' + _videoID + '"><img src="http://i.ytimg.com/vi/'+ _videoID
               + '/hqdefault.jpg" style="width:' + CONSTANTS.VIDEO_WIDTH + 'px; height:'+ CONSTANTS.VIDEO_HEIGHT
               +'px;" /><div style="background: url(\'data:image/png;base64,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\') no-repeat scroll 0 0 transparent;height: 77px;width: 77px; position:relative; margin-left:'
               + pw + 'px; margin-top:-' + ph + 'px;"></div></a></div>';

    // Replace the iframe with a the image+button code.
    var div = document.createElement('div');
    div.innerHTML=code;
    div=div.firstChild;

    document.getElementById(_videoContainerID).appendChild(div);

    GLVARS.ytPlayerThumbnails[_videoID] = div;
}

function loadVideo(_videoContainerID, _videoID) {
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
                    if (GLVARS.ytPlayers[videoID].getPlayerState() === YT.PlayerState.PLAYING) {
                        GLVARS.ytPlayers[videoID].pauseVideo();
                        deleteInterval = false;
                    }
                }
            }
        }
        clearInterval(GLVARS.loopId);
        GLVARS.loopId = setInterval(updatePosition, 500);
        enlargeVideoDiv(GLVARS.currentPlayingYTVideoID, 2);
    } else if (newState === YT.PlayerState.ENDED || newState === YT.PlayerState.PAUSED) {
        if (deleteInterval) {
            clearInterval(GLVARS.loopId);
        } else {
            deleteInterval = true;
        }

        resetVideoDiv(event.target.getVideoData().video_id);
    }

}

function updatePosition() {
    'use strict';

    //console.log("updatePosition: videoID: " + GLVARS.currentPlayingYTVideoID + "");
    var videoTime = GLVARS.ytPlayers[GLVARS.currentPlayingYTVideoID].getCurrentTime(),
        pageAndTime = getPageAndTimeForVideoTime(videoTime),
        pageAndTimePlus = getPageAndTimeForVideoTime(videoTime + GLVARS.foreRunningTime),
        page = pageAndTime.page,
        pageTime = pageAndTime.pageTime,
        normalizedPageTime = getNormalizedTime(pageAndTime.page, pageAndTime.pageTime),
        pagePlus = pageAndTimePlus ? pageAndTimePlus.page : pageAndTime.page;

    //if (typeof pageAndTime == "undefined") return;
    if (pageAndTime === "undefined") {return; }

    //console.log("page: " + page + " pageTime: " + pageTime);

    if (pagePlus !== GLVARS.prevPage) {
        _pnq.push(['loadPage', pagePlus - 1]);
        GLVARS.prevPage = pagePlus;
    }

    updateVideoTrackLine(pageTime);

    _pnq.push(["clearMeasureHighlightings"]);
    //if ($('#trackMeasure').prop('checked')) {
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page - 1, true]);
    //}

    //console.log(videoTime + " " + page);
}

function getPageAndTimeForVideoTime(time) {
    'use strict';

    var page = 0, pageTime = 0,
        timeMap = GLVARS.videoTimeMaps[GLVARS.currentPlayingYTVideoID],
        segmentScoreTime = getSegmentScoreTime(time),
        segment, scoreTime,
        i;

    if (segmentScoreTime === "undefined") {return undefined; }

    segment = segmentScoreTime[0];
    scoreTime = timeMap[segment][0][segmentScoreTime[1]];
//console.log("\nVideoTime: " + time + "    Segment: " + segment + "   ScoreTime: " + scoreTime + "\n");
    if (time < timeMap[segment][1][0]) {return {"page": 0, "pageTime": 0}; }

    for (i in GLVARS.pageTimes) {
        if (GLVARS.pageTimes.hasOwnProperty(i)) {
            page = i;
            pageTime = GLVARS.pageTimes[i];
            if (pageTime >= scoreTime) {
                return {"page": (page - 1), "pageTime": scoreTime};
            }
        }
    }
    return {"page": page, "pageTime": scoreTime};
}

function getSegmentScoreTime(ytTime) {
    'use strict';

    var timeMap = GLVARS.videoTimeMaps[GLVARS.currentPlayingYTVideoID],
        s, i, out;

//console.log("Segment0: " + s + "    " + timeMap[0][1][0] + "    " + timeMap[0][1][timeMap[0][1].length-1]);
//console.log("Segment1: " + s + "    " + timeMap[1][1][0] + "    " + timeMap[1][1][timeMap[1][1].length-1]);
//console.log("Segment2: " + s + "    " + timeMap[2][1][0] + "    " + timeMap[2][1][timeMap[2][1].length-1]);
//console.log("Segment3: " + s + "    " + timeMap[3][1][0] + "    " + timeMap[3][1][timeMap[3][1].length-1]);

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

    var currentMouseXPoint = GLVARS.x_scale.invert(d3.mouse(this)[0]),
        currentMouseYPoint = GLVARS.y_scale.invert(d3.mouse(this)[1]),
        yAboveMousePoint = GLVARS.maxPlotY,
        yUnderMousePoint = 0,
        videoIDAbove = "",
        videoIDUnder = "",
        i,
        id,
        currentSegment,
        yAb,
        factor = 0,
        videoToEnlarge = "";

    //console.log("hide video ID " + currentMouseXPoint);
    calculateVisibilityOfVideoIDs(currentMouseXPoint);

    if ($('#hideVideoDivs').prop('checked')) {
        showAndHideVideoDivs();
    }


    for (i = 0; i < GLVARS.allVideoSegments.length; i = i + 1) {
        currentSegment = GLVARS.allVideoSegments[i];
        if (currentMouseXPoint >= currentSegment.x1 && currentMouseXPoint <= currentSegment.x2) {
            if (currentMouseYPoint > currentSegment.y && currentSegment.y > yUnderMousePoint) {
                yUnderMousePoint = currentSegment.y;
                videoIDUnder = currentSegment.videoID;
            }
            yAb = currentSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT;
            if (currentMouseYPoint < yAb && yAb < yAboveMousePoint) {
                yAboveMousePoint = yAb;
                videoIDAbove = currentSegment.videoID;
            }
        }
    }

    if (videoIDUnder === "" && videoIDAbove === "")  {return; }
    //console.log("above: " + videoIDAbove + "  yAb: " + yAboveMousePoint + "        under: " + videoIDUnder + "  yUn: " + yUnderMousePoint);
    factor = 1;
    if (videoIDUnder === "") {
        //factor = currentMouseYPoint / yAboveMousePoint;
        videoToEnlarge = videoIDAbove;
    } else if (videoIDAbove === "") {
        //factor = 1 - (currentMouseYPoint - yUnderMousePoint) / (GLVARS.maxPlotY - yUnderMousePoint);
        videoToEnlarge = videoIDUnder;
    } else if (videoIDUnder === videoIDAbove) {
        factor = 1;
        videoToEnlarge = videoIDUnder;
    } else {
        if ((yAboveMousePoint - currentMouseYPoint) >= (currentMouseYPoint - yUnderMousePoint)) {
            // point under is the next to mouse point
            //factor = 1 - (currentMouseYPoint - yUnderMousePoint) / ((yAboveMousePoint - yUnderMousePoint) / 2);
            videoToEnlarge = videoIDUnder;
        } else {
            // point above is the next to mouse point
            //factor = (currentMouseYPoint - yUnderMousePoint) / ((yAboveMousePoint - yUnderMousePoint) / 2) - 1;
            videoToEnlarge = videoIDAbove;
        }
    }
    if (GLVARS.ytPlayers.hasOwnProperty(videoToEnlarge)) {
        if (GLVARS.ytPlayers[videoToEnlarge].getPlayerState() !== YT.PlayerState.PLAYING && GLVARS.ytPlayers[videoToEnlarge].getPlayerState() !== YT.PlayerState.BUFFERING) {
            enlargeVideoDiv(videoToEnlarge, 1 + factor);
        }
    } else if (GLVARS.ytPlayerThumbnails.hasOwnProperty(videoToEnlarge)) {
        enlargeVideoDiv(videoToEnlarge, 1 + factor);
    }

    if (!$('#hideVideoDivs').prop('checked')) {
        for (id in GLVARS.visibilityOfVideoIDs) {
            if (GLVARS.visibilityOfVideoIDs.hasOwnProperty(id)) {
                //if (id !== videoIDAbove && id !== videoIDUnder) {
                if (id !== videoToEnlarge) {
                    resetVideoDiv(id);
                }
            }
        }
    }

    GLVARS.videoIDNextToCursor = videoToEnlarge;
}

function calculateVisibilityOfVideoIDs(_scoreTime) {
    'use strict';

    var videoID, i, minX, maxX;
    for (videoID in GLVARS.visibilityOfVideoIDs) {
        //console.log(videoID + "                   " + GLVARS.visibilityOfVideoIDs[videoID]);
        if (GLVARS.visibilityOfVideoIDs.hasOwnProperty(videoID)) {
            GLVARS.visibilityOfVideoIDs[videoID] = false;
        }
    }

    for (i = 0; i < GLVARS.allVideoSegments.length; i = i + 1) {
        if (_scoreTime >= GLVARS.allVideoSegments[i].x1 && _scoreTime <= GLVARS.allVideoSegments[i].x2) {
            GLVARS.visibilityOfVideoIDs[GLVARS.allVideoSegments[i].videoID] = true;
        }
    }

    for (i = 0; i < GLVARS.curves.length; i = i + 1) {
        minX = getMin(GLVARS.curves[i].points[0].x, GLVARS.curves[i].points[5].x);
        maxX = getMax(GLVARS.curves[i].points[0].x, GLVARS.curves[i].points[5].x);

        if (_scoreTime >= minX && _scoreTime <= maxX) {
            GLVARS.visibilityOfVideoIDs[GLVARS.curves[i].videoID] = true;
        }
    }
}

function showAndHideVideoDivs() {
    'use strict';

    var videoID;
    for (videoID in GLVARS.visibilityOfVideoIDs) {
        if (GLVARS.visibilityOfVideoIDs.hasOwnProperty(videoID)) {
            if (GLVARS.visibilityOfVideoIDs[videoID]) {
                //console.log("SHOW");
                showDiv(videoID);
            } else {
                if (GLVARS.ytPlayers.hasOwnProperty(videoID)) {
                    //console.log("Video in ytPlayer: " + videoID);
                    if (GLVARS.ytPlayers[videoID].getPlayerState() !== YT.PlayerState.PLAYING && GLVARS.ytPlayers[videoID].getPlayerState() !== YT.PlayerState.BUFFERING) {
                        //console.log("HideVideoID: " + videoID + "    state: " + GLVARS.ytPlayers[videoID].getPlayerState());
                        hideDiv(videoID);
                    }
                }
                if (GLVARS.ytPlayerThumbnails.hasOwnProperty(videoID)) {
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
    var elementToHide;
    if (GLVARS.ytPlayers.hasOwnProperty(_videoID)) {
        elementToHide = document.getElementById(_videoID);
        elementToHide.width = 0;
        elementToHide.height = 0;
    }

    if (GLVARS.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
        elementToHide = document.getElementById(_videoID).firstChild;
        elementToHide.style.width = 0 + "px";
        elementToHide.style.height = 0 + "px";

        var secondElementToHide = document.getElementById(_videoID).firstChild.firstChild.firstChild;
        secondElementToHide.style.width = 0 + "px";
        secondElementToHide.style.height = 0 + "px";

        var thirdElementToHide = document.getElementById(_videoID).firstChild.firstChild.lastChild;
        thirdElementToHide.style.width = 0 + "px";
        thirdElementToHide.style.height = 0 + "px";
    }
}

function showDiv(_videoID) {
    'use strict';

    //document.getElementById(_videoID).style.display = "";
    //document.getElementById(_videoID).style.visibility = "visible";
    var faktor = 1, elementToShow;
    if (GLVARS.ytPlayers.hasOwnProperty(_videoID)) {
        if (GLVARS.ytPlayers[_videoID].getPlayerState() === YT.PlayerState.PLAYING || GLVARS.ytPlayers[_videoID].getPlayerState() === YT.PlayerState.BUFFERING) {
            faktor = 2;
        }
        elementToShow = document.getElementById(_videoID);
        elementToShow.width = faktor * CONSTANTS.VIDEO_WIDTH;
        elementToShow.height = faktor * CONSTANTS.VIDEO_HEIGHT;
    }

    if (GLVARS.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
        elementToShow = document.getElementById(_videoID).firstChild;
        elementToShow.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        elementToShow.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

        var secondElementToShow = document.getElementById(_videoID).firstChild.firstChild.firstChild;
        secondElementToShow.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        secondElementToShow.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

        var thirdElementToShow = document.getElementById(_videoID).firstChild.firstChild.lastChild;
        thirdElementToShow.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        thirdElementToShow.style.height = CONSTANTS.VIDEO_HEIGHT + "px";
    }
}

function pause() {
    'use strict';

//    for (var videoID in GLVARS.visibilityOfVideoIDs) {
//        if ( GLVARS.visibilityOfVideoIDs[videoID] ) {
//            GLVARS.ytPlayers[videoID].pauseVideo();}
//    }
    var vID;
    for (vID in GLVARS.ytPlayers) {
        if (GLVARS.ytPlayers.hasOwnProperty(vID)) {
            if (GLVARS.ytPlayers[vID].getPlayerState() === YT.PlayerState.PLAYING){
                GLVARS.ytPlayers[vID].pauseVideo();
            }
        }
    }
}

function measureClickHandler(scoreId, viewerPage, measureNumber, totalMeasures) {
    "use strict";

    var page = viewerPage - -1, oneVideoPlaying = false;
    console.log("clicked on page " + page + ", measure " + measureNumber + " of total " + totalMeasures + " measures");
    var scoreTime = GLVARS.pageTimes[page] + pageDuration(page) * (measureNumber - 1) / totalMeasures,
        videoID,
        videoTime;
    if ($('#hideVideoDivs').prop('checked')) {
        showSuitableVideoDivsForTimePoint(scoreTime);
    } else {
        calculateVisibilityOfVideoIDs(scoreTime);
    }
    for (videoID in GLVARS.visibilityOfVideoIDs) {
        if (GLVARS.visibilityOfVideoIDs.hasOwnProperty(videoID)) {
            if (GLVARS.visibilityOfVideoIDs[videoID] && !oneVideoPlaying) {
                videoTime = getVideoTimeForPagePosition(videoID, page, scoreTime);
                if (GLVARS.ytPlayers.hasOwnProperty(videoID)) {

                    GLVARS.ytPlayers[videoID].seekTo(Math.max(0, videoTime));
                    GLVARS.ytPlayers[videoID].playVideo();

                } else if (GLVARS.ytPlayerThumbnails.hasOwnProperty(videoID)) {

                    GLVARS.videoStartPosition[videoID] = videoTime;
                    loadVideo(videoID, videoID);
                }

                oneVideoPlaying = true;
            }
        }
    }
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasure", measureNumber, page - 1]);
}

function appendArrays(_array1, _array2) {
    'use strict';

    var i = 0;
    for (i = 0; i < _array2.length; i = i + 1) {
        _array1.push(_array2[i]);
    }
}

function modulus(_value) {
    'use strict';

    if (_value >= 0) {
        return _value;
    } else {
        return 0 - _value;
    }
}

function getMin(_x1, _x2) {
    'use strict';

    if (_x2 <= _x1) {
        return _x2;
    } else {
        return _x1;
    }
}

function getMax(_x1, _x2) {
    'use strict';

    if (_x2 >= _x1) {
        return _x2;
    } else {
        return _x1;
    }
}
