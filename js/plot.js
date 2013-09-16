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

    G.numberOfVideoSegmentLevels = G.numberOfVideoSegmentLevels + 1;

    _arrayOfSortedRects[0].y = G.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS);

    var i;
    for (i = 1; i < _arrayOfSortedRects.length; i = i + 1) {

        if (_arrayOfSortedRects[i - 1].x2 < _arrayOfSortedRects[i].x1) {
            _arrayOfSortedRects[i].y = _arrayOfSortedRects[i - 1].y;

        } else {
            G.numberOfVideoSegmentLevels = G.numberOfVideoSegmentLevels + 1;

            _arrayOfSortedRects[i].y = G.numberOfVideoSegmentLevels * (CONSTANTS.SEGMENT_RECT_HEIGHT + CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS);

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

    for (videoID in G.ytPlayers) {
        if (G.ytPlayers.hasOwnProperty(videoID)) {
            if (G.ytPlayers[videoID].getPlayerState() === YT.PlayerState.PLAYING || G.ytPlayers[videoID].getPlayerState() === YT.PlayerState.BUFFERING) {
                playingVideoTime = G.ytPlayers[videoID].getCurrentTime();
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

                if (videoID !== videoIDToPlay) {
                    G.ytPlayers[videoID].pauseVideo();
                }
            }
        }
    }

    videoTime = G.allVideoSegments[rbToCheckSegmentIndex].timeMap[1][0];
    if (scoreTime > 0) {
        if (G.allVideoSegments[rbToCheckSegmentIndex].x1 <= scoreTime && scoreTime <= G.allVideoSegments[rbToCheckSegmentIndex].x2) {
            videoTime = getSegmentVideoTimeForPagePosition(videoIDToPlay, rbToCheckSegmentIndex, scoreTime);
        }
    }

    if (G.ytPlayers.hasOwnProperty(videoIDToPlay)) {

        G.ytPlayers[videoIDToPlay].seekTo(Math.max(0, videoTime));
        G.ytPlayers[videoIDToPlay].playVideo();

    } else if (G.ytPlayerThumbnails.hasOwnProperty(videoIDToPlay)) {

        G.videoStartPosition[videoIDToPlay] = videoTime;
        loadVideo(videoIDToPlay, videoIDToPlay);
    }

    if (!document.getElementById(rbIDToCheck).checked) {
        document.getElementById(rbIDToCheck).checked = true;
    }
    document.getElementById(rbIDToCheck).focus();

    $("#videoTitle").text(G.videos[videoIDToPlay].getTitle());
}

function areRBNeighbours(_firstRBID, _secondRBID) {
    'use strict';

    var firstAboveTheSecond, areNeighbours;

    if (G.rbIndex[_firstRBID] > G.rbIndex[_secondRBID]) {
        firstAboveTheSecond = true;
    } else {
        firstAboveTheSecond = false;

    }


    if (Math.abs(G.rbIndex[_firstRBID] - G.rbIndex[_secondRBID]) === 1) {
        areNeighbours = true;
    } else {
        areNeighbours = false;
    }

    return [areNeighbours, firstAboveTheSecond];

//    var firstRB, secondRB, currentRB, i, firstRBAboveTheSecond, rbAreNeighbours = true;
//
//    console.log("firstID:  " + _firstRBVideoID + "      firstIndex: " + _firstRBSegmentIndex);
//    console.log("secondID:  " + _secondRBVideoID + "      secondIndex: " + _secondRBSegmentIndex);
//    for (i = 0; i < G.radiobuttons.length; i = i + 1) {
//        currentRB = G.radiobuttons[i];
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
//    for (i = 0; i < G.radiobuttons.length; i++) {
//        currentRB = G.radiobuttons[i];
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

/**
 * searches the next segment over (searchOver=true) or under the current segment (segmIndex) on the plot, that present
 * current score time point (_scoreTime)
 * @param segmIndex
 * @param searchOver
 * @param _scoreTime
 * @returns {Array}
 */
function getNextSegmentForScoreTime(segmIndex, searchOver, _scoreTime) {
    'use strict';

    var id, i, curSegm, foundSegmVideoID = "", foundSegmIndex;

    // in this case checking the y coordinate of segments is not necessary,
    // because segments in G.allVideoSegments are sorted according y coordinate

    if (searchOver) {
        for (i = segmIndex + 1; i < G.allVideoSegments.length; i = i + 1  ) {
            curSegm = G.allVideoSegments[i];
            if (curSegm.x1 <= _scoreTime && _scoreTime <= curSegm.x2) {
                foundSegmVideoID = curSegm.videoID;
                foundSegmIndex = i;
                i = G.allVideoSegments.length;
            }
        }
    } else {
        for (i = segmIndex - 1; i >= 0; i = i - 1  ) {
            curSegm = G.allVideoSegments[i];
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
            betterLabelShift = (0 - - key) > 9 ? G.labelShift : G.labelShift / 2;
            _svg.append("text")
                .attr("x", G.x_scale(_pageTimes[key]) - betterLabelShift)
                .attr("y", G.y_scale(0))
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr("fill", "grey")
                .text(key)
            ;
        }
    }
}

// svg:   the owning <svg> element
// id:    an id="..." attribute for the gradient
// stops: an array of objects with <stop> attributes
function createGradient(svg,id,stops){
    'use strict';

    var svgNS = svg.namespaceURI;
    var grad  = document.createElementNS(svgNS,'linearGradient');
    grad.setAttribute('id',id);
    for (var i=0;i<stops.length;i++){
        var attrs = stops[i];
        var stop = document.createElementNS(svgNS,'stop');
        for (var attr in attrs){
            if (attrs.hasOwnProperty(attr)) stop.setAttribute(attr,attrs[attr]);
        }
        grad.appendChild(stop);
    }

    var defs = svg.querySelector('defs') ||
        svg.insertBefore( document.createElementNS(svgNS,'defs'), svg.firstChild);
    return defs.appendChild(grad);
}

function getGradientValues(tickVelocities) {
    'use strict';

    var tpInd, currentVelInd, velocity, gradientValues = [], value, velArray = [], avgVel, j;
    console.log(tickVelocities);
    for (var tick in tickVelocities) {
        if (tickVelocities.hasOwnProperty(tick)) {
            var currentVel = tickVelocities[tick];
            value = (Math.atan(currentVel)/(Math.PI/2)) * 0.5;
            gradientValues.push(value);
        }
    }

    return gradientValues;
}

function createAlignmentSegmentRepresentation(_svg, _rects, scoreId) {
    'use strict';

    var color = d3.scale.category10(), gradientValues;

//    var testDensities = [
//        {id:1, vals:[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]},
//        {id:2, vals:[1, 2, 3]},
//        {id:3, vals:[0.9, 0.9, 0.1, 0.9]}
//    ];


    var segment = 0;
    for (var videoId in G.syncPairs[scoreId]) {
        if (videoIsFilteredOut(scoreId, videoId)) continue;
        for (var segment = 0; segment < G.alignments.get(scoreId, videoId).localTimeMaps.length; segment++) {
            var props = [];
            gradientValues = getGradientValues(G.velocities2[scoreId][videoId][segment]);
            for (var i = 0; i < gradientValues.length; i = i + 1) {
                props.push({
                    'offset': Math.round(100 * i / gradientValues.length) + "%",
                    //  'stop-color': color(Math.floor(10 * testDensities[j].vals[i])),
                    'stop-color': 'red',
                    'stop-opacity': gradientValues[i]
                });
            }
            createGradient(_svg[0][0].ownerSVGElement, 'gradient' + videoId + segment, props);
        }
    }

    _svg.selectAll(".bar")
        .data(_rects)
        .enter().append("rect")
        .attr("class", "rectangle")
        .attr("id", function (d) { return d.videoID + "Rect"; })
        .attr("x", function (d) { return G.x_scale(d.x1); })
        .attr("width", function (d) { return G.x_scale(d.width); })
        .attr("y", function (d) { return G.y_scale(d.y); })
        .attr("height", G.plot_height - G.y_scale(CONSTANTS.SEGMENT_RECT_HEIGHT))
        .style("fill", function(d, i) {return "url(#gradient" + d.videoID + d.segmentId + ")"})
        //.on("click", updateVideoPositionRect)
        .on("mouseover", enlargeVideoDivRect)
        //.on("mouseout", resetVideoDivRect)
        .append("svg:title")
        .text(function (d) {return G.videos[d.videoID].getTitle()});
    ;
}

function createCurves(_svg, _curves) {
    'use strict';

    // http://www.dashingd3js.com/svg-paths-and-d3js
    // var lineData = [ { "x": 61,  "y": 0.75}, { "x": 80,  "y": 0.75},
    //                  { "x": 55,  "y": 2.75}, { "x": 61,  "y": 2.75}];
    var lineFunction = d3.svg.line()
        .x(function (d) { return G.x_scale(d.x); })
        .y(function (d) { return G.y_scale(d.y); })
        .interpolate("basis");

    _svg.selectAll(".curve")
        .data(_curves)
        .enter().append("path")
        .attr("d", function (d) {return lineFunction(d.points); })
        .attr("id", function (d) { return d.videoID + "Curve"; })
        .attr("stroke", "blue")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", function (d) {return d.strokeDash; })
        //.attr("stroke-dasharray", "0,0")
        .attr("fill", "none")
        //.on("click", updateVideoPositionCurve)
        .on("mouseover", enlargeVideoDivCurve)
        //.on("mouseout", resetVideoDivCurve)
    ;
}

function createRadioButtons(_svg, _radiobuttons) {
    'use strict';

    var i, plotDiv = document.getElementById("plotContainer"), selectVideoRB, topForRB, rbID, h;
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

        //console.log("Height: " + $("#videoTitelFilter").height());
        //h = $("#videoTitelFilter").height() + 10;
        topForRB = G.y_scale(_radiobuttons[i].y) + G.plot_margin.top + G.plot_margin.bottom + 36;//35;
        selectVideoRB.style.top = topForRB + "px";

        plotDiv.appendChild(selectVideoRB);

        if (!G.rbIndex.hasOwnProperty((rbID))) {
            G.rbIndex[rbID] = i;
        }

//        d3.select("g").append("line")
//            .attr("class", "videoTopLine")
//            .attr("x1", G.x_scale(0))
//            .attr("y1", G.y_scale(_radiobuttons[i].y))
//            .attr("x2", G.x_scale(G.maxPlotX))
//            .attr("y2", G.y_scale(_radiobuttons[i].y))
//            .attr("stroke-width", 1)
//            .attr("stroke", "lightgrey")
//            .attr("pointer-events", "none");
    }

}

function drawYAxis(svg_basis) {
    'use strict';

    var yAxis = d3.svg.axis()
        .scale(G.y_scale)
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
            .attr("width", G.plot_width + G.plot_margin.left + G.plot_margin.right)
            .attr("height", G.plot_height + G.plot_margin.top + G.plot_margin.bottom)
            .append("g")
            .attr("transform", "translate(" + G.plot_margin.left + "," + G.plot_margin.top + ")")

            .on("click", updateScorePosition)
            .on("mousemove", updateMouseTrackLine)
            //.on("mousemove", showSuitableVideoDivsForCurrentMousePosition)
            //.on("mousemove", handleMouseMoveEvent)
            .on("mouseout", removeMouseTrackLine)
        ;

    svg_basis.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + G.plot_height + ")")
        .call(G.xAxis);

    // don't show the ticks of x-axis
    //G.xAxis.tickFormat(function (d) { return ''; });

    //drawYAxis(svg_basis);

    return svg_basis;
}


