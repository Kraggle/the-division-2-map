<?
// session_start();
include_once 'includes/session_start.php';
include_once 'includes/db_connect.php';
include_once 'includes/functions.php';

?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="google-site-verification" content="qg4REvYBriuY96alybGvGy1ZICMr2bGymQFEd2UdwEg" />
	<link rel="shortcut icon" type="image/x-icon" href="images/contaminated.ico" />

	<title>The Divison 2 Interactive Map</title>
	<meta name="description" content="Tom Clancy's The Division 2 Interactive Map. Shows entire map.">
	<meta name="keywords" content="the division 2 map, the division 2 interactive map, tom clancy the division 2, tom clancys the division 2, tom clancy's the division 2, the division 2 named bosses, the division 2 divtech, division 2 map, division 2 divtech, division 2 elites, the division 2 elites, division 2 locations, the division 2 locations, the division 2 vendors, the division 2 stores, the division 2 safehouses, the division 2 contaminated map, the division 2 contaminated zones, the division 2 dark zone, the division 2 dark zone map, the division 2 crates, the division 2 loot, the division 2 loot locations, the division 2 crate locations, the division 2 full map, last stand, division 2 last stand, division 2 enemy loacations">
	<meta property="og:title" content="The Division 2 Interactive Map">
	<meta property="og:type" content="website">
	<meta property="og:url" content="https://the-division-2-map.com/">
	<meta property="og:description" content="Tom Clancy's The Division 2 Interactive Map.">

	<link rel="stylesheet" href="css/leaflet1.5.1.css" />
	<link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
	<link rel="stylesheet" href="css/huebee.min.css" />
	<link rel="stylesheet" href="css/leaflet.draw.css" />
	<link rel="stylesheet" href="css/jquery.qtip.min.css" />
	<link rel="stylesheet" href="plugin/codemirror/lib/codemirror.css" />
	<link rel="stylesheet" href="plugin/codemirror/theme/onedarkpro.css" />

	<script src="https://code.jquery.com/jquery-3.4.1.js" integrity="sha256-WpOohJOqMqqyKL9FccASB9O0KwACQJpFTUBLTYOVvVU=" crossorigin="anonymous"></script>
	<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>

	<script src="js/K.js?v=<? echo filemtime('js/K.js') ?>"></script>
	<script src="js/jquery-kraggle.js?v=<? echo filemtime('js/jquery-kraggle.js') ?>"></script>

	<script src="js/Leaflet/leaflet-src1.0.3.js?v=1.0.3"></script>

	<script src="js/Utility/forms.js?v=1.0.3"></script>
	<script src="js/Utility/sha512.js?v=1.0.3"></script>
	<script src="js/Utility/js.cookie.js?v=1.0.3"></script>
	<script src="js/Utility/jquery.qtip.min.js?v=1.0.3"></script>
	<script src="js/Utility/huebee.pkgd.min.js?v=1.0.3"></script>
	<script src="js/Utility/tinysort.js?v=1.0.3"></script>
	<script src="js/Utility/jquery.selectric.js?v=1.0.3"></script>

	<script src="plugin/codemirror/lib/codemirror.js?v=1.0.3"></script>
	<script src="plugin/codemirror/mode/htmlmixed/htmlmixed.js?v=1.0.3"></script>
	<script src="plugin/codemirror/mode/javascript/javascript.js?v=1.0.3"></script>
	<script src="plugin/codemirror/mode/css/css.js?v=1.0.3"></script>
	<script src="plugin/codemirror/mode/xml/xml.js?v=1.0.3"></script>
	<script src="plugin/codemirror/addon/edit/closebrackets.js?v=1.0.3"></script>
	<script src="plugin/codemirror/addon/fold/xml-fold.js?v=1.0.3"></script>
	<script src="plugin/codemirror/addon/edit/closetag.js?v=1.0.3"></script>
	<script src="plugin/codemirror/addon/comment/comment.js?v=1.0.3"></script>

	<script src="js/Leaflet/Draw/Leaflet.draw.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/Leaflet.Draw.Event.js?v=1.0.3"></script>

	<script src="js/Leaflet/Draw/Toolbar.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/Tooltip.js?v=1.0.3"></script>

	<script src="js/Leaflet/Draw/ext/GeometryUtil.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/ext/LatLngUtil.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/ext/LineUtil.Intersect.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/ext/Polygon.Intersect.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/ext/Polyline.Intersect.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/ext/TouchEvents.js?v=1.0.3"></script>

	<script src="js/Leaflet/Draw/draw/DrawToolbar.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/draw/handler/Draw.Feature.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/draw/handler/Draw.SimpleShape.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/draw/handler/Draw.Marker.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/draw/handler/Draw.Polyline.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/draw/handler/Draw.Circle.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/draw/handler/Draw.Polygon.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/draw/handler/Draw.Rectangle.js?v=1.0.3"></script>

	<script src="js/Leaflet/Draw/edit/EditToolbar.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/edit/handler/EditToolbar.Edit.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/edit/handler/EditToolbar.Delete.js?v=1.0.3"></script>

	<script src="js/Leaflet/Draw/Control.Draw.js?v=1.0.3"></script>

	<script src="js/Leaflet/Draw/edit/handler/Edit.Poly.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/edit/handler/Edit.SimpleShape.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/edit/handler/Edit.Circle.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/edit/handler/Edit.Rectangle.js?v=1.0.3"></script>
	<script src="js/Leaflet/Draw/edit/handler/Edit.Marker.js?v=1.0.3"></script>

	<script src="js/Leaflet/Path.Drag/Path.Drag.js?v=1.0.3"></script>
	<script src="js/Leaflet/Path.Drag/Canvas.js?v=1.0.3"></script>
	<script src="js/Leaflet/Path.Drag/Path.Transform.js?v=1.0.3"></script>
	<script src="js/Leaflet/Path.Drag/SVG.js?v=1.0.3"></script>
	<script src="js/Leaflet/Path.Drag/SVG.VML.js?v=1.0.3"></script>

	<!-- <script src="js/Leaflet/Decorator/L.PolylineDecorator.js?v=1.0.4"></script>
	<script src="js/Leaflet/Decorator/L.Symbol.js?v=1.0.4"></script>
	<script src="js/Leaflet/Decorator/patternUtils.js?v=1.0.5"></script> -->

	<script src="js/Leaflet/Bounds/Leaflet.Bounds.Aware.LayerGroup.js?v=1.0.3"></script>
	<!-- <script src="js/Leaflet/Leaflet.Snap/leaflet.snap.js?v=1.0.3"></script>
	<script src="js/Leaflet/Leaflet.Snap/leaflet.geometryutil.js?v=1.0.3"></script> -->

	<link rel="stylesheet" href="sass/div.map.css?v=<? echo filemtime('sass/div.map.css') ?>" />
