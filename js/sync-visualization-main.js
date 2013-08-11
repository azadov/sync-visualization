var CONSTANTS = {};
CONSTANTS.SEGMENT_RECT_HEIGHT = 0.1;
CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS = 0.3;
CONSTANTS.VIDEO_WIDTH = 150;
CONSTANTS.VIDEO_HEIGHT = 100;

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

GLVARS.ytPlayers = {};

GLVARS.mouseTrackLineExist = false;
GLVARS.videoTrackLineExist = false;

GLVARS.currentPlayingYTVideoID = "";
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
    $("select option:selected").each(function () {
        scoreId = $(this).text();
    });

    _pnq.push(['loadScore', "IMSLP" + scoreId]);
    loadDataForScoreID(scoreId);
});

$.getJSON('alignmentQuality.json', function (json) {
    'use strict';

    var i, sid, id1, fname, select = $("#scoreIDs"), initialScoreId;

    for (i = 0; i < json.length; i = i + 1) {
        sid = json[i].id0;
        id1 = json[i].id1;
        fname = "alignments/" + sid + '_' + id1 + '.json';

        //console.log(sid + "      " + fname);
        if (GLVARS.scoreToSyncFileNames[sid]) {
            GLVARS.scoreToSyncFileNames[sid].push(fname);
        } else {
            GLVARS.scoreToSyncFileNames[sid] = [fname];
            GLVARS.sIDs.push(sid);
        }
    }

    // populate the dropdown for score selection
    for (i = 0; i < GLVARS.sIDs.length; i = i + 1) {
        select.append($("<option />").val(GLVARS.sIDs[i]).text(GLVARS.sIDs[i]));
    }

    initialScoreId = GLVARS.sIDs[0];

    _pnq.push(['loadScore', "IMSLP" + initialScoreId]);
    loadDataForScoreID(initialScoreId);
    setTimeout(function () {loadDataForScoreID(initialScoreId); }, 1000);

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
}

function resetScoreDOM() {
    'use strict';

    d3.select('svg').remove();
    d3.select(".mouseTrackLine").remove();
    $('#videos').empty();
}

function loadDataForScoreID(_sID) {
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

    $.each(GLVARS.scoreSyncFileNames, function (i, file) {
        $.getJSON(file)
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
    });
}


function createVideoSegment(segmentTimeMap, videoId) {
    'use strict';

    var scoreTimeAxis = segmentTimeMap[0], videoSegmentAxis = segmentTimeMap[1];

    if (GLVARS.maxPlotX < scoreTimeAxis[scoreTimeAxis.length - 1]) {
        GLVARS.maxPlotX = scoreTimeAxis[scoreTimeAxis.length - 1];
    }

    var newRectangle = {};
    newRectangle.x1 = scoreTimeAxis[0];
    newRectangle.x2 = scoreTimeAxis[scoreTimeAxis.length - 1];
    newRectangle.width = scoreTimeAxis[scoreTimeAxis.length - 1] - scoreTimeAxis[0];
    newRectangle.x1_notbasis = videoSegmentAxis[0];
    newRectangle.videoID = videoId;
    newRectangle.timeMap = segmentTimeMap;

    return newRectangle;
}

function createCurve(currSegment, nextSegment, videoId, timeMap) {

    var firstPoint = {x: currSegment.x2, y: currSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT/2};

    var secondPoint = {x: currSegment.x2 + 10, y: currSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT/2};

    var thirdPoint ={x: currSegment.x2 + 10, y: currSegment.y + modulus(currSegment.y-nextSegment.y)/2 - CONSTANTS.SEGMENT_RECT_HEIGHT/2};

    var fourthPoint = {x: nextSegment.x1 - 10, y: currSegment.y + modulus(currSegment.y-nextSegment.y)/2 - CONSTANTS.SEGMENT_RECT_HEIGHT/2};

    var fifthPoint = {x: nextSegment.x1 - 10, y: nextSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT/2};

    var sixthPoint = {x: nextSegment.x1, y: nextSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT/2};

    var points = [];
    points.push(firstPoint);
    points.push(secondPoint);
    points.push(thirdPoint);
    points.push(fourthPoint);
    points.push(fifthPoint);
    points.push(sixthPoint);

    var curve = {};
    curve['points'] = points;

    var diff = nextSegment.timeMap[1][nextSegment.timeMap[1].length - 1] - currSegment.timeMap[1][currSegment.timeMap[1].length - 1];
    var strokeDasharray = "0,0";
    if ( diff < 1 ) {
        strokeDasharray = "2,2";
    }
    curve.strokeDash = strokeDasharray;
    curve.videoID =  videoId;
    curve.timeMap = timeMap;

    return curve;
}

function computePlotDimensions() {
    for (var pt in GLVARS.pageTimes){
        if ( GLVARS.maxPlotX < GLVARS.pageTimes[pt] ){
            GLVARS.maxPlotX = GLVARS.pageTimes[pt];
        }
    }
    GLVARS.x_scale.domain([0, GLVARS.maxPlotX]);
    GLVARS.minPlotY = 0;
    GLVARS.maxPlotY = GLVARS.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS);
    GLVARS.y_scale.domain([GLVARS.minPlotY, GLVARS.maxPlotY]);
    //console.log("extremes: " + GLVARS.maxPlotX_basis + "     " + GLVARS.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT+CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS));
}

