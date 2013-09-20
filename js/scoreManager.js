var SCORE_MANAGER = (function (me, PeachnoteViewer) {

    var viewers = {};

    var pageTimes = {};

    me.init = function () {

        this.loadScore(G.DEFAULT_SCORE_ID);

    };

    /**
     * loads the score
     *
     * @param  params should be a hash with keys equal to scoreIds to be loaded
     * and values the configuration of the corresponding viewers.
     *
     */
    me.loadScores = function (params) {
        for (var scoreId in params) {
            if (params.hasOwnProperty(scoreId)) {
                var props = params[scoreId];
                viewers[scoreId] = PeachnoteViewer.initializeViewer(props);
                viewers[scoreId].setMeasureClickCallback(measureClickHandler);
            }
        }
    };

    me.loadScore = function (scoreId, params) {
        if (typeof params === 'undefined') {
            params = {
                'rootElement': 'PeachnoteViewerContainerId', 'widgetHeight': 620, 'widgetWidth': 460
            }
        }
        params.loadScore = scoreId;
        var p = {};
        p[scoreId] = params;
        this.loadScores(p);
    };

    me.updateScorePosition = function (scoreId, scoreTime) {
        'use strict';

        console.log("update score position");

        var page = getPage(scoreId, scoreTime),
            normalizedPageTime = SCORE_MANAGER.getNormalizedTime(scoreId, page, scoreTime);

        console.log("normalizedTime " + normalizedPageTime);

        var viewer = SCORE_MANAGER.getViewer(scoreId);
        viewer.loadPage(page - 1);
        viewer.clearMeasureHighlightings();
        viewer.highlightMeasureAtNormalizedTime(normalizedPageTime, page - 1, true);
    };

    /**
     * returns list of viewer objects
     */
    me.getViewers = function () {
        return viewers;
    };

    me.getViewer = function (scoreId) {
        return viewers[scoreId];
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

        console.log("clicked on page " + page + ", measure " + measureNumber + " of total " + totalMeasures + " measures");
        var scoreTime = pageTimes[page] + pageDuration(scoreId, page) * (measureNumber - 1) / totalMeasures;

        CONTROLLER.onScoreTimeChanged(scoreId, scoreTime);
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

    me.getNormalizedTime = function(scoreId, page, pageTime) {
        return (pageTime - pageTimes[scoreId][page]) / pageDuration(scoreId, page);
    };


    me.setPageTimes = function(scoreId, pt) {
        pageTimes[scoreId] = pt;
    };

    me.getPageTimes = function(scoreId) {
        return pageTimes[scoreId];
    };


    return me;
}(SCORE_MANAGER || {}, PeachnoteViewer));