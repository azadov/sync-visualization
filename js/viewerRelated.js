
function getVideoWithLoadedAlignment(scoreId) {
    var videoId;
    for (videoId in G.syncPairs[scoreId]) {
        if (G.videos.hasOwnProperty(videoId) && G.videos[videoId].getAvailability()) {
            break;
        }
    }
    return videoId;
}



function getYtOffsetByScoreTime(videoID, time) {
    'use strict';

    var timeMap = CONTROLLER.getTimeMap(scoreId, videoID), s, i;
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
    console.log("get video time for score position " + scoreId + " " + videoId);
    //console.log("getting time for page position " + page + " " + relPos);
    //var pt = G.pageTimes[page] + pageDuration(page) * relPos;
    var segmentScoreTime = getYtOffsetByScoreTime(scoreId, videoId, pt),
        timeMap = CONTROLLER.getTimeMap(scoreId, videoId);
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

function getPageAndTimeForVideoTime(time, scoreId, videoId) {
    'use strict';

    var page = 0, pageTime = 0,
        timeMap = CONTROLLER.getTimeMap(scoreId, videoId),
        segmentScoreTime = getSegmentScoreTime(time, scoreId, videoId),
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

    var pageTimes = SCORE_MANAGER.getPageTimes(scoreId);
    for (i in pageTimes) {
        if (pageTimes.hasOwnProperty(i)) {
            page = i;
            pageTime = pageTimes[i];
            if (pageTime >= scoreTime) {
                return {"page": (page - 1), "scoreTime": scoreTime};
            }
        }
    }
    return {"page": page, "scoreTime": scoreTime};
}

function getSegmentScoreTime(ytTime, scoreId, _videoID) {
    'use strict';

    var timeMap = CONTROLLER.getTimeMap(scoreId, _videoID),
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

