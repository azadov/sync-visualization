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
_pnq.push(['widgetHeight', 580]);
_pnq.push(['widgetWidth', 450]);
_pnq.push(['addMeasureClickHandler', function (scoreId, page, measureNumber, totalMeasures) {
    console.log("clicked on page " + page + ", measure " + measureNumber + " of total " + totalMeasures + " measures");
    //var videoTime = getVideoTimeForPagePosition(page, (measureNumber - 1) / totalMeasures);
    var state = videoState;
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasure", measureNumber, page]);
//        ytplayer.seekTo(Math.max(0, videoTime));
//        if (state != 1) {
//            ytplayer.pauseVideo();
//        }
}]);

var rectHeight = 0.1;
var distanceBetweenRects = 0.3;
var numOfLevels = 1;

var scoreToVids = {};
var filenames = [];
var sIDs = [];
var pageTimes = [];

$('#scoreIDs').change(function(){
    var str = "";
    $("select option:selected").each(function () {
        str=$(this).text();
    });
    _pnq.push(['loadScore', "IMSLP" + str]);
    loadDataForScoreID(str);
});

$.getJSON('test/alignmentQuality.json', function (json) {
    for (var i = 0; i < json.length; i++) {
        var sid = json[i].id0;
        var id1 = json[i].id1;
        var fname = "test/" + sid + '_' + id1 + '.json';

        //console.log(sid + "      " + fname);
        if ( scoreToVids[sid] ) {scoreToVids[sid].push(fname); }
        else {scoreToVids[sid] = [fname]; sIDs.push(sid); }
    }

    var select = document.getElementById("scoreIDs");
    for (var i = 0; i < sIDs.length; i++) {
        select.options[select.options.length] = new Option(sIDs[i], sIDs[i]);
    }

    loadDataForScoreID(sIDs[0]);
    _pnq.push(['loadScore', "IMSLP00001"]);
    setTimeout(function() {loadDataForScoreID(sIDs[0]);}, 1000);

    //iterateFiles();
});

var files = [];
var sIDNumber = 0;
//var activeInterval;
//function iterateFiles() {
//// 00155_6D5im3E8E7E.json  3
//// 00155_KDOtrTCUHBY.json  1
//// 00155_qEzZw8QIZ90.json  6
//// 00155_SxMFjM42CY8.json  1
//    //var files = ['00155/00155_6D5im3E8E7E.json', '00155/00155_KDOtrTCUHBY.json', '00155/00155_qEzZw8QIZ90.json', '00155/00155_SxMFjM42CY8.json']
//
////    var scoreToVids2 = {};
////    scoreToVids2["00001"] = scoreToVids["00001"];
////    scoreToVids2["01986"] = scoreToVids["01986"];
////    scoreToVids =  scoreToVids2;
////    sIDs=[];
////    sIDs.push("00001"); sIDs.push("01986");
//
//    activeInterval = setInterval("drawPlot()", 2000);
//    //drawPlot();
////    for (var key in scoreToVids) {
////        if (scoreToVids.hasOwnProperty(key)) {
////            files = scoreToVids[key];
////            console.log(key);
////            //drawPlot();
////            setTimeout("drawPlot()", 4000);
////        }
////    }
//}

function loadDataForScoreID(_sID) {
    d3.select('svg').remove();
    d3.select(".mouseTrackLine").remove();

    mouseTrackLineExist = false;

    $('#videos').empty();

    numOfLevels = 1;

    rectangles = [];

    activityOfVideoIDs = {};

    var svg = createAndGetSVGObject();

    var doneCount = 0;
    var data = [];

    files = scoreToVids[_sID];

    $.each(files, function (i, file) {
        $.getJSON(file, function (json) {
            doneCount++;
            //result += json.field1;
            data.push(json);
            if (doneCount == files.length) {
                createPlotElements(data, svg);
            }
        })
    });
}