</head>

<body>

	<div id="mapid"></div>
	<div id="side-bar" class="side-menu">
		<div class="map-mode-box">
			<div class="map-mode"><img src="" class="img" /><span class="desc"></span></div>
		</div>

		<a href='#' class="side-menu-toggle login" button="login">User Account</a>
		<a href='#' class="side-menu-toggle filters" button="filters">Filters</a>
		<a href='#' class="side-menu-toggle search" button="search">Search</a>
		<a href='#' class="side-menu-toggle full" button="full">Toggle Full Screen</a>
		<a href='#' class="side-menu-toggle changes" button="changes">Recent Changes</a>
		<!-- <a href='#' class="side-menu-toggle gear" button="gear">Gear Set Collection Tracker</a> -->
		<a href='#' class="side-menu-toggle shorts" button="shorts">Keyboard Shortcuts</a>

		<div class="side-menu-box login">
			<div class="side-content">
				<? if (isset($_GET['token'], $_GET['forgot']) && token_check($mysqli, $_GET['token'])) {
					include 'includes/reset.php'; 
				} else {
					include 'includes/login.php'; 
				} ?>
			</div>
		</div>

		<div class="side-menu-box filters">
			<div class="side-content"></div>
		</div>

		<div class="side-menu-box search">
			<? include 'search.html'; ?>
		</div>

		<div class="side-menu-box changes">
			<div class="side-content">
				<? include 'docs/changes.php'; ?>
			</div>
		</div>

		<!-- <div class="side-menu-box gear">
			<div class="side-content">
				<?// include 'docs/gear.php'; ?>
			</div>
		</div> -->

		<div class="side-menu-box shorts">
			<div class="side-content"></div>
		</div>
	</div>

	<div id="logo" class="logo-panel"></div>
	<div id="message" class="message-panel"></div>

	<div id="survival-logo" title="" class="survival-logo">
		<img class="logo" src="images/survival-logo.svg">
		<img class="in-back" src="images/survival-logo-in-ring-back.svg">
		<img class="in" src="images/survival-logo-in-ring.svg">
		<img class="out-back" src="images/survival-logo-out-back.svg">
		<img class="out" src="images/survival-logo-out-ring.svg">
		<img class="dot-back" src="images/survival-logo-dots-back.svg">
		<img class="dot" src="images/survival-logo-dots.svg">
	</div>

	<a href="/survival" title="Survival Map" style="position:absolute; left:10000px;">Survival Map</a>
	<a href="/normal" title="Normal Map" style="position:absolute; left:10000px;">Normal Map</a>
	<a href="/tracker" title="Gear Set Collection Tracker" style="position:absolute; left:10000px;">Gear Set Collection
		Tracker</a>

	<!-- <div id="alert" style="display:none" class="alert-panel">
		<a class="alert-close" onclick="hideAlert()">Close</a>
		<p>If you would hate to see this awesome site go as much as I would, and would like to contribute both to keep
			it going and any future additions, including a Division 2 Map, then please click the button bellow to
			donate, any help would be greatly appreciated.</p>

		<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
			<input type="hidden" name="cmd" value="_s-xclick">
			<input type="hidden" name="hosted_button_id" value="EFY8UR4NG6622">
			<input type="image" class="paypalBtn" src="https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif" border="0" name="submit" alt="PayPal – The safer, easier way to pay online!">
			<img alt="" border="0" src="https://www.paypalobjects.com/en_GB/i/scr/pixel.gif" width="1" height="1">
		</form>

		<p>...and a big thanks those that have donated already! Really, it's you that has made it possible to keep this
			awesomeness!</p>

		<p>My deepest apologies for the site being down for the last week or so. It was through no fault of the servers
			host which these donations pay for, but the domain handler. Their nameservers got automatically reset and
			would not allow changes, there was also no help from their customer services. It's only back up again as I
			transfered the domain to the same vendor as the servers host. This is what took a week.</p>
		<p>Thank you for your patience and thank you GoDaddy!</p>
	</div> -->

	<input type="text" id="copy-input">
</body>

<script src="div.map.js?v=<? echo filemtime('div.map.js') ?>"></script>

</html>
