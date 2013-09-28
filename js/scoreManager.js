var SCORE_MANAGER = (function (me, PeachnoteViewer) {

    /**
     * hash of the form viewerId: viewerProperties
     */
    var viewers = {};

    /**
     * hash of the form scoreId: pageTimes
     */
    var pageTimes = {};

    me.init = function () {

        console.log("initializing score manager");
        this.loadScore(CONSTANTS.DEFAULT_SCORE_ID);

    };

    /**
     * loads the score
     *
     * @param  params should be a hash with keys equal to viewerIds of viewers to be used
     * and values the configuration of the corresponding viewers.
     *
     */
    me.loadScores = function (params) {
        for (var viewerId in params) {
            if (params.hasOwnProperty(viewerId)) {
                var props = params[viewerId];
                if (!viewers.hasOwnProperty(viewerId)) {
                    viewers[viewerId] = PeachnoteViewer.initializeViewer(props);
                } else {
                    viewers[viewerId].loadScore(props.loadScore, props.loadPage);
                }

                viewers[viewerId].setMeasureClickCallback(measureClickHandler);
            }
        }
    };

    me.loadScore = function (viewerId, params) {

        if (typeof params === 'undefined') {
            params = {
                'rootElement': 'PeachnoteViewerContainerId', 'widgetHeight': 620, 'widgetWidth': 460,
                'loadScore': viewerId
            };

            console.log("loading score in Viewer " + 0 + " with params " + JSON.stringify(params));
            this.loadScores({0: params});

            if (viewerId == CONSTANTS.DEFAULT_SCORE_ID) {
                this.loadScore(1, {
                    'rootElement': 'PeachnoteViewerContainerId2', 'widgetHeight': 620, 'widgetWidth': 460,
                    'loadScore': "IMSLP90564", 'loadPage': 5
                });
            } else {
                this.removeViewer(1);
            }

        } else {
            var p = {};
            p[viewerId] = params;

            console.log("loading score in Viewer " + viewerId + " with params " + JSON.stringify(params));
            this.loadScores(p);
        }

    };

    me.updateScorePosition = function (scoreId, scoreTime) {
        'use strict';

        console.log("update score position in viewers displaying " + scoreId);

        var page = getPage(scoreId, scoreTime),
            normalizedPageTime = SCORE_MANAGER.getNormalizedTime(scoreId, page, scoreTime);
        console.log("normalizedTime " + normalizedPageTime);

        for (var viewerId in viewers) {
            if (viewers.hasOwnProperty(viewerId)) {
                var viewer = viewers[viewerId];
                var sid = viewer.getLoadedScoreId();
                if (sid === scoreId) {
                    viewer.loadPage(page - 1);
                    viewer.clearMeasureHighlightings();
                    viewer.highlightMeasureAtNormalizedTime(normalizedPageTime, page - 1, true);
                }
            }
        }
    };

    /**
     * returns list of viewer objects
     */
    me.getViewers = function () {
        return viewers;
    };

    me.getViewer = function (viewerId) {
        return viewers[viewerId];
    };

    me.getViewersForScore = function(scoreId) {
        var out = [], viewerId, sid;
        for (viewerId in viewers) {
            if (viewers.hasOwnProperty(viewerId)) {
                sid = viewers[viewerId].getLoadedScoreId();
                if (scoreId === sid) out.push(viewers[viewerId]);
            }
        }
        return out;
    };

    me.getNormalizedTime = function(scoreId, page, pageTime) {
        return (pageTime - pageTimes[scoreId][page]) / pageDuration(scoreId, page);
    };

    me.setPageTimes = function(scoreId, pt) {
        pageTimes[scoreId] = pt;
    };

    me.getPageTimes = function(scoreId) {
        return pageTimes[scoreId];
    };

    me.removeViewer = function(viewerId) {
        if (!viewers.hasOwnProperty(viewerId)) return;
        viewers[viewerId].detach();
        delete viewers[viewerId];
    };

    /**
     * remove all viewers
     */
    me.clear = function () {

    };

    function measureClickHandler(event) {
        "use strict";

        var scoreId = event.scoreId,
            viewerPage = event.page,
            measureNumber = event.measureNumber,
            totalMeasures = event.totalMeasures;

        var page = viewerPage - -1;

        this.clearMeasureHighlightings();
        this.highlightMeasure(measureNumber, viewerPage);

        console.log("clicked on page " + page + " of " + scoreId
            + ", measure " + measureNumber + " of total " + totalMeasures + " measures");


        var scoreTime = pageTimes[scoreId][page] + pageDuration(scoreId, page) * (measureNumber - 1) / totalMeasures;

        if (scoreId === gui.getSelectedScoreId()) {
            // click on the central score
            CONTROLLER.onScoreTimeChanged(scoreId, scoreTime);
        } else {
            // click on an adjacent score
            var centralScoreId = gui.getSelectedScoreId();
            var centralScoreTime = getPageAndTimeForVideoTime(scoreTime, centralScoreId, scoreId).scoreTime;
            CONTROLLER.onScoreTimeChanged(centralScoreId, centralScoreTime, true);
            CONTROLLER.updatePosition(scoreId, scoreTime, 0);
        }

    }


    function getPage(scoreId, _scoreTime) {
        'use strict';
        var page = 0, pageTime = 0, i, pt = pageTimes[scoreId];
        //console.log("score time: " + _scoreTime);
        for (i in pt) {
            if (pt.hasOwnProperty(i)) {
                page = i;
                pageTime = pt[i];
                if (pageTime >= _scoreTime) {
                    console.log("page: " + (page - 1));
                    return page - 1;
                }
            }
        }
        //console.log("page: " + page);
        return page;
    }

    function pageDuration(scoreId, page) {
        'use strict';
        var pt = pageTimes[scoreId];
        if (pt[page + 1]) {
            return pt[page + 1] - pt[page];
        } else {
            var maxTime = CONTROLLER.getMaxScoreTime(scoreId);
            return maxTime - pt[page];
        }
    }



    return me;
}(SCORE_MANAGER || {}, PeachnoteViewer));