function updateVideoTrackLine(_scorePos) {
    'use strict';

    var svgContainer;
    if (G.videoTrackLineExist) {
        d3.select(".videoTrackLine").attr("x1", G.x_scale(_scorePos))
            .attr("y1", G.y_scale(0))
            .attr("x2", G.x_scale(_scorePos))
            .attr("y2", G.y_scale(G.maxPlotY));
    } else {
        svgContainer = d3.select("g");
        svgContainer.append("line")
            .attr("class", "videoTrackLine")
            .attr("pointer-events", "none")
            .attr("x1", G.x_scale(_scorePos))
            .attr("y1", G.y_scale(0))
            .attr("x2", G.x_scale(_scorePos))
            .attr("y2", G.y_scale(G.maxPlotY))
            .attr("stroke-width", 2)
            .attr("stroke", "lightblue");
        G.videoTrackLineExist = true;
    }
}

function updateMouseTrackLine(d) {
    'use strict';

    //var mouseTrackLine = document.getElementsByClassName("mouseTrackLine"); //d3.select(".mouseTrackLine");
    var currentMouseX = d3.mouse(this)[0], svgContainer;

    if (G.mouseTrackLineExist) {
        d3.select(".mouseTrackLine").attr("x1", currentMouseX)
            .attr("y1", G.y_scale(0))
            .attr("x2", currentMouseX)
            .attr("y2", G.y_scale(G.maxPlotY));
    } else {
        svgContainer = d3.select("g");
        svgContainer.append("line")
            .attr("class", "mouseTrackLine")
            .attr("x1", currentMouseX)
            .attr("y1", G.y_scale(0))
            .attr("x2", currentMouseX)
            .attr("y2", G.y_scale(G.maxPlotY))
            .attr("stroke-width", 2)
            .attr("stroke", "grey")
            .attr("pointer-events", "none");
        G.mouseTrackLineExist = true;
    }

    //$("#segmQual").text(currentMouseX + "     " + d3.mouse(this)[1]);
}

