function FiringCounter(limit, fire) {
    this.count = 0;
    this.limit = limit;
    this.fire = fire;
}

FiringCounter.prototype.increment = function() {
    this.count++;
    if (this.count >= this.limit) {
        this.fire();
    }
}
