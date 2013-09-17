var VIDEO_MANAGER = (function(me) {

    /**
     * initialize video manager
     */
    me.init = function() {
        initYouTubeAPI();
    };

    /**
     *
     * @param videoId
     */
    me.addVideo = function(videoId) {};

    /**
     * returns list of video objects
     */
    me.getVideos = function() {};

    /**
     *
     * @param filterParams
     */
    me.filterVideos = function(filterParams) {};

    /**
     *
     * @param shouldPreloadPlayers
     */
    me.preloadPlayers = function(shouldPreloadPlayers) {};

    /**
     * remove all videos
     */
    me.clear = function() {};


    function initYouTubeAPI() {
        var tag = document.createElement('script'), firstScriptTag;
        tag.src = "https://www.youtube.com/iframe_api";
        firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    return me;
}(VIDEO_MANAGER || {}));