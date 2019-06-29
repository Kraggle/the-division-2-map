<?php
// session_start();
include_once 'session_start.php';
include_once 'db_connect.php';
include_once "functions.php";

ob_start('ob_gzhandler');

if (login_check($mysqli) && isset($_POST['data'])) {
	
	$usertype = $_SESSION['usertype'];
	$username = $_SESSION['username'];
	$file = "/geoJSON.json";
	
	if ($usertype <= 3) {
		$path = "../data/$username";
	} else {
		
		$savePath = "../data/saving.json";
		// Check to see if another user is saving and stall if they are
		do {
			$myfile = fopen($savePath, "r") or die("Unable to open file!");
			$size = filesize($savePath);
			$fileRead = fread($myfile, $size);
			fclose($myfile);
			
			$saving = json_decode($fileRead, true);
			
		} while($saving);
		
		// Let other users know we are saving and to wait
		$myfile = fopen($savePath, "w") or die("Unable to open file!");
		fwrite($myfile, json_encode(true));
		fclose($myfile);
		
		// save a backup of the GeoJSON with a timestamp
		$path = "../data";
		copy($path.$file, "../data/backup/geoJSON_(".date("d-m-Y_H.i.s", time()).").json");

		// get all of the old backup files and
		// delete the oldest if we have more than 25
		$files = glob('../data/backup/*.json');
		array_multisort(
			array_map('filemtime', $files),
			SORT_NUMERIC,
			SORT_DESC,
			$files
		);
		while (count($files) > 100) {
			unlink(array_pop($files));
		}
	}
	
	// Create the path if it does not exist
	if (!file_exists($path)) {
		mkdir($path, 0777, true);
	}
	
	$path = $path.$file;
	
	// Create the file if it does not exist
	if (!file_exists($path)) {
		$myfile = fopen($path, "w") or die("Unable to create file!");
		fclose($myfile);
	}
	
	// open and read GeoJSON file
	$myfile = fopen($path, "r") or die("Unable to open file!");
	$size = filesize($path);
	if ($size)
		$fileRead = fread($myfile, $size);
	else
		$fileRead = "{}";
	fclose($myfile);
	
	// decode the information from the site and file
	$fileJSON = json_decode($fileRead, true);
	$postJSON = json_decode($_POST['data'], true);
		
	// add/overwrite the new stuff
	foreach ($postJSON['features'] as $key => $value) {
		$fileJSON['features'][$key] = $value;
	}
	
	// Find any duplicates that may have snuck in and add them to the delete array
	$temp = [];
	foreach ($fileJSON['features'] as $key => $value) { 
		$type = array_key_exists('t', $value) ? $value['t'] : 'other';
		$latlngs = json_encode($value['g']['c']) . $type;
		if (!in_array($latlngs, $temp)) $temp[] = $latlngs; 
		else $postJSON['deleted'][] = $key;
	} 
	
	// remove the deleted stuff
	foreach ($postJSON['deleted'] as $id) {
		unset($fileJSON['features'][$id]);
	}

	$count = count($fileJSON['features']);
	
	if (($usertype == 1 && $count >= 500) || ($usertype == 2 && $count >= 2000)) {
		echo json_encode(['message' => 'Account limit reached!']);
		return;
	}
	
	// add the new settings
	foreach ($postJSON['settings'] as $key => $value) {
		if (!array_key_exists('settings', $fileJSON)) $fileJSON['settings'] = [];
		if (!array_key_exists($key, $fileJSON['settings'])) $fileJSON['settings'][$key] = [];
		$fileJSON['settings'][$key] = $value;
	}
	
	// Get the counts of used settings, and remove any that are not used
	$counts = [];
	foreach ($fileJSON['settings'] as $key => $value)
		$counts[$key] = 0;
	foreach ($fileJSON['features'] as $value)
		if (array_key_exists('t', $value)) $counts[$value['t']] += 1;
	foreach ($counts as $key => $value)
		if ($value == 0) unset($fileJSON['settings'][$key]);
	
	// encode and save to GeoJSON
	$myfile = fopen($path, "w") or die("Unable to open file!");
	fwrite($myfile, json_encode($fileJSON));
	fclose($myfile);
	
	if ($usertype > 3) {
		
		// Let other users save their work
		$myfile = fopen($savePath, "w") or die("Unable to open file!");
		fwrite($myfile, json_encode(false));
		fclose($myfile);
	}
}
