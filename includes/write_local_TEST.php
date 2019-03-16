<?php
// session_start();
include_once 'session_start.php';
include_once 'db_connect.php';
include_once "functions.php";

$del = '{}';
$data = '{"Draw a polyline":{"en":"Draw a polyline","en-user":"Kraggle"}}';
$read = '{"Draw a polyline":{"en-user":"Kiera"},"Draw a polygon":{"en":"Draw a polygon","en-user":"Kraggle"}}';

// decode the information from the site and file
$fileJSON = json_decode($read, true);
$postJSON = json_decode($data, true);
$delJSON = json_decode($del, true);

echo "<pre>";
var_dump($fileJSON);
echo "<br>";
var_dump($postJSON);

// add/overwrite the new stuff
foreach ($postJSON as $string => $local) {
	if (array_key_exists($string, $fileJSON)) {
		$fileJSON[$string] = array_merge($fileJSON[$string], $postJSON[$string]);
	} else {
		$fileJSON[$string] = $postJSON[$string];
	}
}

foreach ($delJSON as $key => $value) {
	foreach ($value as $local) {
		unset($fileJSON[$key][$local]);
	}
}

echo "<br>";
var_dump($fileJSON);

?>