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
        if (GLVARS.allScoreToSyncFileNames[sid]) {
            GLVARS.allScoreToSyncFileNames[sid].push([fname, confidence, id1]);
        } else {
            GLVARS.allScoreToSyncFileNames[sid] = [[fname, confidence, id1]];
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
    GLVARS.radiobuttons = [];
    GLVARS.visibilityOfVideoIDs = {};
    GLVARS.videoTimeMaps = {};
    GLVARS.videoStatus = {};
    GLVARS.videoTitle = {};
    GLVARS.scoreSyncFileNames = GLVARS.allScoreToSyncFileNames[_sID];
    GLVARS.maxPlotX = 0;
    GLVARS.ytPlayers = {};
    GLVARS.ytPlayerThumbnails = {};

}

function resetScoreDOM() {
    'use strict';

    d3.select('svg').remove();
    d3.select(".mouseTrackLine").remove();
    $('#videos').empty();
    $('#plotContainer').empty();
}

function loadDataForScoreID(_sID, _quality) {
    'use strict';

    resetScoreVariables(_sID);
    resetScoreDOM();

    var svg = createPlotSVG(), doneCount = 0, doneCountCheck1 = 0, allScoreToVideoPairsSyncData = [], vid, url, noRestrictedVideos = [];

    function whenDone() {
        computePlotElements(allScoreToVideoPairsSyncData, svg);
        computePlotDimensions();
        drawPlot(svg);
        initVideos(allScoreToVideoPairsSyncData);
    }

    function whenChekingAvailabilityOfVidesIsDone() {

        $.each(GLVARS.scoreSyncFileNames, function (i, fileQual) {
            if (fileQual[1] >= _quality) {
                $.getJSON(fileQual[0])
                    .done(function (json) {
                        doneCount = doneCount + 1;

                        allScoreToVideoPairsSyncData.push(json);
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

    $.each(GLVARS.scoreSyncFileNames, function (i, entry) {
        var url = "http://gdata.youtube.com/feeds/api/videos/" + entry[2] + "?v=2&alt=json-in-script&callback=?"; // prettyprint=true
        //console.log(url + "      ");
        $.getJSON(url)
            .done(function (jsonObj) {
                doneCountCheck1 = doneCountCheck1 + 1
                //var vidID = jsonObj.entry['media$group']['yt$videoid']['$t']; // it is wrong use 'vid' hier
                GLVARS.videoTitle[entry[2]] = jsonObj.entry.title['$t'];

//                if (jsonObj.entry.app$control.yt$state['$t'] !== "This video is not available in your region.") {
//                    noRestrictedVideos.push(entry);
//                }

                if (doneCountCheck1 === GLVARS.scoreSyncFileNames.length) {
                    //GLVARS.scoreSyncFileNames = noRestrictedVideos;
                    whenChekingAvailabilityOfVidesIsDone();
                }
            })
            .fail(function(jqxhr, textStatus, error) {
                doneCountCheck1 = doneCountCheck1 + 1
                GLVARS.videoTitle[entry[2]] = "Data not available";

                if (doneCountCheck1 === GLVARS.scoreSyncFileNames.length) {
                    //GLVARS.scoreSyncFileNames = noRestrictedVideos;
                    whenChekingAvailabilityOfVidesIsDone();
                }
            });
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
    GLVARS.maxPlotY = GLVARS.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS) + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS / 2;
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

    createRadioButtons(_svg, GLVARS.radiobuttons);
}

function computePlotElements(_allScoreToVideoPairsSyncData) {
    'use strict';

    var videoSegments = [], currSegment, nextSegment, curve;

    GLVARS.pageTimes = _allScoreToVideoPairsSyncData[0].streamTimes0;

    _allScoreToVideoPairsSyncData.forEach(function (pairSyncData) {

        videoSegments = [];
        var videoId = pairSyncData.uri1, i, videoSegment, conf, rbutton;

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
//        if (!GLVARS.videoTitle.hasOwnProperty(videoId)) {
//            addVideoTitle(videoId);
//        }

        //pairSyncData.localTimeMaps.forEach(function (segmentTimeMap) {
        for (i = 0; i < pairSyncData.localTimeMaps.length; i = i + 1) {
            conf = getMin(pairSyncData.confidences[i][0], pairSyncData.confidences[i][1]);
            videoSegment = createVideoSegment(pairSyncData.localTimeMaps[i], videoId, conf);

            videoSegments.push(videoSegment);

        }

        videoSegments = sortRects(videoSegments);

        assignSegmentYCoordinates(videoSegments);


        for (i = 0; i < videoSegments.length - 1; i = i + 1) {
            currSegment = videoSegments[i];
            nextSegment = videoSegments[i + 1];
            curve = createCurve(currSegment, nextSegment, videoId);
            GLVARS.curves.push(curve);
        }

        for (i = 0; i < videoSegments.length; i = i + 1) {
            rbutton = {};
            rbutton.videoID = videoId;
            rbutton.segmentIndex = GLVARS.allVideoSegments.length + i; // index in GLVARS.allVideoSegments array
            rbutton.y = videoSegments[i].y - CONSTANTS.SEGMENT_RECT_HEIGHT / 2;
            GLVARS.radiobuttons.push(rbutton);
            //console.log("Length: " + GLVARS.allVideoSegments.length + "    i: " + "     index: " + rbutton.index);
        }

        appendArrays(GLVARS.allVideoSegments, videoSegments);

//        rbutton.videoID = videoId;
//        //rbutton.y = videoSegments[0].y - CONSTANTS.SEGMENT_RECT_HEIGHT / 2;
//        rbutton.y = videoSegments[videoSegments.length - 1].y + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS / 2;
//        //rbutton.height = GLVARS.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS);
//        rbutton.height = (videoSegments[videoSegments.length - 1].y + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS / 2) - (videoSegments[0].y - CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS / 2 - CONSTANTS.SEGMENT_RECT_HEIGHT)
//        GLVARS.radiobuttons.push(rbutton);
//        //console.log("SegmLen: " + videoSegments.length);
    });
}

function initVideos(_allScoreToVideoPairsSyncData) {
    'use strict';

    _allScoreToVideoPairsSyncData.forEach(function (pairSyncData) {
        var videoId = pairSyncData.uri1;

        $('<div>').attr('class', 'yt-videos').attr('id', videoId).appendTo($('#videos'));

        initVideo(videoId, videoId);
    });

    //optimizeYouTubeEmbeds();
}

function initVideo(_videoContainerID, _videoID) {
    'use strict';

    // Thease are to position the play button centrally.
    var pw=Math.ceil(CONSTANTS.VIDEO_WIDTH/2-38.5),
        ph=Math.ceil(CONSTANTS.VIDEO_HEIGHT/2+38.5);

    // The image+button overlay code.
    var code='<div style="width:'
        + CONSTANTS.VIDEO_WIDTH + 'px; height:' + CONSTANTS.VIDEO_HEIGHT
        + 'px; margin:0 auto"><a href="#"  onclick="loadVideo(\'' + _videoContainerID + '\', \'' + _videoID
        + '\');return false;" id="skipser-youtubevid-' + _videoID + '"><img src="http://i.ytimg.com/vi/'+ _videoID
        + '/hqdefault.jpg" style="width:' + CONSTANTS.VIDEO_WIDTH + 'px; height:'+ CONSTANTS.VIDEO_HEIGHT
        +'px;" /><div class="yt-thumbnail-playbutton" style="margin-left:'
        + pw + 'px; margin-top:-' + ph + 'px;"></div></a></div>';

    // Replace the iframe with a the image+button code.
    var div = document.createElement('div');
    div.innerHTML=code;
    div=div.firstChild;

    document.getElementById(_videoContainerID).appendChild(div);

    GLVARS.ytPlayerThumbnails[_videoID] = div;
}

function loadVideo(_videoContainerID, _videoID) {
    'use strict';

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
                    if (GLVARS.ytPlayers[videoID].getPlayerState() === YT.PlayerState.PLAYING || GLVARS.ytPlayers[videoID].getPlayerState() === YT.PlayerState.BUFFERING) {
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

//function addVideoTitle(_videoID) {
//    'use strict';
//
//
//    var url = "http://gdata.youtube.com/feeds/api/videos/" + _videoID + "?v=2&alt=json-in-script&callback=?"; // prettyprint=true
//    //console.log(url + "      ");
//    $.getJSON(url)
//        .done(function (jsonObj) {
//            //var vidID = jsonObj.entry['media$group']['yt$videoid']['$t']; // it is wrong use 'vid' hier
//            GLVARS.videoTitle[_videoID] = jsonObj.entry.title['$t'];
//            //console.log(_videoID + "       " + GLVARS.videoTitle[_videoID]);
//        })
//        .fail(function(jqxhr, textStatus, error) {
//            GLVARS.videoTitle[_videoID] = "Data not available";
//            //console.log("Fail: " + textStatus + ', ' + error);
//        });
//
//}

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
        //console.log("page: " + key);
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
        .append("svg:title")
        .text(function (d) {return GLVARS.videoTitle[d.videoID]});
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

function createRadioButtons(_svg, _radiobuttons) {
    'use strict';

    var i, plotDiv = document.getElementById("plotContainer"), selectVideoRB, topForRB, rbID;
    // if loop starts from 0 then rb will be added from bottom to top and this affects control from keyboard
    for (i = _radiobuttons.length - 1; i >= 0; i = i - 1) {

        selectVideoRB = document.createElement('input');

        rbID = _radiobuttons[i].videoID + "_" + _radiobuttons[i].segmentIndex + "_RB";
        selectVideoRB.setAttribute('id', rbID);
        //selectVideoRB.setAttribute('index', _radiobuttons[i].index);
        selectVideoRB.setAttribute('type', 'radio');
        selectVideoRB.setAttribute('name', 'selectVideoGroupRB');
        selectVideoRB.setAttribute('class', 'videoRB');
        selectVideoRB.setAttribute('onclick', 'rbClickHandler(this)');

        topForRB = GLVARS.y_scale(_radiobuttons[i].y) + GLVARS.plot_margin.top + GLVARS.plot_margin.bottom;
        selectVideoRB.style.top = topForRB + "px";

        plotDiv.appendChild(selectVideoRB);

        if (!GLVARS.rbIndex.hasOwnProperty((rbID))) {
            GLVARS.rbIndex[rbID] = i;
        }

//        d3.select("g").append("line")
//            .attr("class", "videoTopLine")
//            .attr("x1", GLVARS.x_scale(0))
//            .attr("y1", GLVARS.y_scale(_radiobuttons[i].y))
//            .attr("x2", GLVARS.x_scale(GLVARS.maxPlotX))
//            .attr("y2", GLVARS.y_scale(_radiobuttons[i].y))
//            .attr("stroke-width", 1)
//            .attr("stroke", "lightgrey")
//            .attr("pointer-events", "none");
    }

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

    // don't show the ticks of x-axis
    GLVARS.xAxis.tickFormat(function (d) { return ''; });

    //drawYAxis(svg_basis);

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

function rbClickHandler(d) {
    'use strict';

    var splt = d.id.split("_"), currentRBVideoID = "", currentRBSegmentIndex = splt[splt.length - 2], lastRBVideoID,
        lastRBSegmentIndex, videoID, videoIDToPlay, videoTime, pageTime, scoreTime = 0,
        playingVideoTime = 0, i, areNeighbours, foundSegmentID, rbIDToCheck, rbToCheckSegmentIndex;

    if (document.getElementById(d.id).checked) {
        document.getElementById(d.id).checked = false;
    }

    for (i = 0; i < splt.length - 2; i = i + 1) {
        currentRBVideoID = currentRBVideoID + splt[i] + "_";
    }
    currentRBVideoID = currentRBVideoID.substr(0, currentRBVideoID.length - 1);

    videoIDToPlay = currentRBVideoID;
    rbToCheckSegmentIndex = currentRBSegmentIndex;
    rbIDToCheck = d.id;

    //console.log("RBClickHandler " + d.id + "   videoID: " + rbVideoID + "     Index: " + rbSegmentIndex);

    for (videoID in GLVARS.ytPlayers) {
        if (GLVARS.ytPlayers.hasOwnProperty(videoID)) {
            if (GLVARS.ytPlayers[videoID].getPlayerState() === YT.PlayerState.PLAYING || GLVARS.ytPlayers[videoID].getPlayerState() === YT.PlayerState.BUFFERING) {
                playingVideoTime = GLVARS.ytPlayers[videoID].getCurrentTime();
                pageTime = getPageAndTimeForVideoTime(playingVideoTime, videoID);

                if (pageTime === undefined) {
                    scoreTime = 0;
                } else {
                    scoreTime = pageTime.pageTime;
                }

                lastRBVideoID = videoID;
                lastRBSegmentIndex = getSegmentIndexFromVideoTime(videoID, playingVideoTime);

                areNeighbours = areRBNeighbours(d.id, lastRBVideoID + "_" + lastRBSegmentIndex + "_RB");
                if (areNeighbours[0] && scoreTime > 0) {
                    foundSegmentID = getNextSegmentForScoreTime(lastRBSegmentIndex, areNeighbours[1], scoreTime);

                    if (foundSegmentID[0] !== "") {
                        videoIDToPlay = foundSegmentID[0];
                        rbToCheckSegmentIndex = foundSegmentID[1];
                        rbIDToCheck = foundSegmentID[0] + "_" + foundSegmentID[1] + "_RB";
//                        if (!document.getElementById(rbIDToCheck).checked) {
//                            document.getElementById(rbIDToCheck).checked = true;
//                        }
                    }

                    //console.log("\nfound: " + foundSegmentID + "\n");
                } else {
                    //console.log("\nare NOT neighbours\n");
                }

                //if (videoID !== videoIDToPlay) {
                    GLVARS.ytPlayers[videoID].pauseVideo();
                //}
            }
        }
    }

    videoTime = GLVARS.allVideoSegments[rbToCheckSegmentIndex].timeMap[1][0];
    if (scoreTime > 0) {
        if (GLVARS.allVideoSegments[rbToCheckSegmentIndex].x1 <= scoreTime && scoreTime <= GLVARS.allVideoSegments[rbToCheckSegmentIndex].x2) {
            videoTime = getSegmentVideoTimeForPagePosition(videoIDToPlay, rbToCheckSegmentIndex, scoreTime);
        }
    }

    if (GLVARS.ytPlayers.hasOwnProperty(videoIDToPlay)) {

        GLVARS.ytPlayers[videoIDToPlay].seekTo(Math.max(0, videoTime));
        GLVARS.ytPlayers[videoIDToPlay].playVideo();

    } else if (GLVARS.ytPlayerThumbnails.hasOwnProperty(videoIDToPlay)) {

        GLVARS.videoStartPosition[videoIDToPlay] = videoTime;
        loadVideo(videoIDToPlay, videoIDToPlay);
    }

    if (!document.getElementById(rbIDToCheck).checked) {
        document.getElementById(rbIDToCheck).checked = true;
    }
    document.getElementById(rbIDToCheck).focus();

    $("#videoTitle").text(GLVARS.videoTitle[videoIDToPlay]);
}

function areRBNeighbours(_firstRBID, _secondRBID) {
    'use strict';

    var firstAboveTheSecond, areNeighbours;

    if (GLVARS.rbIndex[_firstRBID] > GLVARS.rbIndex[_secondRBID]) {
        firstAboveTheSecond = true;
    } else {
        firstAboveTheSecond = false;

    }


    if (modulus(GLVARS.rbIndex[_firstRBID] - GLVARS.rbIndex[_secondRBID]) === 1) {
        areNeighbours = true;
    } else {
        areNeighbours = false;
    }

    return [areNeighbours, firstAboveTheSecond];

//    var firstRB, secondRB, currentRB, i, firstRBAboveTheSecond, rbAreNeighbours = true;
//
//    console.log("firstID:  " + _firstRBVideoID + "      firstIndex: " + _firstRBSegmentIndex);
//    console.log("secondID:  " + _secondRBVideoID + "      secondIndex: " + _secondRBSegmentIndex);
//    for (i = 0; i < GLVARS.radiobuttons.length; i = i + 1) {
//        currentRB = GLVARS.radiobuttons[i];
//        console.log(currentRB.videoID + "    " + currentRB.segmentIndex);
////        if (currentRB.videoID === _firstRBVideoID) {
////            console.log("yepVID");
////        }
////        if (currentRB.segmentIndex === _firstRBSegmentIndex) {
////            console.log("yepIndex");
////        }
//        if ((currentRB.videoID === _firstRBVideoID) && (currentRB.segmentIndex === _firstRBSegmentIndex)) {
//            console.log("firstVideoRB");
//            firstRB = currentRB;
//        }
//
//        if ((currentRB.videoID === _secondRBVideoID) && (currentRB.segmentIndex === _secondRBSegmentIndex)) {
//            console.log("secondVideoRB");
//            secondRB = currentRB;
//        }
//    }
//
//    if (firstRB.y > secondRB.y) {
//        firstRBAboveTheSecond = true;
//    } else {
//        firstRBAboveTheSecond = false;
//    }
//
//    for (i = 0; i < GLVARS.radiobuttons.length; i++) {
//        currentRB = GLVARS.radiobuttons[i];
//        if (firstRBAboveTheSecond) {
//            if ((firstRB.y > currentRB.y) && (currentRB.y > secondRB.y)) {
//                rbAreNeighbours = false;
//            }
//        } else {
//            if ((firstRB.y < currentRB.y) && (currentRB.y < secondRB.y)) {
//                rbAreNeighbours = false;
//            }
//        }
//    }
}

function getNextSegmentForScoreTime(segmIndex, searchOver, _scoreTime) {
    'use strict';

    var id, i, curSegm, foundSegmVideoID = "", foundSegmIndex;

    // in this case checking the y coordinate of segments is not necessary,
    // because segments in GLVARS.allVideoSegments are sorted according y coordinate

    if (searchOver) {
        for (i = segmIndex + 1; i < GLVARS.allVideoSegments.length; i = i + 1  ) {
            curSegm = GLVARS.allVideoSegments[i];
            if (curSegm.x1 <= _scoreTime && _scoreTime <= curSegm.x2) {
                foundSegmVideoID = curSegm.videoID;
                foundSegmIndex = i;
                i = GLVARS.allVideoSegments.length;
            }
        }
    } else {
        for (i = segmIndex - 1; i >= 0; i = i - 1  ) {
            curSegm = GLVARS.allVideoSegments[i];
            if (curSegm.x1 <= _scoreTime && _scoreTime <= curSegm.x2) {
                foundSegmVideoID = curSegm.videoID;
                foundSegmIndex = i;
                i = -1;
            }
        }
    }

    return [foundSegmVideoID, foundSegmIndex];
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

    if (GLVARS.videoIDNextToCursor !== "") {
        timeInScore = GLVARS.x_scale.invert(d3.mouse(this)[0]),
        timeInVideo = getVideoTimeFromScoreTime(timeInScore, GLVARS.segmentNextToCursor.timeMap); //GLVARS.videoTimeMaps[GLVARS.videoIDNextToCursor]
        if (GLVARS.ytPlayers.hasOwnProperty(GLVARS.videoIDNextToCursor)) {

            GLVARS.ytPlayers[GLVARS.videoIDNextToCursor].seekTo(Math.max(0, timeInVideo));
            GLVARS.ytPlayers[GLVARS.videoIDNextToCursor].playVideo();

        } else if (GLVARS.ytPlayerThumbnails.hasOwnProperty(GLVARS.videoIDNextToCursor)) {

            GLVARS.videoStartPosition[GLVARS.videoIDNextToCursor] = timeInVideo;
            loadVideo(GLVARS.videoIDNextToCursor, GLVARS.videoIDNextToCursor);
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

    var elementToEnlarge, secondElementToEnlarge, thirdElementToEnlarge, vID, someVideoPlaying = false;
    if (GLVARS.ytPlayers.hasOwnProperty(_videoID)) {
        elementToEnlarge = document.getElementById(_videoID);  //.firstChild.firstChild
        elementToEnlarge.width = _coefficient * CONSTANTS.VIDEO_WIDTH;
        elementToEnlarge.height = _coefficient * CONSTANTS.VIDEO_HEIGHT;
    }

    if (GLVARS.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
        elementToEnlarge = document.getElementById(_videoID).firstChild;
        elementToEnlarge.style.width = _coefficient * CONSTANTS.VIDEO_WIDTH + "px";
        elementToEnlarge.style.height = _coefficient * CONSTANTS.VIDEO_HEIGHT + "px";

        secondElementToEnlarge = document.getElementById(_videoID).firstChild.firstChild.firstChild;
        secondElementToEnlarge.style.width = _coefficient * CONSTANTS.VIDEO_WIDTH + "px";
        secondElementToEnlarge.style.height = _coefficient * CONSTANTS.VIDEO_HEIGHT + "px";

        thirdElementToEnlarge = document.getElementById(_videoID).firstChild.firstChild.lastChild;
        thirdElementToEnlarge.style.width = _coefficient * CONSTANTS.VIDEO_WIDTH + "px";
        thirdElementToEnlarge.style.height = _coefficient * CONSTANTS.VIDEO_HEIGHT + "px";
    }

    for (vID in GLVARS.ytPlayers) {
        if (GLVARS.ytPlayers.hasOwnProperty(vID)) {
            if (GLVARS.ytPlayers[vID].getPlayerState() === YT.PlayerState.PLAYING || GLVARS.ytPlayers[vID].getPlayerState() === YT.PlayerState.BUFFERING) {
                someVideoPlaying = true;
            }
        }
    }
    if (!someVideoPlaying) {
        $("#videoTitle").text(GLVARS.videoTitle[_videoID]);
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

    var elementToReset, secondElementToReset, thirdElementToReset;

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

        secondElementToReset = document.getElementById(_videoID).firstChild.firstChild.firstChild;
        secondElementToReset.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        secondElementToReset.style.height = CONSTANTS.VIDEO_HEIGHT + "px";

        thirdElementToReset = document.getElementById(_videoID).firstChild.firstChild.lastChild;
        thirdElementToReset.style.width = CONSTANTS.VIDEO_WIDTH + "px";
        thirdElementToReset.style.height = CONSTANTS.VIDEO_HEIGHT + "px";
    }
}

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

    //$("#segmQual").text(currentMouseX + "     " + d3.mouse(this)[1]);
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
    for (i = 0; i < _timeMap[0].length - 1; i = i + 1) {
        if ((_timeInScore >= _timeMap[0][i]) && (_timeInScore < _timeMap[0][i + 1])) {
            return _timeMap[1][i];
        }
    }
    //return _timeMap[1][indexOfLastSynchronizedTimePointInScore];

//    for (segm = 0; segm < _timeMap.length; segm = segm + 1) {
//        if ((_timeMap[segm][0][0] <= _timeInScore) && (_timeInScore <= _timeMap[segm][0][_timeMap[segm][0].length - 1])) {
//            for (i = 0; i < _timeMap[segm][0].length - 1; i = i + 1) {
//                if ((_timeMap[segm][0][i] <= _timeInScore) && (_timeInScore < _timeMap[segm][0][i + 1])) {
//                     return _timeMap[segm][1][i];
//                }
//            }
//        }
//    }
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
        var maxTime = 0, i, s, timeMap;
        for (i in GLVARS.videoTimeMaps) {
            if (GLVARS.videoTimeMaps.hasOwnProperty(i)) {
                timeMap = GLVARS.videoTimeMaps[i];
                for (s = 0; s < timeMap.length; s = s + 1) {
                    maxTime = Math.max(maxTime, Math.max.apply(null, timeMap[s][0]));
                }
            }
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

function getVideoTimeForPagePosition(videoID, pt) {
    'use strict';

    //console.log("getting time for page position " + page + " " + relPos);
    //var pt = GLVARS.pageTimes[page] + pageDuration(page) * relPos;
    var segmentScoreTime = getYtOffsetByScoreTime(videoID, pt),
        timeMap = GLVARS.videoTimeMaps[videoID];
    return timeMap[segmentScoreTime[0]][1][segmentScoreTime[1]];
}

function getSegmentVideoTimeForPagePosition(_videoID, _segmentIndex, _pt) {
    'use strict';

    var segmTimeMap = GLVARS.allVideoSegments[_segmentIndex].timeMap, i, videoTime = 0;

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
    for (i = 0; i < GLVARS.allVideoSegments.length; i = i + 1) {
        segm = GLVARS.allVideoSegments[i];
        if (segm.videoID === _videoID) {
            if ((segm.timeMap[1][0] <= _vtime) && (_vtime <= segm.timeMap[1][segm.timeMap[1].length - 1])) {
                return i;
            }
        }
    }
}

function updatePosition() {
    'use strict';

    //console.log("updatePosition: videoID: " + GLVARS.currentPlayingYTVideoID + "");
    var videoTime = GLVARS.ytPlayers[GLVARS.currentPlayingYTVideoID].getCurrentTime(),
        pageAndTime = getPageAndTimeForVideoTime(videoTime, GLVARS.currentPlayingYTVideoID),
        pageAndTimePlus = getPageAndTimeForVideoTime(videoTime + GLVARS.foreRunningTime, GLVARS.currentPlayingYTVideoID),
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

    if (pagePlus !== GLVARS.prevPage) {
        _pnq.push(['loadPage', pagePlus - 1]);
        GLVARS.prevPage = pagePlus;
    }

    updateVideoTrackLine(pageTime);

    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page - 1, true]);

    rbID = GLVARS.currentPlayingYTVideoID + "_" + getSegmentIndexFromVideoTime(GLVARS.currentPlayingYTVideoID, videoTime) + "_RB";
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
        timeMap = GLVARS.videoTimeMaps[_videoID],
        segmentScoreTime = getSegmentScoreTime(time, _videoID),
        segment, scoreTime,
        i;

    if (segmentScoreTime === undefined) {return undefined; }

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

function getSegmentScoreTime(ytTime, _videoID) {
    'use strict';

    var timeMap = GLVARS.videoTimeMaps[_videoID],
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

    var currentMouseXPoint = GLVARS.x_scale.invert(d3.mouse(this)[0]),
        currentMouseYPoint = GLVARS.y_scale.invert(d3.mouse(this)[1]),
        yAboveMousePoint = GLVARS.maxPlotY,
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

    if ($('#hideVideoDivs').prop('checked')) {
        showAndHideVideoDivs();
    }


    for (i = 0; i < GLVARS.allVideoSegments.length; i = i + 1) {
        currentSegment = GLVARS.allVideoSegments[i];
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
        GLVARS.videoIDNextToCursor = "";
        return;
    }
    //console.log("above: " + videoIDAbove + "  yAb: " + yAboveMousePoint + "        under: " + videoIDUnder + "  yUn: " + yUnderMousePoint);
    factor = 1;
    if (videoIDUnder === "") {
        //factor = currentMouseYPoint / yAboveMousePoint;
        videoToEnlarge = videoIDAbove;
        GLVARS.segmentNextToCursor = videoSegmentAbove;
    } else if (videoIDAbove === "") {
        //factor = 1 - (currentMouseYPoint - yUnderMousePoint) / (GLVARS.maxPlotY - yUnderMousePoint);
        videoToEnlarge = videoIDUnder;
        GLVARS.segmentNextToCursor = videoSegmentUnder;
    } else if (videoIDUnder === videoIDAbove) {
        factor = 1;
        videoToEnlarge = videoIDUnder;
        if ((yAboveMousePoint - currentMouseYPoint) >= (currentMouseYPoint - yUnderMousePoint)) {
            GLVARS.segmentNextToCursor = videoSegmentUnder;
        } else {
            GLVARS.segmentNextToCursor = videoSegmentAbove;
        }
    } else {
        if ((yAboveMousePoint - currentMouseYPoint) >= (currentMouseYPoint - yUnderMousePoint)) {
            // point under is the next to mouse point
            //factor = 1 - (currentMouseYPoint - yUnderMousePoint) / ((yAboveMousePoint - yUnderMousePoint) / 2);
            videoToEnlarge = videoIDUnder;
            GLVARS.segmentNextToCursor = videoSegmentUnder;
        } else {
            // point above is the next to mouse point
            //factor = (currentMouseYPoint - yUnderMousePoint) / ((yAboveMousePoint - yUnderMousePoint) / 2) - 1;
            videoToEnlarge = videoIDAbove;
            GLVARS.segmentNextToCursor = videoSegmentAbove;
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
    var elementToHide, secondElementToHide, thirdElementToHide;
    if (GLVARS.ytPlayers.hasOwnProperty(_videoID)) {
        elementToHide = document.getElementById(_videoID);
        elementToHide.width = 0;
        elementToHide.height = 0;
    }

    if (GLVARS.ytPlayerThumbnails.hasOwnProperty(_videoID)) {
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
    var faktor = 1, elementToShow, secondElementToShow, thirdElementToShow;
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

    var page = viewerPage - -1, oneVideoPlaying = false, videosToPlay = [], randomIndex;
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasure", measureNumber, page - 1]);

    console.log("clicked on page " + page + ", measure " + measureNumber + " of total " + totalMeasures + " measures");
    var scoreTime = GLVARS.pageTimes[page] + pageDuration(page) * (measureNumber - 1) / totalMeasures,
        videoID,
        videoTime;
    //console.log("hier");
    if ($('#hideVideoDivs').prop('checked')) {
        showSuitableVideoDivsForTimePoint(scoreTime);
    } else {
        calculateVisibilityOfVideoIDs(scoreTime);
    }
    //console.log("da");
    for (videoID in GLVARS.visibilityOfVideoIDs) {
        if (GLVARS.visibilityOfVideoIDs.hasOwnProperty(videoID)) {
            if (GLVARS.visibilityOfVideoIDs[videoID]) {
                videosToPlay.push(videoID);
            }
        }
    }

    randomIndex = getRandom(0, videosToPlay.length - 1);
    //console.log("length: " + videosToPlay.length + "      index: " + randomIndex);

    videoID = videosToPlay[randomIndex];
    videoTime = getVideoTimeForPagePosition(videoID, scoreTime);
    if (GLVARS.ytPlayers.hasOwnProperty(videoID)) {

        GLVARS.ytPlayers[videoID].seekTo(Math.max(0, videoTime));
        GLVARS.ytPlayers[videoID].playVideo();

    } else if (GLVARS.ytPlayerThumbnails.hasOwnProperty(videoID)) {

        GLVARS.videoStartPosition[videoID] = videoTime;
        loadVideo(videoID, videoID);
    }
}
