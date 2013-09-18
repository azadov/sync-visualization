var PeachnoteViewer = (function (me) {


    /**
     * The Viewer class that the users interact with upon its initialization.
     *
     * @param params
     * @param onLoaded
     * @constructor we initialize the Viewer instance and attach it to the DOM.
     */
    function Viewer(params, onLoaded) {

        var that = this;

        this.socket = {};

        /**
         * a stub that can later be modified by user.
         * @param scoreId
         */
        this.scoreLoadedCallback = function(scoreId) {};


        var iFrameUrl = 'http://www.peachnote.com/viewer-embedded.html?'
            + '&width=' + params.widgetWidth
            + '&height=' + params.widgetHeight
            + '&scoreId=' + params.loadScore;

        function initXDMConnection() {
            if (typeof easyXDM === 'undefined') {
                console.log('easyXDM not loaded yet, waiting');
                setTimeout(function () {
                    initXDMConnection();
                }, 250);
                return;
            }
            that.socket = new easyXDM.Socket({
                remote: iFrameUrl,
                container: document.getElementById(params.rootElement),
                props: {height: (params.widgetHeight + 2), width: (params.widgetWidth + 4), frameborder: 0},
                onMessage: function(message, origin) {
                    onViewerMessage(that, message, origin);
                },
                onReady: function () {
                    onLoaded(that);
                }
            });
        }

        initXDMConnection();
    }

    /**
     * a private function handling all events coming from the Viewer instance (onLoads, onClicks, etc.)
     * @param viewer
     * @param message
     * @param origin
     */
    function onViewerMessage(viewer, message, origin) {
        var m = JSON.parse(message);
        if (m.type == "scoreLoaded") {
            viewer.scoreLoadedCallback(m.scoreId);
        }
    }

    /**
     * an interface that the Viewer object provides to load scores
     * @param scoreId
     */
    Viewer.prototype.loadScore = function (scoreId) {
        this.socket.postMessage('["loadScore", "' + scoreId + '"]');
    };


    Viewer.prototype.setScoreLoadCallback = function(callback) {
         this.scoreLoadedCallback = callback;
    }


    me.initializeViewer = function (params, onLoaded) {

        if (!validateParams(params)) {
            throw new ViewerException("invalid parameters at Viewer initialization");
        }

        if (typeof easyXDM === 'undefined') loadEasyXDM();

        return new Viewer(params, onLoaded);
    };


    function ViewerException(message) {
        this.message = message;
        this.name = "PeachnoteViewerException";
    }

    /**
     * checking whether we have sufficient information to initialize a Viewer instance
     * @param params
     * @returns {boolean}
     */
    function validateParams(params) {
        if (!params.hasOwnProperty("rootElement") || !params.hasOwnProperty("widgetWidth") || !params.hasOwnProperty("widgetHeight")) return false;

        return true;
    }

    function loadEasyXDM() {
        var pnsv = document.createElement('script');
        pnsv.type = 'text/javascript';
        pnsv.async = true;
        pnsv.src = '//cdnjs.cloudflare.com/ajax/libs/easyXDM/2.4.17.1/easyXDM.min.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(pnsv);
    }

    return me;
}(PeachnoteViewer || {}));