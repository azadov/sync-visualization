var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

if(!window.console) {window.console={}; window.console.log = function(){};}



(function () {
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
_pnq.push(['addMeasureClickHandler', function (scoreId, page, measureNumber, totalMeasures) {
    console.log("clicked on page " + page + ", measure " + measureNumber + " of total " + totalMeasures + " measures");
    var scoreTime = pageTimes[page] + pageDuration(page) * (measureNumber - 1) / totalMeasures;
    if ($('#hideVideoDivs').prop('checked')) {
        showSuitableVideoDivsForTimePoint(scoreTime);
    } else {
        calculateVisibilityOfVideoIDs(scoreTime);
    }
    for (var videoID in visibilityOfVideoIDs) {
        if ( visibilityOfVideoIDs[videoID] ) {
            var videoTime = getVideoTimeForPagePosition(videoID, page, scoreTime);
            //var state = videoState;
//console.log('videoID: ' + videoID);
            ytPlayers[videoID].seekTo(Math.max(0, videoTime));
            ytPlayers[videoID].playVideo();
//          ytplayer.seekTo(Math.max(0, videoTime));
//          if (state != 1) {
//              ytplayer.pauseVideo();
//          }
        }
    }
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasure", measureNumber, page]);
}]);

var rectHeight = 0.1;
var distanceBetweenRects = 0.3;
var numberOfVideoSegmentLevels = 1;
var labelShift = 4;

var plot_margin = {top: 20, right: 20, bottom: 30, left: 40},
    plot_width = 600 - plot_margin.left - plot_margin.right,
    plot_height = 320 - plot_margin.top - plot_margin.bottom;


var scoreToSyncFileNames = {};          // list of file names of video syncs for a scoreId
var sIDs = [];
var pageTimes = [];


var scoreSyncFileNames = [];
var sIDNumber = 0;

var maxPlotX = 0;
var minPlotY = 0;
var maxPlotY = 0;
var rectangles = [];
var curves = [];

var visibilityOfVideoIDs = {}; // maps videoId to the visibility of the corresponding video
var videoTimeMaps = {};        // maps videoId to localTimeMaps
var videoStatus = {};          // maps videoId to status

var ytPlayers = {};

var mouseTrackLineExist = false;
var videoTrackLineExist = false;

var currentPlayingYTVideoID = "";
var loopId;
var prevPage;
var foreRunningTime = 2.0;


$('#scoreIDs').change(function(){
    var scoreId = "";
    $("select option:selected").each(function () {
        scoreId = $(this).text();
    });

    _pnq.push(['loadScore', "IMSLP" + scoreId]);
    loadDataForScoreID(scoreId);
});

$.getJSON('alignmentQuality.json', function (json) {
    for (var i = 0; i < json.length; i++) {
        var sid = json[i].id0;
        var id1 = json[i].id1;
        var fname = "alignments/" + sid + '_' + id1 + '.json';

        //console.log(sid + "      " + fname);
        if (scoreToSyncFileNames[sid]) {
            scoreToSyncFileNames[sid].push(fname);
        }
        else {
            scoreToSyncFileNames[sid] = [fname];
            sIDs.push(sid);
        }
    }

    // populate the dropdown for score selection
    var select = $("#scoreIDs");
    for (var i = 0; i < sIDs.length; i++) {
        select.append($("<option />").val(sIDs[i]).text(sIDs[i]));
    }

    var initialScoreId = sIDs[0];

    _pnq.push(['loadScore', "IMSLP" + initialScoreId]);
    loadDataForScoreID(initialScoreId);
    setTimeout(function() {loadDataForScoreID(initialScoreId);}, 1000);

});


function resetScoreVariables(_sID) {
    mouseTrackLineExist = false;
    videoTrackLineExist = false;
    numberOfVideoSegmentLevels = 1;
    rectangles = [];
    curves = [];
    visibilityOfVideoIDs = {};
    videoTimeMaps = {};
    videoStatus = {};
    scoreSyncFileNames = scoreToSyncFileNames[_sID];
    maxPlotX = 0;
}

function resetScoreDOM() {
    d3.select('svg').remove();
    d3.select(".mouseTrackLine").remove();
    $('#videos').empty();
}

function loadDataForScoreID(_sID) {

    resetScoreVariables(_sID);
    resetScoreDOM();

    var svg = createPlotSVG();
    var doneCount = 0;
    var allPairsSyncData = [];

    function whenDone() {
        computePlotElements(allPairsSyncData, svg);
        computePlotDimensions();
        drawPlot(svg);
        initVideos(allPairsSyncData);
    }

    $.each(scoreSyncFileNames, function (i, file) {
        $.getJSON(file)
            .done(function (json) {
                doneCount++;
                allPairsSyncData.push(json);
                if (doneCount == scoreSyncFileNames.length) {
                    whenDone();
                }
            })
            .fail(function( jqxhr, textStatus, error ) {
                doneCount++;
                var err = textStatus + ', ' + error;
                console.log( "Request Failed: " + err);
                if (doneCount == scoreSyncFileNames.length) {
                    whenDone();
                }
            });
    });
}


function createVideoSegment(segmentTimeMap, videoId) {
    var scoreTimeAxis = segmentTimeMap[0];
    var videoSegmentAxis = segmentTimeMap[1];

    if ( maxPlotX < scoreTimeAxis[scoreTimeAxis.length - 1] ) {
        maxPlotX = scoreTimeAxis[scoreTimeAxis.length - 1];
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

    var firstPoint = {x: currSegment.x2, y: currSegment.y - rectHeight/2};

    var secondPoint = {x: currSegment.x2 + 10, y: currSegment.y - rectHeight/2};

    var thirdPoint ={x: currSegment.x2 + 10, y: currSegment.y + modulus(currSegment.y-nextSegment.y)/2 - rectHeight/2};

    var fourthPoint = {x: nextSegment.x1 - 10, y: currSegment.y + modulus(currSegment.y-nextSegment.y)/2 - rectHeight/2};

    var fifthPoint = {x: nextSegment.x1 - 10, y: nextSegment.y - rectHeight/2};

    var sixthPoint = {x: nextSegment.x1, y: nextSegment.y - rectHeight/2};

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
    x_scale.domain([0, maxPlotX]);
    minPlotY = 0;
    maxPlotY = numberOfVideoSegmentLevels * (rectHeight + distanceBetweenRects);
    y_scale.domain([minPlotY, maxPlotY]);
    //console.log("extremes: " + maxPlotX_basis + "     " + numberOfVideoSegmentLevels * (rectHeight+distanceBetweenRects));
}

function drawPlot(_svg) {

    // add blank rectangle
    _svg.append("rect")
        .attr("class", "blankrectangle")
        .attr("x", x_scale(0))
        .attr("width", x_scale(maxPlotX))
        .attr("y", y_scale(maxPlotY))
        .attr("height", plot_height - y_scale(maxPlotY + minPlotY))
        //.on("click", updateScorePosition)
        //.on("mousemove", updateMouseTrackLine);
        //.on("mouseout", removeMouseTrackLine);
        .on("mousemove", showSuitableVideoDivsForCurrentMousePosition);

    createPageTicks(_svg, pageTimes);

    createRectangles(_svg, rectangles);

    createCurves(_svg, curves);
}

function computePlotElements(_allPairsSyncData){

    var videoSegments = [];

    pageTimes = _allPairsSyncData[0].streamTimes0;

    _allPairsSyncData.forEach(function(pairSyncData) {

        videoSegments = [];
        var videoId = pairSyncData.uri1;

        if ( !visibilityOfVideoIDs.hasOwnProperty(videoId) ) {
            visibilityOfVideoIDs[videoId] = false;
        }
        if ( !videoTimeMaps.hasOwnProperty(videoId) ) {
            videoTimeMaps[videoId] =  pairSyncData.localTimeMaps;
        }
        if ( !videoStatus.hasOwnProperty(videoId) ){
            videoStatus[videoId] = YT.PlayerState.PAUSED;
        }

        pairSyncData.localTimeMaps.forEach(function(segmentTimeMap) {

            var videoSegment = createVideoSegment(segmentTimeMap, videoId);

            videoSegments.push(videoSegment);

        });

        videoSegments = sortRects(videoSegments);

        assignSegmentYCoordinates(videoSegments);

        appendArrays(rectangles, videoSegments);

        for (var i = 0; i < videoSegments.length - 1; i++) {
            var currSegment = videoSegments[i];
            var nextSegment = videoSegments[i + 1];
            var curve = createCurve(currSegment, nextSegment, videoId, currSegment.timeMap);
            curves.push(curve);
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

    numberOfVideoSegmentLevels++;

    _arrayOfSortedRects[0].y = numberOfVideoSegmentLevels*(rectHeight + distanceBetweenRects);

    for (var i = 1; i < _arrayOfSortedRects.length; i++) {

        if ( _arrayOfSortedRects[i-1].x2 < _arrayOfSortedRects[i].x1 ) {

            _arrayOfSortedRects[i].y = _arrayOfSortedRects[i-1].y;

        } else {

            numberOfVideoSegmentLevels++;

            _arrayOfSortedRects[i].y = numberOfVideoSegmentLevels * (rectHeight + distanceBetweenRects);

        }
    }
}


// put page numbers at appropriate times on the score time axis
function createPageTicks(_svg, _pageTimes) {

    for (var key in _pageTimes) {
        if (_pageTimes.hasOwnProperty(key)) {
            var betterLabelShift = (0 - - key) > 9 ? labelShift : labelShift / 2;
            _svg.append("text")
                .attr("x", x_scale(_pageTimes[key]) - betterLabelShift)
                .attr("y", y_scale(0))
                .attr("font-family", "sans-serif")
                .attr("font-size", "15px")
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
        .attr("x", function(d) { return x_scale(d.x1); })
        .attr("width", function(d) { return x_scale(d.width); })
        .attr("y", function(d) { return y_scale(d.y); })
        .attr("height", plot_height - y_scale(rectHeight + minPlotY))
        .on("click", updateVideoPositionRect)
        .on("mouseover", enlargeVideoDivRect)
        .on("mouseout", reduceVideoDivRect);
}

function createCurves(_svg, _curves){
    // http://www.dashingd3js.com/svg-paths-and-d3js
    // var lineData = [ { "x": 61,  "y": 0.75}, { "x": 80,  "y": 0.75},
    //                  { "x": 55,  "y": 2.75}, { "x": 61,  "y": 2.75}];
    var lineFunction = d3.svg.line()
        .x(function(d) { return x_scale(d.x); })
        .y(function(d) { return y_scale(d.y); })
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
        .on("mouseout", reduceVideoDivCurve);
}


var x_scale = d3.scale.linear()
    .range([0, plot_width]);

var y_scale = d3.scale.linear()
    .range([plot_height, 0]);

var xAxis = d3.svg.axis()
    .scale(x_scale)
    .orient("bottom");


function createPlotSVG() {


    var svg_basis = d3.select("#plotContainer").append("svg")
        .attr("width", plot_width + plot_margin.left + plot_margin.right)
        .attr("height", plot_height + plot_margin.top + plot_margin.bottom)
        .append("g")
        .attr("transform", "translate(" + plot_margin.left + "," + plot_margin.top + ")")

        .on("click", updateScorePosition)
        .on("mousemove", updateMouseTrackLine)
        .on("mouseout", removeMouseTrackLine);

    svg_basis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + plot_height + ")")
        .call(xAxis);

    xAxis.tickFormat(function (d) { return ''; });

    // drawYAxis(svg_basis);

    return svg_basis;
}


function drawYAxis(svg_basis) {
    var yAxis = d3.svg.axis()
        .scale(y_scale)
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
    var pageAndTime = getPageAndTime(x_scale.invert(d3.mouse(this)[0]));
    var page = pageAndTime.page;
    var pageTime = pageAndTime.pageTime;
    var normalizedPageTime = getNormalizedTime(page, pageTime);

    _pnq.push(['loadPage', page]);
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page, true]);

}

function updateVideoPositionRect(d) {
    var videoID = d.videoID;
    console.log("update video position rect: " + videoID);
    var timeInScore = x_scale.invert(d3.mouse(this)[0]);
    var timeInVideo = getVideoTimeFromScoreTime(timeInScore, d.timeMap);

    ytPlayers[videoID].seekTo(Math.max(0, timeInVideo));
    ytPlayers[videoID].playVideo();
}

function updateVideoPositionCurve(d) {
    console.log("videoID curve: " + d.videoID);
}

function enlargeVideoDivRect(d) {
    //console.log("videoID rect: " + d.videoID);
    enlargeVideoDiv(d.videoID);
}

function enlargeVideoDivCurve(d) {
    //console.log("videoID rect: " + d[0].videoID);
    enlargeVideoDiv(d.videoID);
}

function enlargeVideoDiv(_videoID) {
    console.log("video to enlarge: " + _videoID);
    var divToEnlarge = document.getElementById(_videoID);
    divToEnlarge.width = 2 * divToEnlarge.width;
    divToEnlarge.height = 2 * divToEnlarge.height;
}

function reduceVideoDivRect(d) {
    reduceVideoDiv(d.videoID);
}

function reduceVideoDivCurve(d) {
    reduceVideoDiv(d.videoID);
}

function reduceVideoDiv(_videoID) {
    console.log("video to reduce: " + _videoID);
    var divToReduce = document.getElementById(_videoID);
    divToReduce.width = divToReduce.width/2;
    divToReduce.height = divToReduce.height/2;
}


function updateMouseTrackLine(d){
    //var mouseTrackLine = document.getElementsByClassName("mouseTrackLine"); //d3.select(".mouseTrackLine");

    if ( mouseTrackLineExist ) {
        d3.select(".mouseTrackLine").attr("x1", d3.mouse(this)[0])
            .attr("y1", y_scale(0))
            .attr("x2", d3.mouse(this)[0])
            .attr("y2", y_scale(maxPlotY));
    } else {
        var svgContainer = d3.select("g");
        var mouseTrackLine = svgContainer.append("line")
            .attr("class", "mouseTrackLine")
            .attr("x1", d3.mouse(this)[0])
            .attr("y1", y_scale(0))
            .attr("x2", d3.mouse(this)[0])
            .attr("y2", y_scale(maxPlotY))
            .attr("stroke-width", 2)
            .attr("stroke", "grey")
            .attr("pointer-events", "none");
        mouseTrackLineExist = true;
    }
}

function removeMouseTrackLine(d){
    console.log("remove mouseTrackLine");
    d3.select(".mouseTrackLine").remove();
}

function updateVideoTrackLine(_scorePos){
    if ( videoTrackLineExist ) {
        d3.select(".videoTrackLine").attr("x1", x_scale(_scorePos))
            .attr("y1", y_scale(0))
            .attr("x2", x_scale(_scorePos))
            .attr("y2", y_scale(maxPlotY));
    } else {
        var svgContainer = d3.select("g");
        var videoTrackLine = svgContainer.append("line")
            .attr("class", "videoTrackLine")
            .attr("x1", x_scale(_scorePos))
            .attr("y1", y_scale(0))
            .attr("x2", x_scale(_scorePos))
            .attr("y2", y_scale(maxPlotY))
            .attr("stroke-width", 2)
            .attr("stroke", "lightblue");
        videoTrackLineExist = true;
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
    for (var i in pageTimes) {
        page = i;
        pageTime = pageTimes[i];
        if (pageTime >= _scoreTime) {
            console.log("page: " + page - 1);
            return {"page": (page - 1), "pageTime": _scoreTime};
        }
    }
    //console.log("page: " + page);
    return {"page": page, "pageTime": _scoreTime};
}

function pageDuration(page) {
    if (pageTimes[page + 1]) {
        return pageTimes[page + 1] - pageTimes[page];
    } else {
        var maxTime = 0;
        for (var s = 0; s < timeMap.length; s++) {
            maxTime = Math.max(maxTime, Math.max.apply(null, timeMap[s][0]));
        }
        return maxTime - pageTimes[page];
    }
}

function getNormalizedTime(page, pageTime) {
    return (pageTime - pageTimes[page]) / pageDuration(page);
}

function getYtOffsetByScoreTime(videoID, time) {
    var timeMap = videoTimeMaps[videoID];
    for (var s = 0; s < timeMap.length; s++) {
        if (timeMap[s][0][0] > time) continue;
        for (var i in timeMap[s][0]) {
            if (timeMap[s][0][i] >= time) return [s, i];
        }
    }
}

function getVideoTimeForPagePosition(videoID, page, pt) {
    //console.log("getting time for page position " + page + " " + relPos);
    //var pt = pageTimes[page] + pageDuration(page) * relPos;
    var segmentScoreTime = getYtOffsetByScoreTime(videoID, pt);
    var timeMap = videoTimeMaps[videoID];
    return timeMap[segmentScoreTime[0]][1][segmentScoreTime[1]];
}

function initVideo(_videoContainerID, _videoID) {

    if (typeof YT == 'undefined') return;

    var ytplayer = new YT.Player(_videoContainerID, {
        height: '100',
        width: '150',
        videoId: _videoID,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

    ytPlayers[_videoID] = ytplayer;
};


function onPlayerReady(event) {
    var videoID = event.target.getVideoData().video_id;
    console.log("OnPlayerReady: " + videoID);
    //ytPlayers[videoID].addEventListener('onStateChange', onPlayerStateChange);
}

var deleteInterval = true;
function onPlayerStateChange(event) {
    var newState = event.data;
    //console.log("state: " + event.data + "     target: " + event.target.id);
//    for (var videoID in ytPlayers) {
//        if ( ytPlayers[videoID] == event.target ) {
//            console.log("videoId: " + videoID);
//        }
//    }
//    console.log("videoID: " + event.target.getVideoData().video_id);
//    for (var key in event.target.getVideoData().video_id) {
//        console.log("key: " + key);
//    }

    console.log("OnPlayerStateChange: ");

    if ( newState == YT.PlayerState.PLAYING ) {
        currentPlayingYTVideoID = event.target.getVideoData().video_id;

        for (var videoID in videoStatus){
            if ( videoID != currentPlayingYTVideoID ) {
                if ( ytPlayers[videoID].getPlayerState() == YT.PlayerState.PLAYING ) {
                    ytPlayers[videoID].pauseVideo();
                    deleteInterval = false;
                }
            }
        }
        clearInterval(loopId);
        loopId = setInterval(updatePosition, 500);
    } else if ( newState == YT.PlayerState.ENDED || newState == YT.PlayerState.PAUSED ) {
        if ( deleteInterval )
            clearInterval(loopId);
        else
            deleteInterval = true;
    }

}

function updatePosition() {
    console.log("\n updatePosition: videoID: " + currentPlayingYTVideoID + "\n");
    var videoTime = ytPlayers[currentPlayingYTVideoID].getCurrentTime();
    var pageAndTime = getPageAndTimeForVideoTime(videoTime);
    var pageAndTimePlus = getPageAndTimeForVideoTime(videoTime + foreRunningTime);
    if (typeof pageAndTime == "undefined") return;

    var page = pageAndTime.page;
    var pageTime = pageAndTime.pageTime;
    var normalizedPageTime = getNormalizedTime(pageAndTime.page, pageAndTime.pageTime);

    var pagePlus = pageAndTimePlus ? pageAndTimePlus.page : pageAndTime.page;

    console.log("page: " + page + " pageTime: " + pageTime);

    if (pagePlus != prevPage) {
        _pnq.push(['loadPage', pagePlus]);
        prevPage = pagePlus;
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
    var timeMap = videoTimeMaps[currentPlayingYTVideoID];
    var segmentScoreTime = getSegmentScoreTime(time);
    if (typeof segmentScoreTime == "undefined") return undefined;
    var segment = segmentScoreTime[0];
    var scoreTime = timeMap[segment][0][segmentScoreTime[1]];
    if (time < timeMap[segment][1][0]) return {"page": 0, "pageTime": 0};
//    $("#confidences")
//        .text("segment " + segment + ", confidences " + confidences[segment])
//        .css("visibility", 'hidden')
//    ;
    for (var i in pageTimes) {
        page = i;
        pageTime = pageTimes[i];
        if (pageTime >= scoreTime) {
            return {"page": (page - 1), "pageTime": scoreTime};
        }
    }
    return {"page": page, "pageTime": scoreTime};
}

function getSegmentScoreTime(ytTime) {
    var timeMap = videoTimeMaps[currentPlayingYTVideoID];
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

    if ($('#hideVideoDivs').prop('checked')) {
        var currentMouseXPoint = x_scale.invert(d3.mouse(this)[0]);
        //console.log(visibilityOfVideoIDs);
        calculateVisibilityOfVideoIDs(currentMouseXPoint);

        showAndHideVideoDivs();
    }
}

function calculateVisibilityOfVideoIDs(_scoreTime){
    for (var videoID in visibilityOfVideoIDs) {
        //console.log(videoID + "                   " + visibilityOfVideoIDs[videoID]);
        if ( visibilityOfVideoIDs.hasOwnProperty(videoID) ) {
            visibilityOfVideoIDs[videoID] = false;
        }
    }

    for (var i = 0; i < rectangles.length; i++) {
        if ( _scoreTime >= rectangles[i].x1 && _scoreTime <= rectangles[i].x2 ) {
            visibilityOfVideoIDs[rectangles[i].videoID] = true;
        }
    }

    for (var i = 0; i < curves.length; i++) {
        var minX = getMin(curves[i].points[0].x, curves[i].points[5].x);
        var maxX = getMax(curves[i].points[0].x, curves[i].points[5].x);

        if ( _scoreTime >= minX && _scoreTime <= maxX ) {
            visibilityOfVideoIDs[curves[i].videoID] = true;
        }
    }
}

function showAndHideVideoDivs(){
    for (var videoID in visibilityOfVideoIDs) {
        if ( visibilityOfVideoIDs[videoID] ) {
            showDiv(videoID);
            //ytPlayers[videoID].addEventListener('onStateChange', onPlayerStateChange);
        } else {
            if ( ytPlayers[videoID].getPlayerState() != YT.PlayerState.PLAYING ){
                console.log("HideVideoID: " + videoID + "    state: " + ytPlayers[videoID].getPlayerState());
                hideDiv(videoID);
            }
            //ytPlayers[videoID].pauseVideo();
            //if ( currentPlayingYTVideoID == videoID ) {
            //clearInterval(loopId);
            //}
        }
    }
}

function hideDiv(_videoID){
    //document.getElementById(_videoID).style.display = "none";
    document.getElementById(_videoID).style.visibility = "hidden";
}

function showDiv(_videoID){
    //document.getElementById(_videoID).style.display = "";
    document.getElementById(_videoID).style.visibility = "visible";
}

function pause() {
//    for (var videoID in visibilityOfVideoIDs) {
//        if ( visibilityOfVideoIDs[videoID] ) {
//            ytPlayers[videoID].pauseVideo();}
//    }

    for (var vID in ytPlayers){
        if ( ytPlayers[vID].getPlayerState() == YT.PlayerState.PLAYING ){
            ytPlayers[vID].pauseVideo();
        }
    }
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