var maxX = 0;
var maxY = 0;
var rectangles = [];
var activityOfVideoIDs = {};
function createPlotElements(_data, _svg){
//$.getJSON('00155_qEzZw8QIZ90.json', function(data) {
    var basis;
    var notbasis;
    //var maxX = 0;
    //var all_rects = [];
    var rectanglesOfOneVideo = [];
    var curves = [];
    var newRectangle = {};

    _data.forEach(function(data) {
        rectanglesOfOneVideo = [];
        if ( !activityOfVideoIDs.hasOwnProperty(data.uri1) ) {activityOfVideoIDs[data.uri1] = false; }
        //curves = [];
        data.localTimeMaps.forEach(function(d) {
            basis = d[0];
            notbasis = d[1];

            if ( maxX < basis[basis.length - 1] ) {
                maxX = basis[basis.length - 1];
            }

            newRectangle = {};
            newRectangle.x1 = basis[0];
            newRectangle.x2 = basis[basis.length - 1];
            //newRectangle.y = rectanglesOfOneVideo.length*rectHeight + rectHeight;
            newRectangle.width = basis[basis.length - 1] - basis[0];
            newRectangle.x1_notbasis = notbasis[0];
            newRectangle.videoID = data.uri1;
            newRectangle.timeMap = d;

            //console.log(notbasis[0] + "       " + notbasis[notbasis.length - 1]);

            rectanglesOfOneVideo.push(newRectangle);
        });

        rectanglesOfOneVideo = sortRects(rectanglesOfOneVideo);
        assignY(rectanglesOfOneVideo);
        joinArrays(rectangles, rectanglesOfOneVideo);
        console.log(rectangles.length + "      " + rectanglesOfOneVideo.length);

        for (var i = 0; i < rectanglesOfOneVideo.length - 1; i++) {

            var firstPoint = {x: rectanglesOfOneVideo[i].x2, y: rectanglesOfOneVideo[i].y - rectHeight/2};

            var secondPoint = {x: rectanglesOfOneVideo[i].x2 + 10, y: rectanglesOfOneVideo[i].y - rectHeight/2};

            //var thirdPoint ={x: modulus(rectanglesOfOneVideo[i].x2+rectanglesOfOneVideo[i+1].x1)/2, y: rectanglesOfOneVideo[i].y + modulus(rectanglesOfOneVideo[i].y-rectanglesOfOneVideo[i+1].y)/2};
            var thirdPoint ={x: rectanglesOfOneVideo[i].x2 + 10, y: rectanglesOfOneVideo[i].y + modulus(rectanglesOfOneVideo[i].y-rectanglesOfOneVideo[i+1].y)/2 - rectHeight/2};

            var fourthPoint = {x: rectanglesOfOneVideo[i+1].x1 - 10, y: rectanglesOfOneVideo[i].y + modulus(rectanglesOfOneVideo[i].y-rectanglesOfOneVideo[i+1].y)/2 - rectHeight/2};

            var fifthPoint = {x: rectanglesOfOneVideo[i+1].x1 - 10, y: rectanglesOfOneVideo[i+1].y - rectHeight/2};

            var sixthPoint = {x: rectanglesOfOneVideo[i+1].x1, y: rectanglesOfOneVideo[i+1].y - rectHeight/2};
            //console.log(rectanglesOfOneVideo[i].x_notbasis);

            var points = [];
            points.push(firstPoint);
            points.push(secondPoint);
            points.push(thirdPoint);
            points.push(fourthPoint);
            points.push(fifthPoint);
            points.push(sixthPoint);

            var curve = {};
            curve['points'] = points;

            var diff = rectanglesOfOneVideo[i+1].timeMap[1][rectanglesOfOneVideo[i+1].timeMap[1].length - 1] - rectanglesOfOneVideo[i].timeMap[1][rectanglesOfOneVideo[i].timeMap[1].length - 1];
            var strokeDasharray = "0,0";
            if ( diff < 1 ) {
                strokeDasharray = "2,2";
            }
            curve['strokeDash'] = strokeDasharray;
            curve['videoID'] =  data.uri1;
            curve['timeMap'] = rectanglesOfOneVideo[i].timeMap;

            curves.push(curve);
        }

        var videoDiv = document.getElementById("videos");
        var newVideoDiv = document.createElement("div");

        newVideoDiv.setAttribute("class", "video");
        newVideoDiv.setAttribute("id",  data.uri1);

        videoDiv.appendChild(newVideoDiv);

        initVideo(data.uri1, data.uri1);
    });

    //console.log("extremes: " + maxX_basis + "     " + numOfLevels * (rectHeight+distanceBetweenRects));
    x_scale.domain([0, maxX]);
    minY = 0;
    maxY = numOfLevels * (rectHeight+distanceBetweenRects);
    y_scale.domain([minY, maxY]);

    pageTimes = _data[0].streamTimes0;

    // add blank rectangle
    _svg.append("rect")
        .attr("class", "blankrectangle")
        .attr("x", x_scale(0))
        .attr("width", x_scale(maxX))
        .attr("y", y_scale(maxY))
        .attr("height", plot_height - y_scale(maxY + minY))
    //.on("click", updateScorePosition)
    //.on("mousemove", updateMouseTrackLine);
    //.on("mouseout", removeMouseTrackLine);
        .on("mousemove", showSuitableVideoDivs);

    createPageTicks(_svg, pageTimes);

    createRectangles(_svg, rectangles);

    createCurves(_svg, curves);
}

