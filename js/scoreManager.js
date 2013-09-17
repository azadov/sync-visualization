var SCORE_MANAGER = (function(me) {

    me.init = function() {
        initScoreViewer();
        configureScoreViewer();
    };

    /**
     * loads the score
     *
     * @param  params should be a hash with keys equal to scoreIds to be loaded
     * and values the configuration of the corresponding viewers.
     *
     */
    me.loadScores = function(params) {};

    /**
     * returns list of viewer objects
     */
    me.getViewers = function() {};

    /**
     * remove all viewers
     */
    me.clear = function() {};

    return me;
}(SCORE_MANAGER || {}));