

function Video(id) {
    this.id = id;
    this.title = "";
    this.availability = undefined;
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