/**
 * sorts rectangles according the x coordinate of not basis (video) file
 * @param _arrayOfRects
 * @returns {*}
 */
function sortRects(_arrayOfRects) {
    sortedArrayOfRects = [];

    var minElem = 1000000;
    var indexOfMinElem = 0;
    while ( _arrayOfRects.length > 0 ) {
        //console.log("bla" + _arrayOfRects);
        minElem = 1000000;
        indexOfMinElem = 0;
        for (var i = 0; i < _arrayOfRects.length; i++) {
            if ( minElem > _arrayOfRects[i].x1_notbasis ) {
                minElem = _arrayOfRects[i].x1_notbasis;
                indexOfMinElem = i;
            }
        }
        //console.log(_arrayOfRects[indexOfMinElem].x_notbasis + "      " + minElem);

        sortedArrayOfRects.push(_arrayOfRects[indexOfMinElem]);

        _arrayOfRects.splice(indexOfMinElem, 1);
    }
    //alert(_arrayOfRects.length);

    return sortedArrayOfRects;
}

/**
 *
 * @param _arrayOfSortedRects    sorted rects for one video
 */
function assignY(_arrayOfSortedRects) {
    numOfLevels++;
    _arrayOfSortedRects[0].y = numOfLevels*(rectHeight + distanceBetweenRects);
    //var numOfLevels = 1;
    for (var i = 1; i < _arrayOfSortedRects.length; i++) {
        if ( _arrayOfSortedRects[i-1].x2 < _arrayOfSortedRects[i].x1 ) {
            _arrayOfSortedRects[i].y = _arrayOfSortedRects[i-1].y;
        } else {
            numOfLevels++;
            _arrayOfSortedRects[i].y = numOfLevels*(rectHeight + distanceBetweenRects);
        }
    }
}

function createPageTicks(_svg, _pageTimes) {
    //var pageTimesArray = [];
    for (var key in _pageTimes) {
        if (_pageTimes.hasOwnProperty(key)) {
            //pageTimesArray.push(pageTimes[key]);
            //console.log(pageTimes[key] + "           " + x_scale(pageTimes[key]));
            _svg.append("text")
                .attr("x", x_scale(_pageTimes[key]))
                .attr("y", y_scale(0))
                .text(key)
                .attr("font-family", "sans-serif")
                .attr("font-size", "15px")
                .attr("fill", "grey");
        }
    }

    xAxis.tickFormat(function (d) { return ''; });

    //console.log("PageTime: " + pageTimesArray);
    //xAxis.tickValues(pageTimesArray);
}

function createRectangles(_svg, _rects){
    _svg.selectAll(".bar")
        .data(_rects)
        .enter().append("rect")
        .attr("class", "rectangle")
        .attr("x", function(d) { return x_scale(d.x1); })
        .attr("width", function(d) { return x_scale(d.width); })
        .attr("y", function(d) { return y_scale(d.y); })
        .attr("height", plot_height - y_scale(rectHeight + minY))
        .on("click", updateVideoPositionRect)
        .on("mouseover", enlargeVideoDivRect)
        .on("mouseout", reduceVideoDivRect);
//            .on("mouseenter", enlargeVideoDivRect)
//            .on("mouseleave", reduceVideoDivRect)
    //.on("mousemove", updateMouseTrackLine);
}

