<?php
// session_start();
include_once 'session_start.php';
include_once 'db_connect.php';
include_once "functions.php";

ob_start('ob_gzhandler');

if (isset($_POST['data'])) {
	
	$path = "../data";
	$file = "/local.json";
	$savePath = "../data/saving_local.json";
	
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
	
	// save a backup of the local with a timestamp
	copy($path.$file, "../data/backup_local/local_(".date("d-m-Y_H.i.s", time()).").json");

	// get all of the old backup files and
	// delete the oldest if we have more than 500
	$files = glob('../data/backup_local/*.json');
	array_multisort(
		array_map('filemtime', $files),
		SORT_NUMERIC,
		SORT_DESC,
		$files
	);
	while (count($files) > 500) {
		unlink(array_pop($files));
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
	
	// open and read local file
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
	$delJSON = json_decode($_POST['delete'], true);
	
	var_dump($postJSON);
	
	// add/overwrite the new stuff
	foreach ($postJSON as $string => $local) {
		if (array_key_exists($string, $fileJSON)) {
			$fileJSON[$string] = array_merge($fileJSON[$string], $postJSON[$string]);
		} else {
			$fileJSON[$string] = $postJSON[$string];
		}
	}
	
	// Remove the deleted translations
	foreach ($delJSON as $key => $value) {
		foreach ($value as $local) {
			unset($fileJSON[$key][$local]);
		}
	}
	
	// encode and save to local
	$myfile = fopen($path, "w") or die("Unable to open file!");
	fwrite($myfile, json_encode($fileJSON));
	fclose($myfile);
	
	// Let other users save their work
	$myfile = fopen($savePath, "w") or die("Unable to open file!");
	fwrite($myfile, json_encode(false));
	fclose($myfile);
}
?>