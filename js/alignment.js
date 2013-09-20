Alignments = function() {
    this.alignments = {};
};

Alignments.prototype.add = function(scoreId, videoId, alignment) {
    this.alignments[this.hashPair(scoreId, videoId)] = alignment;
};

Alignments.prototype.get = function(scoreId, videoId) {
    return this.alignments[this.hashPair(scoreId, videoId)];
};

Alignments.prototype.hashPair = function(scoreId, videoId) {
    return scoreId + '_' + videoId;
};

Alignments.prototype.getPairFromHash = function(hash) {
    var i = hash.indexOf('_');
    return {scoreId: hash.substring(0, i), videoId: hash.substring(i + 1)};
};

Alignments.prototype.getAvailableVideos = function(scoreId) {
    var out = [];
    for (var i in this.alignments) {
        if (this.alignments.hasOwnProperty(i)) {
            var sid = this.getPairFromHash(i).scoreId;
            if (sid != scoreId) continue;

            var videoId = this.getPairFromHash(i).videoId;
            out.push(videoId);
        }
    }
    return out;
};
