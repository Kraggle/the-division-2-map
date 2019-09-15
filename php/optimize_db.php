<?
include_once 'session_start.php';
include_once 'db_connect.php';
include_once "functions.php";

ob_start('ob_gzhandler');

if (!login_check($mysqli)) exit;

$usertype = $_SESSION['usertype'];
$username = $_SESSION['username'];

if ($usertype != 5) exit; 
	
$file = "/geoJSON.json";
$path = "../data";

// Create the path if it does not exist
if (!file_exists($path)) {
	mkdir($path, 0777, true);
}

// open and read GeoJSON file
$myFile = fopen($path.$file, "r") or die("Unable to open file!");
$size = filesize($path.$file);
if ($size)
	$fileRead = fread($myFile, $size);
else
	$fileRead = "{}";
fclose($myFile);

// decode the information from the file
$fileJSON = json_decode($fileRead);

$f = $fileJSON->features;
$s = $fileJSON->settings;

echo "<pre>";

// do whatever needs doing here
foreach ($f as $key => $value) {
	
	$o = property_exists($value, 'o') ? $value->o : false;
	$p = property_exists($value, 'p') ? $value->p : false;
	$t = property_exists($value, 't') ? $value->t : false;
	
	if (!$t) continue;
	
	$set = property_exists($s, $t) ? $s->$t : false;
	
	if (!$set) continue;
	
	if ($o) {
		foreach ($o as $k => $v) {
			if (property_exists($set, $k) && $v === $set->o->$k) unset($o->$k);
		}
		
		if (empty($o)) unset($value->o);
	}
	
	if ($p) {
		foreach ($p as $k => $v) {
			if (property_exists($set, $k) && $v === $set->p->$k) unset($p->$k);
		}
		
		if (empty($p)) unset($value->p);
	}
}

// encode and save to GeoJSON
$myFile = fopen($path.$file, "w") or die("Unable to open file!");
fwrite($myFile, json_encode($fileJSON));
fclose($myFile);
