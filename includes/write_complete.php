<?php
// session_start();
include_once 'session_start.php';
include_once "functions.php";

ob_start('ob_gzhandler');

if (login_check($mysqli) && isset($_POST['data'])) {
	
	$username = $_SESSION['username'];
	$file = "/complete.json";
	$path = "../data/$username";
	
	// Create the path if it does not exist
	if (!file_exists($path)) {
		mkdir($path, 0777, true);
	}
	
	$path = $path.$file;
	
	// Create the file if it does not exist
	if (!file_exists($path)) {
		$myFile = fopen($path, "w") or die("Unable to create file!");
		fclose($myFile);
	}
	
	// encode and save to GeoJSON
	$myfile = fopen($path, "w") or die("Unable to open file!");
	fwrite($myfile, $_POST['data']);
	fclose($myfile);
}
