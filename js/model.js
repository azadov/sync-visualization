var CONSTANTS = {};
CONSTANTS.SEGMENT_RECT_HEIGHT = 0.2;
CONSTANTS.DISTANCE_BETWEEN_SEGMENT_RECTS = 0.3;
CONSTANTS.VIDEO_WIDTH = 140;
CONSTANTS.VIDEO_HEIGHT = 100;
CONSTANTS.PLAYING_VIDEO_WIDTH = 280;
CONSTANTS.PLAYING_VIDEO_HEIGHT = 225;

var G = {};

G.gui = new GUI();

G.numberOfVideoSegmentLevels = 1;
G.labelShift = 4;

G.plot_margin = {top: 20, right: 20, bottom: 30, left: 40};
G.plot_width = 600 - G.plot_margin.left - G.plot_margin.right;
G.plot_height = 320 - G.plot_margin.top - G.plot_margin.bottom;

/*global d3, $, document, window*/

G.x_scale = d3.scale.linear()
    .range([0, G.plot_width]);

G.y_scale = d3.scale.linear()
    .range([G.plot_height, 0]);

G.xAxis = d3.svg.axis()
    .scale(G.x_scale)
    .orient("bottom");

// don't show the ticks of x-axis
//G.xAxis.tickFormat(function (d) { return ''; });

G.maxPlotX = 0;
G.minPlotY = 0;
G.maxPlotY = 0;

G.syncPairs = {};          // list of file names of video syncs for a scoreId
G.pageTimes = [];

G.defaultScoreID = "IMSLP00001";
G.scoreSyncFileNames = [];

G.allVideoSegments = [];
G.curves = [];
G.radiobuttons = [];

G.rbIndex = {}; // maps radio button id to index (number from bottom to top)

G.visibilityOfVideos = {};        // maps videoId to the visibility of the corresponding video
G.videoTimeMaps = {};               // maps videoId to localTimeMaps
G.videoStatus = {};                 // maps videoId to status
G.videoStartPosition = {};          // maps videoId to start position
G.videoReadiness = {};              // maps videoId to 1 (if video loaded) or 0 (if video not loaded)
G.videoNumOfLoadingAttempts = {};   // maps videoId to number of loading attempts
G.videoLoadingInterval = {};        // maps videoId to interval

G.videoPreLoadingInterval = 0;  // interval

G.videos = {};
G.alignments = new Alignments();

G.ytPlayers = {};
G.ytPlayerThumbnails = {};
G.ytPreloadedPlayers = {};

G.mouseTrackLineExist = false;
G.videoTrackLineExist = false;

G.currentPlayingYTVideoID = "";
G.lastPlayedYTVideoID = "";
G.videoIDNextToCursor = "";
G.segmentNextToCursor = {};
G.loopId = 0;   // interval that works when video is playing
G.prevPage = 0;
G.foreRunningTime = 2.0;

G.velocityWindow = 5;  // in seconds
G.velocities = []; // array of arrays with velosities for time windows
G.velocities2 = {};
G.averageVelocity = []; // array with one average velocity for each time window