function removeMouseTrackLine(d) {
    'use strict';

    console.log("remove mouseTrackLine");
    d3.select(".mouseTrackLine").remove();
    G.mouseTrackLineExist = false;

    var id;
    if (!$('#hideVideoDivs').prop('checked')) {
        for (id in G.visibilityOfVideoIDs) {
            if (G.visibilityOfVideoIDs.hasOwnProperty(id)) {
                resetVideoDiv(id);
            }
        }
    }
}


function calculateAverageVelocity2(scoreId) {
    G.velocities2[scoreId] = {};

    var syncPairs = G.syncPairs[scoreId];
    for (var videoId in syncPairs) {
        G.velocities2[scoreId][videoId] = {};
        if (syncPairs.hasOwnProperty(videoId) && !videoIsFilteredOut(scoreId, videoId)) {
            console.log("computing velocity for " + videoId);
            var alignment = G.alignments.get(scoreId, videoId);
            for (var segment = 0; segment < alignment.localTimeMaps.length; segment = segment + 1) {

                var segmentTimeMap = alignment.localTimeMaps[segment];
                if (segmentTimeMap[0].length < 2) continue;
                var av = updateBinVelocities(segmentTimeMap);
                var binV = averageBinVelocities(av);
                G.velocities2[scoreId][videoId][segment] = binV;
            }
        }
    }
    return binV;
}

