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

        topForRB = GLVARS.y_scale(_radiobuttons[i].y) + GLVARS.plot_margin.top + GLVARS.plot_margin.bottom + 35;
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

function drawPlot() {
    'use strict';

    var svg = createPlotSVG();

        // add blank rectangle
    svg.append("rect")
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

    createPageTicks(svg, GLVARS.pageTimes);

    createRectangles(svg, GLVARS.allVideoSegments);

    createCurves(svg, GLVARS.curves);

    createRadioButtons(svg, GLVARS.radiobuttons);
}