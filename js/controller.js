var CONTROLLER = (function(params) {

    var me = params.controller,
        videoManager = params.videoManager,
        scoreManager = params.scoreManager,
        alignments = new Alignments()
    ;

    /**
     * initialize the application
     */
    me.init = function() {

        fixIEConsoleBug();

        videoManager.init();

        scoreManager.init();

        bindScoreFilterInputWithFilteringAction();

        initQualityFilterDropdown();

        loadAlignmentList(function onSuccess() {

            console.log("alignment list loaded");

            populateScoreSelectionDropdown();

            prepareVideosForScore(CONSTANTS.DEFAULT_SCORE_ID);

        }, function onFailure() {
            console.log("couldn't load alignment json file!");
        });

    };


    me.onScoreTimeChanged = function(scoreId, scoreTime) {

        var oneVideoPlaying = false, videosToPlay = [], randomIndex, videoId, videoTime;

        calculateVisibilityOfVideos(scoreTime);

        if (gui.shouldHideVideos()) {

            showAndHideVideos();
        }

        for (videoId in G.visibilityOfVideos) {
            if (G.visibilityOfVideos.hasOwnProperty(videoId)) {
                if (G.visibilityOfVideos[videoId] || true /* FIXME! */) {
                    videosToPlay.push(videoId);
                }
            }
        }

        randomIndex = getRandom(0, videosToPlay.length - 1);
        console.log("length: " + videosToPlay.length + "      index: " + randomIndex);

        videoId = videosToPlay[randomIndex];
        console.log(G.visibilityOfVideos);
        videoTime = getVideoTimeForPagePosition(scoreId, videoId, scoreTime);
        VIDEO_MANAGER.updateVideoPosition(videoId, videoTime);
    };


    me.onPlotClick = function(scoreTime) {
        var scoreId = gui.getSelectedScoreId();
        SCORE_MANAGER.updateScorePosition(scoreId, scoreTime);
        //console.log("onPlotClick segmentNextToCursor: " + G.segmentNextToCursor.videoID);
        if (typeof G.segmentNextToCursor.timeMap === 'undefined') {
            throw new ControllerException("no video segment available for this place in the score");
        }
        var videoTime = getVideoTimeFromScoreTime(scoreTime, G.segmentNextToCursor.timeMap);
        VIDEO_MANAGER.updateVideoPosition(G.videoIDNextToCursor, videoTime);
    };

    me.updatePosition = function(videoId) {
        'use strict';

        //console.log("updatePosition: videoID: " + G.currentPlayingYTVideoID + "");
        var videoTime = VIDEO_MANAGER.getVideo(videoId).getPlayer().getCurrentTime(),
            scoreId = gui.getSelectedScoreId(),
            pageAndTime = getPageAndTimeForVideoTime(videoTime, scoreId, videoId),
            pageAndTimePlus = getPageAndTimeForVideoTime(videoTime + CONSTANTS.FORE_RUNNING_TIME, scoreId, videoId),
            page, pagePlus,
            scoreTime,
            normalizedPageTime,
            rbID;

        //if (typeof pageAndTime == "undefined") return;
        if (pageAndTime === undefined) {
            return;
        }

        page = pageAndTime.page;
        scoreTime = pageAndTime.scoreTime;
        normalizedPageTime = SCORE_MANAGER.getNormalizedTime(scoreId, pageAndTime.page, pageAndTime.scoreTime);
        pagePlus = pageAndTimePlus ? pageAndTimePlus.page : pageAndTime.page;

        console.log("page: " + page + " scoreTime: " + scoreTime);
        console.log(pageAndTime);

        var viewers = SCORE_MANAGER.getViewersForScore(scoreId);
        for (var i = 0; i < viewers.length; i++) {
            var viewer = viewers[i];
            viewer.clearMeasureHighlightings();
            viewer.highlightMeasureAtNormalizedTime(normalizedPageTime, page - 1, true);
            viewer.loadPage(pagePlus - 1);
        }

        updateVideoTrackLine(scoreTime);

        rbID = videoId + "_" + getSegmentIndexFromVideoTime(videoId, videoTime) + "_RB";
        if (!document.getElementById(rbID).checked) {
            document.getElementById(rbID).checked = true;
            document.getElementById(rbID).focus();
        }
    };

    me.onMouseMove = function(currentMouseXPoint, currentMouseYPoint) {
        VIDEO_MANAGER.showSuitableVideoDivsForPlotPosition(currentMouseXPoint, currentMouseYPoint);
    }

    me.onRBClick = function(videoIDToPlay, videoTime) {
        VIDEO_MANAGER.updateVideoPosition(videoIDToPlay, videoTime);
    }

    me.onMouseOverVideoSegment = function(d) {
        VIDEO_MANAGER.onMouseOverVideoSegment(d);
    }

    me.onMouseOverCurve = function(d) {
        VIDEO_MANAGER.onMouseOverCurve(d);
    }

    me.onRemoveMouseTrackLine = function() {
        VIDEO_MANAGER.resetSizeOfAllVideos();
    }

    me.initializeVisualization = function(scoreId) {

        if (typeof YT === "undefined") {
            setTimeout(function () {
                me.initializeVisualization(scoreId);
            }, 250);
            console.log("waiting for YT API to load, retrying in 250ms");
            return;
        } else {
            console.log("YT API loaded");
        }

        console.log("interface for " + scoreId);

        clearVideoAndPlotState();
        gui.resetScoreDOM();

        calculateSegmentVelocity(scoreId);

        computePlotElements(scoreId, G.syncPairs[scoreId]);
        computePlotDimensions(scoreId);
        drawPlot(scoreId);

        VIDEO_MANAGER.initVideos(scoreId, G.syncPairs[scoreId]);
    };

    me.getAlignment = function(scoreId, videoId) {
        return alignments.get(scoreId, videoId);
    };

    me.getTimeMap = function(scoreId, videoId) {
        return this.getAlignment(scoreId, videoId).localTimeMaps;
    };

    me.getMaxScoreTime = function(scoreId) {
        var availableVideos = alignments.getAvailableVideos(scoreId),
            videoId, timeMap, s, maxTime = 0;
        for (videoId in availableVideos) {
            if (availableVideos.hasOwnProperty(videoId)) {
                if (typeof alignments.get(scoreId, videoId) === 'undefined') continue;
                timeMap = alignments.get(scoreId, videoId).localTimeMaps;
                for (s = 0; s < timeMap.length; s = s + 1) {
                    maxTime = Math.max(maxTime, Math.max.apply(null, timeMap[s][0]));
                }
            }
        }
        return maxTime;
    };

    function calculateSegmentVelocity(scoreId) {
        'use strict';

        G.velocities2[scoreId] = {};

        var syncPairs = G.syncPairs[scoreId], videoId, alignment, segment, segmentTimeMap, av, binV;

        for (videoId in syncPairs) {
            if (syncPairs.hasOwnProperty(videoId)) {
                G.velocities2[scoreId][videoId] = {};
                if (syncPairs.hasOwnProperty(videoId) && !videoIsFilteredOut(scoreId, videoId)) {
                    console.log("computing velocity for " + videoId);
                    alignment = alignments.get(scoreId, videoId);
                    for (segment = 0; segment < alignment.localTimeMaps.length; segment = segment + 1) {

                        segmentTimeMap = alignment.localTimeMaps[segment];
                        if (segmentTimeMap[0].length < 2) continue;
                        av = updateBinVelocities(segmentTimeMap);
                        binV = averageBinVelocities(av);
                        G.velocities2[scoreId][videoId][segment] = binV;
                    }
                }
            }
        }
        return binV;
    }


    function getVideoTimeFromScoreTime(scoreTime, timeMap) {
        'use strict';
        var i;
        for (i = 0; i < timeMap[0].length - 1; i = i + 1) {
            if ((scoreTime >= timeMap[0][i]) && (scoreTime < timeMap[0][i + 1])) {
                return timeMap[1][i];
            }
        }
    }

    function prepareVideosForScore(scoreId) {

        console.log("preparing videos for score " + scoreId);
        VIDEO_MANAGER.checkVideoAvailabilities(scoreId, function () {
            onVideoAvailabilityChecked(scoreId);
        });
    }

    function onVideoAvailabilityChecked(scoreId) {
        console.log("video availability checked for score " + scoreId);
        console.log(VIDEO_MANAGER.getVideos());
        getAlignments(scoreId, function () {
            onAlignmentsFetched(scoreId)();
        });
    }

    function onAlignmentsFetched(scoreId) {
        return function () {

            SCORE_MANAGER.setPageTimes(scoreId, computePageTimes(scoreId));

            CONTROLLER.initializeVisualization(scoreId);
        };
    }

    function computePageTimes(scoreId) {
        var videoId = getVideoWithLoadedAlignment(scoreId);
        // get videoId for which we should have downloaded the alignment data (if it was available we did that)
        console.log(alignments + scoreId);
        return alignments.get(scoreId, videoId).streamTimes0;
    }


    function bindScoreFilterInputWithFilteringAction() {

        gui.addScoreDropdownChangeCallback(function () {
            SCORE_MANAGER.loadScore(gui.getSelectedScoreId());
            prepareVideosForScore(gui.getSelectedScoreId())
        });

        gui.addAlignmentQualityChangeCallback(function () {
            me.initializeVisualization(gui.getSelectedScoreId());
        });

        gui.addVideoTitleChangeCallback(function () {
            me.initializeVisualization(gui.getSelectedScoreId());
        });
    }

    function populateScoreSelectionDropdown() {
        var scoreId;
        for (scoreId in G.syncPairs) {
            if (G.syncPairs.hasOwnProperty(scoreId)) {
                gui.addScoreToDropdown(scoreId);
            }
        }
    }

    function initQualityFilterDropdown() {
        var qualities = [0, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];
        gui.populateQualityFilter(qualities)
    }

    function getAlignments(scoreId, onAlignmentsFetched) {
        var syncedVideos = G.syncPairs[scoreId],
            counter = new FiringCounter(Object.keys(syncedVideos).length, onAlignmentsFetched),
            videoId, jsonPath;

        for (videoId in syncedVideos) {
            if (syncedVideos.hasOwnProperty(videoId)) {

                console.log(VIDEO_MANAGER.getVideo(videoId));

                if (!VIDEO_MANAGER.getVideo(videoId).getAvailability() ||
                    VIDEO_MANAGER.getVideo(videoId).getTitle().indexOf(gui.getVideoTitleFilterString()) == -1 ||
                    syncedVideos[videoId].quality < gui.getAlignmentQualityFilter() ||
                    alignments.get(scoreId, videoId)
                    ) {
                    counter.increment();
                    continue;
                }

                jsonPath = syncedVideos[videoId].alignmentFileName;
                fetchAlignmentData(scoreId, videoId, jsonPath, counter);
            }
        }
    }


    function fetchAlignmentData(scoreId, videoId, jsonPath, counter) {
        $.getJSON(jsonPath)
            .done(function (json) {
                alignments.add(scoreId, videoId, json);
                counter.increment();
            })
            .fail(function (jqxhr, textStatus, error) {
                counter.increment();
            });
    }

    function fixIEConsoleBug() {
        // needed for IE to have browser console.log
        if (!window.console) {
            window.console = {};
            window.console.log = function (msg) {};
        }
    }

    function ControllerException(message) {
        this.message = message;
        this.name = "PeachnoteControllerException";
    }

    return me;
}({controller: CONTROLLER || {},
    videoManager: VIDEO_MANAGER,
    scoreManager: SCORE_MANAGER}));