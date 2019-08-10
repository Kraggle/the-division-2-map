<?php
if (isset($_POST['data'])) {
	
	$username = $_POST['data'];
	$path = "../data/$username/geoJSON.json";
	
	if (file_exists($path)) echo json_encode(true);
	else echo json_encode(false);
	
} else echo json_encode(false);