function updateBinVelocities(segmentTimeMap) {
    var av = [];
    var tScorePrev = segmentTimeMap[0][0];
    var tVideoPrev = segmentTimeMap[1][0];
    var prevBin =  Math.floor(tScorePrev / G.velocityWindow);

    for (var moment = 1; moment < segmentTimeMap[0].length; moment++) {
        var tScore = segmentTimeMap[0][moment];
        var tVideo = segmentTimeMap[1][moment];

        var currentBin = Math.floor(tScore / G.velocityWindow);

        var velocity;
        if (tVideo > tVideoPrev) {
            velocity = (tScore - tScorePrev)/(tVideo - tVideoPrev);
        } else {
            velocity = 1;
        }

        if (moment == 1) av.push([prevBin, velocity, tScore / G.velocityWindow - prevBin])
        for (var bin = prevBin; bin <= currentBin; bin++) {
            var binIntervalShare = Math.min(tScore / G.velocityWindow, bin + 1) - Math.max(tScorePrev / G.velocityWindow, bin);
            av.push([bin, velocity, binIntervalShare]);
        }
        if (moment == segmentTimeMap[0].length - 1) av.push([currentBin, velocity, currentBin + 1 - tScore / G.velocityWindow]);


        tScorePrev = tScore;
        tVideoPrev = tVideo;
        prevBin = currentBin;
    }
    return av;
}

function averageBinVelocities(av) {
    var binV = {};
    for (var i in av) {
        var t = av[i];
        var bin = t[0];
        var v = t[1];
        var s = t[2];
        binV[bin] = (binV[bin] ? binV[bin] : 0) + v*s;
    }
    return binV;
}


function calculateAverageVelocity() {
    'use strict';

    var i, j, velocity = 0, numerator = 0, denominator = 0, sectionLength;

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


function createVideoSegment(segmentTimeMap, videoID, segmentId, _conf) {
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
    newRectangle.segmentId = segmentId;
    newRectangle.timeMap = segmentTimeMap;

    return newRectangle;
}

function createCurve(currSegment, nextSegment, videoID) {
    'use strict';

    var firstPoint = {x: currSegment.x2, y: currSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT / 2},
        secondPoint = {x: currSegment.x2 + 10, y: currSegment.y - CONSTANTS.SEGMENT_RECT_HEIGHT  / 2},
        thirdPoint = {x: currSegment.x2 + 10,
            y: currSegment.y + Math.abs(currSegment.y - nextSegment.y) / 2 - CONSTANTS.SEGMENT_RECT_HEIGHT / 2},
        fourthPoint = {x: nextSegment.x1 - 10,
            y: currSegment.y + Math.abs(currSegment.y - nextSegment.y) / 2 - CONSTANTS.SEGMENT_RECT_HEIGHT / 2},
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


function drawPlot(scoreId) {
    'use strict';

    var svg = createPlotSVG();

    // add blank rectangle
    svg.append("rect")
        .attr("class", "blankrectangle")
        .attr("x", G.x_scale(0))
        .attr("width", G.x_scale(G.maxPlotX))
        .attr("y", G.y_scale(G.maxPlotY))
        .attr("height", G.plot_height - G.y_scale(G.maxPlotY))
        //.on("click", updateScorePosition)
        //.on("mousemove", updateMouseTrackLine)
        //.on("mouseout", removeMouseTrackLine)
        .on("mousemove", showSuitableVideoDivsForCurrentMousePosition)
    ;

    createPageTicks(svg, G.pageTimes);

    createAlignmentSegmentRepresentation(svg, G.allVideoSegments, scoreId);

    createCurves(svg, G.curves);

    createRadioButtons(svg, G.radiobuttons);
}

