<?
// session_start();
include_once '../includes/session_start.php';
include_once '../includes/db_connect.php';
include_once '../includes/functions.php';

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

	<link rel="stylesheet" href="../sass/div.map.css?v=<? echo filemtime('../sass/div.map.css') ?>" />
</head>

<body>

	<div id="mapid"></div>
	<div id="side-bar">
		<!-- <a href='#' class="side-menu-toggle mode one" button="mode">Switch to the Survival Map</a> -->
		<!-- <a href='#' class="side-menu-toggle mode two" button="mode">Switch to the Last Stand Map</a> -->
		<a href='#' class="side-menu-toggle filters" button="filters">Filters Menu</a>
		<a href='#' class="side-menu-toggle login" button="login">User Account</a>
		<div class="login">
			<div class="side-content">
				<? if (isset($_GET['token'], $_GET['forgot']) && token_check($mysqli, $_GET['token'])) {
					include '../includes/reset.php'; 
				} else {
					include '../includes/login.php'; 
				} ?>
			</div>
		</div>
		<div class="filters">
			<div class="side-content"></div>
		</div>
		<a href='#' class="side-menu-toggle full" button="full">Toggle Fullscreen</a>
		<a href='#' class="side-menu-toggle changes" button="changes">Recent Changes</a>
		<div class="changes">
			<div class="side-content">
				<? include '../docs/changes.php'; ?>
			</div>
		</div>
		<!-- <a href='#' class="side-menu-toggle todo" button="todo">Upcoming Changes</a>
		<div class="todo">
			<div class="side-content"><??> include 'docs/todo.php'; ?></div>
		</div> -->
		<!-- <a href='#' class="side-menu-toggle gear" button="gear">Gear Set Collection Tracker</a>
		<div class="gear">
			<div class="side-content">
				<?// include 'docs/gear.php'; ?>
			</div>
		</div> -->
		<!-- <a href='#' class="side-menu-toggle language" button="language">Language</a>
		<div class="language">
			<div class="side-content"><??> include 'docs/language.php'; ?></div>
		</div> -->
		<a href='#' class="side-menu-toggle shorts" button="shorts">Keyboard Shortcuts</a>
		<div class="shorts">
			<div class="side-content"></div>
		</div>
	</div>
	<div id="logo"></div>
	<div id="message"></div>

	<div id="survival-logo" title="">
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

	<!-- <div id="alert" style="display:none">
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

	<!-- <div id="screen-blank"></div> -->
	<!-- <div id="translate">
		<??> include 'docs/translate.php' ?>
	</div> -->

</body>

<script type="module" src="div.map.js?v=<? echo filemtime('div.map.js') ?>"></script>

</html>
