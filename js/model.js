var CONSTANTS = {};
CONSTANTS.SEGMENT_RECT_HEIGHT = 0.1;
CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS = 0.3;
CONSTANTS.VIDEO_WIDTH = 140;
CONSTANTS.VIDEO_HEIGHT = 90;

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

GLVARS.maxPlotX = 0;
GLVARS.minPlotY = 0;
GLVARS.maxPlotY = 0;

GLVARS.scoreToSyncFileNames = {};          // list of file names of video syncs for a scoreId
GLVARS.sIDs = [];
GLVARS.pageTimes = [];


GLVARS.scoreSyncFileNames = [];

GLVARS.allVideoSegments = [];
GLVARS.curves = [];

GLVARS.visibilityOfVideoIDs = {}; // maps videoId to the visibility of the corresponding video
GLVARS.videoTimeMaps = {};        // maps videoId to localTimeMaps
GLVARS.videoStatus = {};          // maps videoId to status
GLVARS.videoStartPosition = {};   // maps videoId to start position

GLVARS.ytPlayers = {};
GLVARS.ytPlayerThumbnails = {};

GLVARS.mouseTrackLineExist = false;
GLVARS.videoTrackLineExist = false;

GLVARS.currentPlayingYTVideoID = "";
GLVARS.videoIDNextToCursor = "";
GLVARS.loopId = 0;
GLVARS.prevPage = 0;
GLVARS.foreRunningTime = 2.0;