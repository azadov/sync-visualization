function initScoreViewer() {
    var pnsv = document.createElement('script');
    pnsv.type = 'text/javascript';
    pnsv.async = true;
    pnsv.src = 'http://pchnote.appspot.com/scoreviewer/scoreviewer.nocache.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(pnsv);
}

function loadScoreInViewer(scoreId) {
    _pnq.push(['loadScore', scoreId]);
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

function getVideoWithLoadedAlignment(scoreId) {
    var videoId;
    for (videoId in G.syncPairs[scoreId]) {
        if (G.videos.hasOwnProperty(videoId) && G.videos[videoId].getAvailability()) {
            break;
        }
    }
    return videoId;
}

function getPageTimes(scoreId) {
    var videoId = getVideoWithLoadedAlignment(scoreId);
    // get videoId for which we should have downloaded the alignment data (if it was available we did that)
    return G.alignments.get(scoreId, videoId).streamTimes0;
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
        if (timeMap[s][0][0] > time) {
            continue;
        }
        for (i in timeMap[s][0]) {
            if (timeMap[s][0].hasOwnProperty(i)) {
                if (timeMap[s][0][i] >= time) {
                    return [s, i];
                }
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

function getPageAndTimeForVideoTime(time, _videoID) {
    'use strict';

    var page = 0, pageTime = 0,
        timeMap = G.videoTimeMaps[_videoID],
        segmentScoreTime = getSegmentScoreTime(time, _videoID),
        segment, scoreTime,
        i;

    if (segmentScoreTime === undefined) {
        return undefined;
    }

    segment = segmentScoreTime[0];
    scoreTime = timeMap[segment][0][segmentScoreTime[1]];
//console.log("\nVideoTime: " + time + "    Segment: " + segment + "   ScoreTime: " + scoreTime + "\n");
    if (time < timeMap[segment][1][0]) {
        return {"page": 0, "scoreTime": 0};
    }

    for (i in G.pageTimes) {
        if (G.pageTimes.hasOwnProperty(i)) {
            page = i;
            pageTime = G.pageTimes[i];
            if (pageTime >= scoreTime) {
                return {"page": (page - 1), "scoreTime": scoreTime};
            }
        }
    }
    return {"page": page, "scoreTime": scoreTime};
}

function getSegmentScoreTime(ytTime, _videoID) {
    'use strict';

    var timeMap = G.videoTimeMaps[_videoID],
        s, i, out;

    for (s = 0; s < timeMap.length; s = s + 1) {
        //if (timeMap[s][1][0] > ytTime) {continue; }
        //console.log("segm: " + s + "   1st: " + timeMap[s][1][0] + "   ytime: " + ytTime);
        if (timeMap[s][1][0] <= ytTime && ytTime < timeMap[s][1][timeMap[s][1].length - 1]) {
            out = [s, 0];
            for (i in timeMap[s][1]) {
                if (timeMap[s][1].hasOwnProperty(i)) {
                    //if (timeMap[s][1][i] >= ytTime) return [s, i];
                    if (timeMap[s][1][i] <= ytTime) {
                        out = [s, i];
                    }
                }
            }
            //console.log("time: " + ytTime + "      segm: " + out[0] + "    scoretime: " + out[1]);
            return out;
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

    calculateVisibilityOfVideoIDs(scoreTime);

    if (gui.shouldHideVideos()) {
        showAndHideVideos();
    }

    for (videoID in G.visibilityOfVideos) {
        if (G.visibilityOfVideos.hasOwnProperty(videoID)) {
            if (G.visibilityOfVideos[videoID]) {
                videosToPlay.push(videoID);
            }
        }
    }

    randomIndex = getRandom(0, videosToPlay.length - 1);
    console.log("length: " + videosToPlay.length + "      index: " + randomIndex);

    videoID = videosToPlay[randomIndex];
    videoTime = getVideoTimeForPagePosition(videoID, scoreTime);

    if (G.ytPlayerThumbnails.hasOwnProperty(videoID)) {

        G.videoStartPosition[videoID] = videoTime;
        loadVideo(videoID);
    } else if (G.ytPlayers.hasOwnProperty(videoID)) {

        G.ytPlayers[videoID].seekTo(Math.max(0, videoTime));
        G.ytPlayers[videoID].playVideo();

    }
}


function updateScorePosition(d) {
    'use strict';

    console.log("update score position");
    var pageAndTime = getPageAndTime(G.x_scale.invert(d3.mouse(this)[0])),
        page = pageAndTime.page,
        pageTime = pageAndTime.scoreTime,
        normalizedPageTime = getNormalizedTime(page, pageTime),
        timeInScore, timeInVideo;

    _pnq.push(['loadPage', page - 1]);
    _pnq.push(["clearMeasureHighlightings"]);
    _pnq.push(["highlightMeasureAtNormalizedTime", normalizedPageTime, page - 1, true]);

    if (G.videoIDNextToCursor !== "") {
        timeInScore = G.x_scale.invert(d3.mouse(this)[0]),
        timeInVideo = getVideoTimeFromScoreTime(timeInScore, G.segmentNextToCursor.timeMap); //G.videoTimeMaps[G.videoIDNextToCursor]
        if (G.ytPlayerThumbnails.hasOwnProperty(G.videoIDNextToCursor)) {

            G.videoStartPosition[G.videoIDNextToCursor] = timeInVideo;
            loadVideo(G.videoIDNextToCursor);
        } else if (G.ytPlayers.hasOwnProperty(G.videoIDNextToCursor)) {

            G.ytPlayers[G.videoIDNextToCursor].seekTo(Math.max(0, timeInVideo));
            G.ytPlayers[G.videoIDNextToCursor].playVideo();

        }
    }
}


// example of loading a viewer in an iframe as an anonymous function call. the fn can be made reusable of course.




var viewer = PeachnoteViewer.initializeViewer(
    {
        'rootElement': 'PeachnoteViewerContainer2'
        ,'widgetHeight': 590
        ,'widgetWidth': 450
        ,'loadScore': "IMSLP00001"  // optional
    },
    function (viewer) {
        console.log("viewer instance loaded");
        viewer.loadScore("IMSLP00001");   // possible
    }
);
viewer.setScoreLoadCallback(function(scoreId) {
    console.log(scoreId + " is loaded");
});
