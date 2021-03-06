

function Video(id) {
    this.id = id;
    this.title = "";
    this.availability = undefined;
}

Video.prototype.resetVideoState = function() {
    this.loadingStatus = CONSTANTS.VIDEO_LOADING_STATUS_UNLOADED;
    this.numberOfLoadingAttempts = 0;
    this.displayStatus = CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY;
    this.player = undefined;
    //this.playerStatus = CONSTANTS.VIDEO_PLAYER_STATUS_NOTPLAYING;
    this.playerSizeStatus = CONSTANTS.VIDEO_PLAYER_SIZE_STATUS_NORMAL;
    this.thumbnailSizeStatus = CONSTANTS.VIDEO_PLAYER_SIZE_STATUS_NORMAL;
    this.playerTrackingInterval = 0;
    this.startPosition = 0;
}

Video.prototype.getId = function() {
    return this.id;
};

Video.prototype.getTitle = function() {
    return this.title;
};

Video.prototype.setTitle = function (title) {
    this.title = title;
};

Video.prototype.setAvailability = function(availability) {
    this.availability = availability;
};

Video.prototype.getAvailability = function() {
    return this.availability;
};

Video.prototype.setLoadingStatus = function(status) {
    this.loadingStatus = status;
};

Video.prototype.getLoadingStatus = function() {
    return this.loadingStatus;
};

Video.prototype.increaseNumOfLoadingAttempts = function() {
    this.numberOfLoadingAttempts = this.numberOfLoadingAttempts + 1;
};

Video.prototype.getNumOfLoadingAttempts = function() {
    return this.numberOfLoadingAttempts;
};

Video.prototype.setDisplayStatus = function(status) {
    this.displayStatus = status;
};

Video.prototype.getDisplayStatus = function() {
    return this.displayStatus;
};

Video.prototype.setPlayer = function(player) {
    this.player = player;
};

Video.prototype.getPlayer = function() {
    return this.player;
};


Video.prototype.setPlayerSizeStatus = function(status) {
    this.playerSizeStatus = status;
};

Video.prototype.getPlayerSizeStatus = function() {
    return this.playerSizeStatus;
};

Video.prototype.setThumbnailSizeStatus = function(status) {
    this.thumbnailSizeStatus = status;
};

Video.prototype.getThumbnailSizeStatus = function() {
    return this.thumbnailSizeStatus;
};

Video.prototype.setPlayerTrackingInterval = function(interval) {
    if (interval != this.playerTrackingInterval) {
        this.clearPlayerTrackingInterval();
    }
    console.log("set tracking interval " + interval + " for video " + this.id);
    this.playerTrackingInterval = interval;
};

Video.prototype.clearPlayerTrackingInterval = function() {
    console.log("cleared tracking interval " + this.playerTrackingInterval + " for video " + this.id);
    clearInterval(this.playerTrackingInterval);
};

Video.prototype.setStartPosition = function(pos) {
    this.startPosition = pos;
};

Video.prototype.getStartPosition = function() {
    return this.startPosition;
}