function createCurves(_svg, _curves){
    // http://www.dashingd3js.com/svg-paths-and-d3js
    //var lineData = [ { "x": 61,  "y": 0.75}, { "x": 80,  "y": 0.75},
    //                 { "x": 55,  "y": 2.75}, { "x": 61,  "y": 2.75}];
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

var plot_margin = {top: 20, right: 20, bottom: 30, left: 40},
    plot_width = 600 - plot_margin.left - plot_margin.right,
    plot_height = 320 - plot_margin.top - plot_margin.bottom;

var x_scale = d3.scale.linear()
    .range([0,plot_width]);

var y_scale = d3.scale.linear()
    .range([plot_height, 0]);

var xAxis = d3.svg.axis()
    .scale(x_scale)
    .orient("bottom");
//.tickValues([50, 100, 150, 200, 250, 300])
//.ticks(["a","b","c","d","e","f"]);

function createAndGetSVGObject(){

//plot_height = 500 - plot_margin.top - plot_margin.bottom;

//    x_scale = d3.scale.linear()
//            .range([0,plot_width]);
//
//    y_scale = d3.scale.linear()
//            .range([plot_height, 0]);
    //console.log("width: " + plot_width + "     height: " + plot_height);
//    var xAxis = d3.svg.axis()
//            .scale(x_scale)
//            .orient("bottom")
//            .tickValues([50, 100, 150, 200, 250, 300])
//            .ticks(["a","b","c","d","e","f"]);

    var yAxis = d3.svg.axis()
        .scale(y_scale)
        .orient("left");
    ///d3.select("body").append("svg")
    var svg_basis = d3.select("#plotContainer").append("svg")
        .attr("width", plot_width + plot_margin.left + plot_margin.right)
        .attr("height", plot_height + plot_margin.top + plot_margin.bottom)
        .append("g")
        .attr("transform", "translate(" + plot_margin.left + "," + plot_margin.top + ")")
        .on("click", updateScorePosition)
    //.on("mousemove", updateMouseTrackLine);
    //.on("mouseout", removeMouseTrackLine);

    svg_basis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + plot_height + ")")
        .call(xAxis)

    svg_basis.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Frequency");

    return svg_basis;
}

function updateScorePosition(d) {
    //console.log("x: " + d3.mouse(this)[0] + "     y: " + d3.mouse(this)[1]);
    //console.log("x sc: " + x_scale(d3.mouse(this)[0]) + "     y sc: " + y_scale(d3.mouse(this)[1]));
    //console.log("x inv: " + x_scale.invert(d3.mouse(this)[0]) + "     y inv: " + y_scale.invert(d3.mouse(this)[1]));
    //console.log("x inv: " + invertCoordinates(d3.mouse(this))[0] + "    y inv: " + invertCoordinates(d3.mouse(this))[1]);
    //console.log("maxX: " + maxX + "    width: " + plot_width + "    quot: " + maxX/plot_width);
    //console.log(d3.select(this));
    console.log("update score position");
    var pageAndTime = getPageAndTime(x_scale.invert(d3.mouse(this)[0]));
    var page = pageAndTime.page;
    var pageTime = pageAndTime.pageTime;
    var normalizedPageTime = getNormalizedTime(pageAndTime.page, pageAndTime.pageTime);

    _pnq.push(['loadPage', page]);

    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page, true]);

}