function drawPlot(_svg) {

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

function computePlotElements(_allPairsSyncData){

    var videoSegments = [];

    GLVARS.pageTimes = _allPairsSyncData[0].streamTimes0;

    _allPairsSyncData.forEach(function(pairSyncData) {

        videoSegments = [];
        var videoId = pairSyncData.uri1;

        if ( !GLVARS.visibilityOfVideoIDs.hasOwnProperty(videoId) ) {
            GLVARS.visibilityOfVideoIDs[videoId] = false;
        }
        if ( !GLVARS.videoTimeMaps.hasOwnProperty(videoId) ) {
            GLVARS.videoTimeMaps[videoId] =  pairSyncData.localTimeMaps;
        }
        if ( !GLVARS.videoStatus.hasOwnProperty(videoId) ){
            GLVARS.videoStatus[videoId] = YT.PlayerState.PAUSED;
        }

        pairSyncData.localTimeMaps.forEach(function(segmentTimeMap) {

            var videoSegment = createVideoSegment(segmentTimeMap, videoId);

            videoSegments.push(videoSegment);

        });

        videoSegments = sortRects(videoSegments);

        assignSegmentYCoordinates(videoSegments);

        appendArrays(GLVARS.allVideoSegments, videoSegments);

        for (var i = 0; i < videoSegments.length - 1; i++) {
            var currSegment = videoSegments[i];
            var nextSegment = videoSegments[i + 1];
            var curve = createCurve(currSegment, nextSegment, videoId, currSegment.timeMap);
            GLVARS.curves.push(curve);
        }

        $('<div>').attr('class', 'video').attr('id', videoId).appendTo($('#videos'));
    });
}

function initVideos(_allPairsSyncData) {
    _allPairsSyncData.forEach(function(pairSyncData) {
        var videoId = pairSyncData.uri1;
        initVideo(videoId, videoId);
    });
}

/**
 * sorts rectangles according the x coordinate of video id axis file
 * @param _arrayOfRects
 * @returns {*}
 */
function sortRects(_arrayOfRects) {
    var sortedArrayOfRects = [];

    while ( _arrayOfRects.length > 0 ) {

        var minElem = 1000000;
        var indexOfMinElem = 0;
        for (var i = 0; i < _arrayOfRects.length; i++) {
            if ( minElem > _arrayOfRects[i].x1_notbasis ) {
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

    GLVARS.numberOfVideoSegmentLevels++;

    _arrayOfSortedRects[0].y = GLVARS.numberOfVideoSegmentLevels*(CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS);

    for (var i = 1; i < _arrayOfSortedRects.length; i++) {

        if ( _arrayOfSortedRects[i-1].x2 < _arrayOfSortedRects[i].x1 ) {

            _arrayOfSortedRects[i].y = _arrayOfSortedRects[i-1].y;

        } else {

            GLVARS.numberOfVideoSegmentLevels++;

            _arrayOfSortedRects[i].y = GLVARS.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS);

        }
    }
}


// put page numbers at appropriate times on the score time axis
function createPageTicks(_svg, _pageTimes) {

    for (var key in _pageTimes) {
        if (_pageTimes.hasOwnProperty(key)) {
            var betterLabelShift = (0 - - key) > 9 ? GLVARS.labelShift : GLVARS.labelShift / 2;
            _svg.append("text")
                .attr("x", GLVARS.x_scale(_pageTimes[key]) - betterLabelShift)
                .attr("y", GLVARS.y_scale(0))
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr("fill", "grey")
                .text(key - - 1)
            ;
        }
    }
}

function createRectangles(_svg, _rects){
    _svg.selectAll(".bar")
        .data(_rects)
        .enter().append("rect")
        .attr("class", "rectangle")
        .attr("x", function(d) { return GLVARS.x_scale(d.x1); })
        .attr("width", function(d) { return GLVARS.x_scale(d.width); })
        .attr("y", function(d) { return GLVARS.y_scale(d.y); })
        .attr("height", GLVARS.plot_height - GLVARS.y_scale(CONSTANTS.SEGMENT_RECT_HEIGHT))
        .on("click", updateVideoPositionRect)
        .on("mouseover", enlargeVideoDivRect)
        .on("mouseout", resetVideoDivRect);
}

function createCurves(_svg, _curves){
    // http://www.dashingd3js.com/svg-paths-and-d3js
    // var lineData = [ { "x": 61,  "y": 0.75}, { "x": 80,  "y": 0.75},
    //                  { "x": 55,  "y": 2.75}, { "x": 61,  "y": 2.75}];
    var lineFunction = d3.svg.line()
        .x(function(d) { return GLVARS.x_scale(d.x); })
        .y(function(d) { return GLVARS.y_scale(d.y); })
        .interpolate("basis");

    _svg.selectAll(".curve")
        .data(_curves)
        .enter().append("path")
        .attr("d", function(d){return lineFunction(d.points);})
        .attr("stroke", "blue")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", function(d){return d.strokeDash})
        //.attr("stroke-dasharray", "0,0")
        .attr("fill", "none")
        .on("click", updateVideoPositionCurve)
        .on("mouseover", enlargeVideoDivCurve)
        .on("mouseout", resetVideoDivCurve);
}


function createPlotSVG() {


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

    console.log("update score position");
    var pageAndTime = getPageAndTime(GLVARS.x_scale.invert(d3.mouse(this)[0]));
    var page = pageAndTime.page;
    var pageTime = pageAndTime.pageTime;
    var normalizedPageTime = getNormalizedTime(page, pageTime);

    _pnq.push(['loadPage', page]);
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page, true]);

}

function updateVideoPositionRect(d) {
    var videoID = d.videoID;
    //console.log("update video position rect: " + videoID);
    var timeInScore = GLVARS.x_scale.invert(d3.mouse(this)[0]);
    var timeInVideo = getVideoTimeFromScoreTime(timeInScore, d.timeMap);

    GLVARS.ytPlayers[videoID].seekTo(Math.max(0, timeInVideo));
    GLVARS.ytPlayers[videoID].playVideo();
}

function updateVideoPositionCurve(d) {
    console.log("videoID curve: " + d.videoID);
}

function enlargeVideoDivRect(d) {
    //console.log("videoID rect: " + d.videoID);
    enlargeVideoDiv(d.videoID, 2);
}

function enlargeVideoDivCurve(d) {
    //console.log("videoID rect: " + d[0].videoID);
    enlargeVideoDiv(d.videoID, 2);
}

function enlargeVideoDiv(_videoID, _coefficient) {
    //console.log("video to enlarge: " + _videoID);
    var divToEnlarge = document.getElementById(_videoID);
    divToEnlarge.width = _coefficient * CONSTANTS.VIDEO_WIDTH;
    divToEnlarge.height = _coefficient * CONSTANTS.VIDEO_HEIGHT;
}

function resetVideoDivRect(d) {
    resetVideoDiv(d.videoID);
}

function resetVideoDivCurve(d) {
    resetVideoDiv(d.videoID);
}

function resetVideoDiv(_videoID) {
    //console.log("\nvideo to reset: " + _videoID + "    status: " + GLVARS.ytPlayers[_videoID].getPlayerState() + "\n");
    if ( GLVARS.ytPlayers[_videoID].getPlayerState() != YT.PlayerState.PLAYING ) {
        var divToReset = document.getElementById(_videoID);
        divToReset.width = CONSTANTS.VIDEO_WIDTH;
        divToReset.height = CONSTANTS.VIDEO_HEIGHT;
    }
}

//function handleMouseMoveEvent(d){
//    updateMouseTrackLine(d);
//    showSuitableVideoDivsForCurrentMousePosition();
//}

function updateMouseTrackLine(d){
    //var mouseTrackLine = document.getElementsByClassName("mouseTrackLine"); //d3.select(".mouseTrackLine");
    var currentMouseX = d3.mouse(this)[0];
    if ( GLVARS.mouseTrackLineExist ) {
        d3.select(".mouseTrackLine").attr("x1", currentMouseX)
            .attr("y1", GLVARS.y_scale(0))
            .attr("x2", currentMouseX)
            .attr("y2", GLVARS.y_scale(GLVARS.maxPlotY));
    } else {
        var svgContainer = d3.select("g");
        var mouseTrackLine = svgContainer.append("line")
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

function removeMouseTrackLine(d){
    console.log("remove mouseTrackLine");
    d3.select(".mouseTrackLine").remove();
    GLVARS.mouseTrackLineExist = false;
}

function updateVideoTrackLine(_scorePos){
    if ( GLVARS.videoTrackLineExist ) {
        d3.select(".videoTrackLine").attr("x1", GLVARS.x_scale(_scorePos))
            .attr("y1", GLVARS.y_scale(0))
            .attr("x2", GLVARS.x_scale(_scorePos))
            .attr("y2", GLVARS.y_scale(GLVARS.maxPlotY));
    } else {
        var svgContainer = d3.select("g");
        var videoTrackLine = svgContainer.append("line")
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

function getVideoTimeFromScoreTime(_timeInScore, _timeMap){
    var indexOfLastSynchronizedTimePointInScore = 0;
    for (var i = 0; i < _timeMap[0].length - 1; i++) {
        if ( (_timeInScore >= _timeMap[0][i]) && (_timeInScore < _timeMap[0][i+1]) ) {
            indexOfLastSynchronizedTimePointInScore = i;
        }
    }

    return _timeMap[1][indexOfLastSynchronizedTimePointInScore];
}


function getPageAndTime(_scoreTime){
    var page = 0;
    var pageTime = 0;
    //console.log("score time: " + _scoreTime);
    for (var i in GLVARS.pageTimes) {
        page = i;
        pageTime = GLVARS.pageTimes[i];
        if (pageTime >= _scoreTime) {
            console.log("page: " + page - 1);
            return {"page": (page - 1), "pageTime": _scoreTime};
        }
    }
    //console.log("page: " + page);
    return {"page": page, "pageTime": _scoreTime};
}

function pageDuration(page) {
    if (GLVARS.pageTimes[page + 1]) {
        return GLVARS.pageTimes[page + 1] - GLVARS.pageTimes[page];
    } else {
        var maxTime = 0;
        for (var s = 0; s < timeMap.length; s++) {
            maxTime = Math.max(maxTime, Math.max.apply(null, timeMap[s][0]));
        }
        return maxTime - GLVARS.pageTimes[page];
    }
}

function getNormalizedTime(page, pageTime) {
    return (pageTime - GLVARS.pageTimes[page]) / pageDuration(page);
}

function getYtOffsetByScoreTime(videoID, time) {
    var timeMap = GLVARS.videoTimeMaps[videoID];
    for (var s = 0; s < timeMap.length; s++) {
        if (timeMap[s][0][0] > time) continue;
        for (var i in timeMap[s][0]) {
            if (timeMap[s][0][i] >= time) return [s, i];
        }
    }
}

function getVideoTimeForPagePosition(videoID, page, pt) {
    //console.log("getting time for page position " + page + " " + relPos);
    //var pt = GLVARS.pageTimes[page] + pageDuration(page) * relPos;
    var segmentScoreTime = getYtOffsetByScoreTime(videoID, pt);
    var timeMap = GLVARS.videoTimeMaps[videoID];
    return timeMap[segmentScoreTime[0]][1][segmentScoreTime[1]];
}

function initVideo(_videoContainerID, _videoID) {

    if (typeof YT == 'undefined') return;

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
};


function onPlayerReady(event) {
    var videoID = event.target.getVideoData().video_id;
    console.log("OnPlayerReady: " + videoID);
    //GLVARS.ytPlayers[videoID].addEventListener('onStateChange', onPlayerStateChange);
}

var deleteInterval = true;
function onPlayerStateChange(event) {
    var newState = event.data;
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

    console.log("OnPlayerStateChange: ");

    if ( newState == YT.PlayerState.PLAYING || newState == YT.PlayerState.BUFFERING ) {
        GLVARS.currentPlayingYTVideoID = event.target.getVideoData().video_id;

        for (var videoID in GLVARS.videoStatus){
            if ( videoID != GLVARS.currentPlayingYTVideoID ) {
                if ( GLVARS.ytPlayers[videoID].getPlayerState() == YT.PlayerState.PLAYING ) {
                    GLVARS.ytPlayers[videoID].pauseVideo();
                    deleteInterval = false;
                }
            }
        }
        clearInterval(GLVARS.loopId);
        GLVARS.loopId = setInterval(updatePosition, 500);
        enlargeVideoDiv(GLVARS.currentPlayingYTVideoID, 2);
    } else if ( newState == YT.PlayerState.ENDED || newState == YT.PlayerState.PAUSED ) {
        if ( deleteInterval )
            clearInterval(GLVARS.loopId);
        else
            deleteInterval = true;

        resetVideoDiv(event.target.getVideoData().video_id);
    }

}

function updatePosition() {
    console.log("updatePosition: videoID: " + GLVARS.currentPlayingYTVideoID + "");
    var videoTime = GLVARS.ytPlayers[GLVARS.currentPlayingYTVideoID].getCurrentTime();
    var pageAndTime = getPageAndTimeForVideoTime(videoTime);
    var pageAndTimePlus = getPageAndTimeForVideoTime(videoTime + GLVARS.foreRunningTime);
    if (typeof pageAndTime == "undefined") return;

    var page = pageAndTime.page;
    var pageTime = pageAndTime.pageTime;
    var normalizedPageTime = getNormalizedTime(pageAndTime.page, pageAndTime.pageTime);

    var pagePlus = pageAndTimePlus ? pageAndTimePlus.page : pageAndTime.page;

    console.log("page: " + page + " pageTime: " + pageTime);

    if (pagePlus != GLVARS.prevPage) {
        _pnq.push(['loadPage', pagePlus]);
        GLVARS.prevPage = pagePlus;
    }

    updateVideoTrackLine(pageTime);

    _pnq.push(["clearMeasureHighlightings"]);
    //if ($('#trackMeasure').prop('checked')) {
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page, true]);
    //}

    //console.log(videoTime + " " + page);
}

function getPageAndTimeForVideoTime(time) {
    var page = 0;
    var pageTime = 0;
    var timeMap = GLVARS.videoTimeMaps[GLVARS.currentPlayingYTVideoID];
    var segmentScoreTime = getSegmentScoreTime(time);
    if (typeof segmentScoreTime == "undefined") return undefined;
    var segment = segmentScoreTime[0];
    var scoreTime = timeMap[segment][0][segmentScoreTime[1]];
    if (time < timeMap[segment][1][0]) return {"page": 0, "pageTime": 0};
//    $("#confidences")
//        .text("segment " + segment + ", confidences " + confidences[segment])
//        .css("visibility", 'hidden')
//    ;
    for (var i in GLVARS.pageTimes) {
        page = i;
        pageTime = GLVARS.pageTimes[i];
        if (pageTime >= scoreTime) {
            return {"page": (page - 1), "pageTime": scoreTime};
        }
    }
    return {"page": page, "pageTime": scoreTime};
}

function getSegmentScoreTime(ytTime) {
    var timeMap = GLVARS.videoTimeMaps[GLVARS.currentPlayingYTVideoID];
    for (var s = 0; s < timeMap.length; s++) {
        if (timeMap[s][1][0] > ytTime) continue;
        var out = [s, 0];
        for (var i in timeMap[s][1]) {
            //if (timeMap[s][1][i] >= ytTime) return [s, i];
            if (timeMap[s][1][i] <= ytTime) out = [s, i];
        }
        return out;
    }
}


function showSuitableVideoDivsForTimePoint(_tp){
    calculateVisibilityOfVideoIDs(_tp);

    showAndHideVideoDivs();
}

function showSuitableVideoDivsForCurrentMousePosition(){
    var currentMouseXPoint = GLVARS.x_scale.invert(d3.mouse(this)[0]);
    var currentMouseYPoint = GLVARS.y_scale.invert(d3.mouse(this)[1]);
    console.log("hide video ID " + currentMouseXPoint);
    calculateVisibilityOfVideoIDs(currentMouseXPoint);

    if ($('#hideVideoDivs').prop('checked')) {
        showAndHideVideoDivs();
    }

    //var segm = [];
    var yAboveMousePoint = GLVARS.maxPlotY; //
    var yUnderMousePoint = 0;
    var videoIDAbove = "";
    var videoIDUnder = "";
    for (var i = 0; i < GLVARS.allVideoSegments.length; i++) {
        var currentSegment = GLVARS.allVideoSegments[i];
        if ( currentMouseXPoint >= currentSegment.x1 && currentMouseXPoint <= currentSegment.x2 ) {
            if ( currentMouseYPoint > currentSegment.y && currentSegment.y > yUnderMousePoint ) {
                yUnderMousePoint = currentSegment.y;
                videoIDUnder = currentSegment.videoID;
            }
            var yAb = currentSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT;
            if ( currentMouseYPoint < yAb && yAb < yAboveMousePoint ) {
                yAboveMousePoint = yAb;
                videoIDAbove = currentSegment.videoID;
            }
        }
    }
    //console.log("above: " + videoIDAbove + "  yAb: " + yAboveMousePoint + "        under: " + videoIDUnder + "  yUn: " + yUnderMousePoint);
    var factor = 0;
    var videoToEnlarge = "";
    if ( videoIDUnder == "" ) {
        factor = currentMouseYPoint / yAboveMousePoint;
        videoToEnlarge = videoIDAbove;
    } else if ( videoIDAbove == "" ) {
        factor = 1 - (currentMouseYPoint- yUnderMousePoint)/(GLVARS.maxPlotY - yUnderMousePoint);
        videoToEnlarge = videoIDUnder;
    } else if ( videoIDUnder == videoIDAbove ) {
        factor = 1;
        videoToEnlarge = videoIDUnder;
    } else {
        if ( (yAboveMousePoint - currentMouseYPoint) >= (currentMouseYPoint - yUnderMousePoint) ) {
            // point under is the next to mouse point
            factor = 1 - (currentMouseYPoint - yUnderMousePoint)/((yAboveMousePoint - yUnderMousePoint)/2);
            videoToEnlarge = videoIDUnder;
        } else {
            // point above is the next to mouse point
            factor = (currentMouseYPoint - yUnderMousePoint)/((yAboveMousePoint - yUnderMousePoint)/2) - 1;
            videoToEnlarge = videoIDAbove;
        }
    }
    if ( GLVARS.ytPlayers.hasOwnProperty(videoToEnlarge) ){
        if ( GLVARS.ytPlayers[videoToEnlarge].getPlayerState() != YT.PlayerState.PLAYING ) {
            enlargeVideoDiv(videoToEnlarge, 1 + factor);
        }
    }

    if ( ! $('#hideVideoDivs').prop('checked') ) {
        for (var id in GLVARS.visibilityOfVideoIDs) {
            if ( id != videoIDAbove && id != videoIDUnder ) {
                resetVideoDiv(id);
            }
        }
    }
}

function calculateVisibilityOfVideoIDs(_scoreTime){
    for (var videoID in GLVARS.visibilityOfVideoIDs) {
        //console.log(videoID + "                   " + GLVARS.visibilityOfVideoIDs[videoID]);
        if ( GLVARS.visibilityOfVideoIDs.hasOwnProperty(videoID) ) {
            GLVARS.visibilityOfVideoIDs[videoID] = false;
        }
    }

    for (var i = 0; i < GLVARS.allVideoSegments.length; i++) {
        if ( _scoreTime >= GLVARS.allVideoSegments[i].x1 && _scoreTime <= GLVARS.allVideoSegments[i].x2 ) {
            GLVARS.visibilityOfVideoIDs[GLVARS.allVideoSegments[i].videoID] = true;
        }
    }

    for (var i = 0; i < GLVARS.curves.length; i++) {
        var minX = getMin(GLVARS.curves[i].points[0].x, GLVARS.curves[i].points[5].x);
        var maxX = getMax(GLVARS.curves[i].points[0].x, GLVARS.curves[i].points[5].x);

        if ( _scoreTime >= minX && _scoreTime <= maxX ) {
            GLVARS.visibilityOfVideoIDs[GLVARS.curves[i].videoID] = true;
        }
    }
}

function showAndHideVideoDivs(){
    for (var videoID in GLVARS.visibilityOfVideoIDs) {
        if ( GLVARS.visibilityOfVideoIDs[videoID] ) {
            showDiv(videoID);
            //GLVARS.ytPlayers[videoID].addEventListener('onStateChange', onPlayerStateChange);
        } else {
            if ( GLVARS.ytPlayers[videoID].getPlayerState() != YT.PlayerState.PLAYING ){
                console.log("HideVideoID: " + videoID + "    state: " + GLVARS.ytPlayers[videoID].getPlayerState());
                hideDiv(videoID);
            }
            //GLVARS.ytPlayers[videoID].pauseVideo();
            //if ( GLVARS.currentPlayingYTVideoID == videoID ) {
            //clearInterval(GLVARS.loopId);
            //}
        }
    }
}

function hideDiv(_videoID){
    //document.getElementById(_videoID).style.display = "none";
    //document.getElementById(_videoID).style.visibility = "hidden";
    document.getElementById(_videoID).width = 0;
    document.getElementById(_videoID).height = 0;
}

function showDiv(_videoID){
    //document.getElementById(_videoID).style.display = "";
    //document.getElementById(_videoID).style.visibility = "visible";
    var faktor = 1;
    if ( GLVARS.ytPlayers[_videoID].getPlayerState() == YT.PlayerState.PLAYING ){
        faktor = 2;
    }
    document.getElementById(_videoID).width = faktor * CONSTANTS.VIDEO_WIDTH;
    document.getElementById(_videoID).height = faktor * CONSTANTS.VIDEO_HEIGHT;
}

function pause() {
//    for (var videoID in GLVARS.visibilityOfVideoIDs) {
//        if ( GLVARS.visibilityOfVideoIDs[videoID] ) {
//            GLVARS.ytPlayers[videoID].pauseVideo();}
//    }

    for (var vID in GLVARS.ytPlayers){
        if ( GLVARS.ytPlayers[vID].getPlayerState() == YT.PlayerState.PLAYING ){
            GLVARS.ytPlayers[vID].pauseVideo();
        }
    }
}

function measureClickHandler(scoreId, page, measureNumber, totalMeasures) {
    "use strict";
    console.log("clicked on page " + page + ", measure " + measureNumber + " of total " + totalMeasures + " measures");
    var scoreTime = GLVARS.pageTimes[page] + pageDuration(page) * (measureNumber - 1) / totalMeasures;
    if ($('#hideVideoDivs').prop('checked')) {
        showSuitableVideoDivsForTimePoint(scoreTime);
    } else {
        calculateVisibilityOfVideoIDs(scoreTime);
    }
    for (var videoID in GLVARS.visibilityOfVideoIDs) {
        if ( GLVARS.visibilityOfVideoIDs[videoID] ) {
            var videoTime = getVideoTimeForPagePosition(videoID, page, scoreTime);
            //var state = videoState;
//console.log('videoID: ' + videoID);
            GLVARS.ytPlayers[videoID].seekTo(Math.max(0, videoTime));
            GLVARS.ytPlayers[videoID].playVideo();
//          ytplayer.seekTo(Math.max(0, videoTime));
//          if (state != 1) {
//              ytplayer.pauseVideo();
//          }
        }
    }
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasure", measureNumber, page]);
}

function appendArrays(_array1, _array2) {
    for (var i = 0; i < _array2.length; i++) {
        _array1.push(_array2[i]);
    }
}

function modulus(_value) {
    if ( _value >= 0 ) {
        return _value;
    } else {
        return 0 - _value;
    }
}

function getMin(_x1, _x2) {
    if ( _x2 <= _x1 ) return _x2;
    else return _x1;
}

function getMax(_x1, _x2) {
    if ( _x2 >= _x1 ) return _x2;
    else return _x1;
}
