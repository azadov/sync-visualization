Alignments = function() {
    this.alignments = {};
}

Alignments.prototype.add = function(scoreId, videoId, alignment) {
    this.alignments[this.hashPair(scoreId, videoId)] = alignment;
}

Alignments.prototype.get = function(scoreId, videoId) {
    return this.alignments[this.hashPair(scoreId, videoId)];
}

Alignments.prototype.hashPair = function(scoreId, videoId) {
    return scoreId + '_' + videoId;
}