function updateVideoPositionRect(d) {
    console.log("update video position rect: " + d.videoID);
    var videoID = d.videoID;
    var timeInScore = x_scale.invert(d3.mouse(this)[0]);
    var timeInVideo = getVideoTimeFromScoreTime(timeInScore, d.timeMap);

    ytPlayers[d.videoID].seekTo(Math.max(0, timeInVideo));
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

var mouseTrackLineExist = false;
function updateMouseTrackLine(d){
    //var mouseTrackLine = document.getElementsByClassName("mouseTrackLine"); //d3.select(".mouseTrackLine");

    if ( mouseTrackLineExist ) {
//console.log("mouseTrackLine da ");
        d3.select(".mouseTrackLine").attr("x1", d3.mouse(this)[0])
            .attr("y1", y_scale(0))
            .attr("x2", d3.mouse(this)[0])
            .attr("y2", y_scale(maxY));
    } else {
//console.log("mouseTrackLine net da: create mouseTrackLine");
        var svgContainer = d3.select("g");
        mouseTrackLine = svgContainer.append("line")
            .attr("class", "mouseTrackLine")
            .attr("x1", d3.mouse(this)[0])
            //.attr("x1", x_scale(x_scale.invert(d3.mouse(this)[0])))
            .attr("y1", y_scale(0))
            .attr("x2", d3.mouse(this)[0])
            //.attr("x2", x_scale(190))
            .attr("y2", y_scale(maxY))
            .attr("stroke-width", 2)
            .attr("stroke", "grey");
        mouseTrackLineExist = true;
    }
    //d3.select(".mouseTrackLine").remove();
}

function removeMouseTrackLine(d){
    console.log("remove mouseTrackLine");
    d3.select(".mouseTrackLine").remove();
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

//function invertCoordinates(d){
//    //d[0];
//    //return [maxX/plot_width * d[0], maxY/plot_height * d[1]];
//    return [maxX/plot_width * d[0], maxY/plot_height * d[1]];
//}

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

var ytPlayers = {};
function initVideo(_videoContainerID, _videoID) {
//    $('#videoContainer')
//            .css('position', 'fixed')
//            .css('top', '100px')
//            .css('left', '550px')
//    ;
//console.log(_videoContainerID + "          " + _videoID );
    var vid = '#' + _videoContainerID; //#videoContainer';
    //var divid = "ytplayerdiv-" + _videoID;
    //$(vid).empty().append("<div id=" + divid + ">"); //append("<div id=\"ytplayerdiv\">");

    if (typeof YT == 'undefined') return;

    var ytplayer = new YT.Player(_videoContainerID, {
        height: '100',
        width: '150',
        videoId: _videoID //ytVideoId,
//        events: {
//            'onReady': onPlayerReady,
//            'onStateChange': onPlayerStateChange
//        }
    });

    ytPlayers[_videoID] = ytplayer;
    //window.ytplayer = ytplayer;
};
//window.initVideo = initVideo;

function onPlayerStateChange(newState) {
    //var newState = event.data;
    console.log(newState);
    if (newState == 1) {
        if (videoState == 0) {
            $('#pauseButton').click();
            videoState = 1;
        }
    } else if (newState == -1) {
        //$('#pauseButton').click();
        //$('#pauseButton').text('start');
    } else if (newState == 2) {
        if ($('#pauseButton').text() == 'pause')
            $('#pauseButton').click();
        videoState = 0;
    }
}
//
//function onPlayerReady(event) {
//    ytplayer = event.target;
//    //ytplayer.playVideo();
//}

function showSuitableVideoDivs(){
    var actualMouseXPoint = x_scale.invert(d3.mouse(this)[0]);
    //console.log(activityOfVideoIDs);
    for (var videoID in activityOfVideoIDs) {
        console.log(videoID + "                   " + activityOfVideoIDs[videoID]);
        if ( activityOfVideoIDs.hasOwnProperty(videoID) ) {
            activityOfVideoIDs[videoID] = false;
        }
    }

    for (var i = 0; i < rectangles.length; i++) {
          if ( actualMouseXPoint >= rectangles[i].x1 && actualMouseXPoint <= rectangles[i].x2 ) {
              activityOfVideoIDs[rectangles[i].videoID] = true;
          }
    }

    for (var videoID in activityOfVideoIDs) {
        if ( activityOfVideoIDs[videoID] ) {
            showDiv(document.getElementById(videoID));
        } else {
            hideDiv(document.getElementById(videoID));
        }
    }
}

function hideDiv(_div){
    _div.style.display = "none";
}

function showDiv(_div){
    _div.style.display = "";
}

function joinArrays(_array1, _array2) {
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
