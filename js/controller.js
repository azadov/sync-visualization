var CONTROLLER = (function(params) {

    var me = params.controller,
        videoManager = params.videoManager,
        scoreManager = params.scoreManager;

    /**
     * initialize the application
     */
    me.init = function() {

        fixIEConsoleBug();

        videoManager.init();
        scoreManager.init();


        bindScoreFilterInputWithFilteringAction();

        initQualityFilterDropdown();
    };

    function fixIEConsoleBug() {
        // needed for IE to have browser console.log
        if (!window.console) {
            window.console = {};
            window.console.log = function (msg) {};
        }
    }

    return me;
}({controller: CONTROLLER || {},
    videoManager: VIDEO_MANAGER,
    scoreManager: SCORE_MANAGER}));