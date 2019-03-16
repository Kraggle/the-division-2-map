<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="google-site-verification" content="qg4REvYBriuY96alybGvGy1ZICMr2bGymQFEd2UdwEg" />
	<link href="https://fonts.googleapis.com/css?family=Titillium+Web:300,400,600" rel="stylesheet">
	
	<title>The Divison Map</title>
	
	<script>
		function dragResize(edge){
			overwolf.windows.getCurrentWindow(function(result){
				if (result.status=="success"){
					overwolf.windows.dragResize(result.window.id, edge);
				}
			});
		};

		function dragMove(){
			overwolf.windows.getCurrentWindow(function(result){
				if (result.status=="success" && result.window.state !== "Maximized"){
					overwolf.windows.dragMove(result.window.id);
				}
			});
		};

		function closeWindow(){
			overwolf.windows.getCurrentWindow(function(result){
				if (result.status=="success"){
					overwolf.windows.close(result.window.id);
				}
			});
		};

		function minimize(){
			overwolf.windows.getCurrentWindow(function(result){
				if (result.status=="success"){
					overwolf.windows.minimize(result.window.id);
				}
			});
		};

		function toggleMaximize(){
			let element = document.querySelector('.maximize-restore-selector'),
					root = document.documentElement;

			overwolf.windows.getCurrentWindow(function(result){
				if (result.status !== "success") {
					return;
				}

				if (element.checked) {
					overwolf.windows.restore(result.window.id);
					root.classList.remove('maximized');
				} else {
					overwolf.windows.maximize(result.window.id);
					root.classList.add('maximized');
				}
			});
		};

		function showSupport() {
			window.location.href = "overwolf://settings/support";
		};

	</script>
		
	<link rel="stylesheet" href="sass/style.css" />
</head>
<body>
	
	<div class="content">
		<header onmousedown="dragMove();">
			<div class="window-controls-group">
				<button class="window-control" onclick="showSupport()">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#window-control_support" />
					</svg>
				</button>

				<!-- <button class="window-control">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#window-control_settings" />
					</svg>
				</button> -->

				<button class="window-control" onclick="minimize()">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#window-control_minimize" />
					</svg>
				</button>

				<button class="window-control" onclick="toggleMaximize()">
					<input type="checkbox" class="maximize-restore-selector toggle-icons" checked />
					<svg class="svg-icon-fill svg-icon-restore">
						<use xlink:href="assets/svg/sprite.svg#window-control_restore" />
					</svg>
					<svg class="svg-icon-fill svg-icon-maximize">
						<use xlink:href="assets/svg/sprite.svg#window-control_maximize" />
					</svg>
				</button>

				<button class="window-control window-control-close" onclick="closeWindow();">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#window-control_close" />
					</svg>
				</button>
			</div>
		</header>
		
		<div class="iframe">
			<iframe src="https://the-division-map.com?overwolf=true"></iframe>
		</div>
		
	</div>
	
	<div class="resize horizontal top" onmousedown="dragResize('Top');"></div>
	<div class="resize vertical left" onmousedown="dragResize('Left');"></div>
	<div class="resize vertical right" onmousedown="dragResize('Right');"></div>
	<div class="resize horizontal bottom" onmousedown="dragResize('Bottom');"></div>

	<div class="resize corner top-left" onmousedown="dragResize('TopLeft');"></div>
	<div class="resize corner top-right" onmousedown="dragResize('TopRight');"></div>
	<div class="resize corner bottom-left" onmousedown="dragResize('BottomLeft');"></div>
	<div class="resize corner bottom-right" onmousedown="dragResize('BottomRight');"></div>
</body>

<!-- <script src="div.map.js"></script> -->
	
</html>
