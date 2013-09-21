

function Video(id) {
    this.id = id;
    this.title = "";
    this.availability = undefined;
    this.loadingStatus = CONSTANTS.VIDEO_LOADING_STATUS_UNLOADED;
    this.numberOfLoadingAttempts = 0;
    this.displayStatus = CONSTANTS.VIDEO_DISPLAY_STATUS_OUT_OF_DISPLAY;
    this.player = undefined;
    this.videoSizeStatus = CONSTANTS.VIDEO_SIZE_STATUS_NORMAL;
    this.thumbnailSizeStatus = CONSTANTS.VIDEO_SIZE_STATUS_NORMAL;
}

Video.prototype.getId = function() {
    return this.id;
}

Video.prototype.getTitle = function() {
    return this.title;
}

Video.prototype.setTitle = function (title) {
    this.title = title;
}

Video.prototype.setAvailability = function(availability) {
    this.availability = availability;
}

Video.prototype.getAvailability = function() {
    return this.availability;
}

Video.prototype.setLoadingStatus = function(status) {
    this.loadingStatus = status;
}

Video.prototype.getLoadingStatus = function() {
    return this.loadingStatus;
}

Video.prototype.increaseNumOfLoadingAttempts = function() {
    this.numberOfLoadingAttempts = this.numberOfLoadingAttempts + 1;
}

Video.prototype.getNumOfLoadingAttempts = function() {
    return this.numberOfLoadingAttempts;
}

Video.prototype.setDisplayStatus = function(status) {
    this.displayStatus = status;
}

Video.prototype.getDisplayStatus = function() {
    return this.displayStatus;
}

Video.prototype.setPlayer = function(player) {
    this.player = player;
}

Video.prototype.getPlayer = function() {
    return this.player;
}

Video.prototype.setVideoSizeStatus = function(status) {
    this.videoSizeStatus = status;
}

Video.prototype.getVideoSizeStatus = function() {
    return this.videoSizeStatus;
}

Video.prototype.setThumbnailSizeStatus = function(status) {
    this.thumbnailSizeStatus = status;
}

Video.prototype.getThumbnailSizeStatus = function() {
    return this.thumbnailSizeStatus;
}