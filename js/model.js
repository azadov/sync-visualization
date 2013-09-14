var CONSTANTS = {};
CONSTANTS.SEGMENT_RECT_HEIGHT = 0.1;
CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS = 0.3;
CONSTANTS.VIDEO_WIDTH = 140;
CONSTANTS.VIDEO_HEIGHT = 100;
CONSTANTS.PLAYING_VIDEO_WIDTH = 280;
CONSTANTS.PLAYING_VIDEO_HEIGHT = 225;

var GLVARS = {};
GLVARS.numberOfVideoSegmentLevels = 1;
GLVARS.labelShift = 4;

GLVARS.plot_margin = {top: 20, right: 20, bottom: 30, left: 40};
GLVARS.plot_width = 600 - GLVARS.plot_margin.left - GLVARS.plot_margin.right;
GLVARS.plot_height = 320 - GLVARS.plot_margin.top - GLVARS.plot_margin.bottom;

/*global d3, $, document, window*/

GLVARS.x_scale = d3.scale.linear()
    .range([0, GLVARS.plot_width]);

GLVARS.y_scale = d3.scale.linear()
    .range([GLVARS.plot_height, 0]);

GLVARS.xAxis = d3.svg.axis()
    .scale(GLVARS.x_scale)
    .orient("bottom");

// don't show the ticks of x-axis
//GLVARS.xAxis.tickFormat(function (d) { return ''; });

GLVARS.maxPlotX = 0;
GLVARS.minPlotY = 0;
GLVARS.maxPlotY = 0;

GLVARS.allScoreToSyncFileNames = {};          // list of file names of video syncs for a scoreId
GLVARS.sIDs = [];
GLVARS.pageTimes = [];


GLVARS.scoreSyncFileNames = [];

GLVARS.allVideoSegments = [];
GLVARS.curves = [];
GLVARS.radiobuttons = [];

GLVARS.rbIndex = {}; // maps radio button id to index (number from bottom to top)

GLVARS.visibilityOfVideoIDs = {};        // maps videoId to the visibility of the corresponding video
GLVARS.videoTimeMaps = {};               // maps videoId to localTimeMaps
GLVARS.videoStatus = {};                 // maps videoId to status
GLVARS.videoStartPosition = {};          // maps videoId to start position
GLVARS.videoTitle = {};                  // maps videoId to video title
GLVARS.videoReadiness = {};              // maps videoId to 1 (if video loaded) or 0 (if video not loaded)
GLVARS.videoNumOfLoadingAttempts = {};   // maps videoId to number of loading attempts
GLVARS.videoLoadingInterval = {};        // maps videoId to interval

GLVARS.ytPlayers = {};
GLVARS.ytPlayerThumbnails = {};

GLVARS.mouseTrackLineExist = false;
GLVARS.videoTrackLineExist = false;

GLVARS.currentPlayingYTVideoID = "";
GLVARS.lastPlayedYTVideoID = "";
GLVARS.videoIDNextToCursor = "";
GLVARS.segmentNextToCursor = {};
GLVARS.loopId = 0;
GLVARS.prevPage = 0;
GLVARS.foreRunningTime = 2.0;

GLVARS.velocityWindow = 1;
GLVARS.velocities = []; // array of arrays with velosities for time windows
GLVARS.averageVelocity = []; // array with one average velocity for each time window