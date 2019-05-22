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
$newFile = "/geoJSON_NEW.json";
$path = "../data";

// Create the path if it does not exist
if (!file_exists($path)) {
	mkdir($path, 0777, true);
}

// Create the file if it does not exist
if (!file_exists($path.$newFile)) {
	$myfile = fopen($path.$newFile, "w") or die("Unable to create file!");
	fclose($myfile);
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
$newJSON = (object) [
	'features' => (object) [], 
	'settings' => (object) [],
];

$f = $newJSON->features;
$s = $newJSON->settings;

echo '<pre>';

// do whatever needs doing here
foreach ($fileJSON->features as $key => $value) {
	
	$options = $value->o;
	$geometry = $value->g;
	$popup = array_key_exists('p', $value) ? $value->p : false;
	$type = array_key_exists('type', $options) ? $options->type : false;
	
	$geometry->t = strtolower($geometry->type);
	unset($geometry->type);
	
	if ($geometry->t == 'rectangle') $options->shape = 'rectangle'; 
	unset($options->id);
	
	if (array_key_exists('icon', $options)) {
		$io = $options->icon->options;
		foreach ($io as $k => $v)
			if ($io->$k) $options->$k = $io->$k;
		unset($options->icon);
	}
	
	if ($popup && array_key_exists('options', $popup)) {
		$po = $popup->options;
		foreach ($po as $k => $v)
			if ($po->$k) $popup->$k = $po->$k;
		unset($popup->options);
	}
	
	if (!$type) {
		$f->$key = $value;
		$f->$key->c = $options->creator;
		unset($options->creator);
		continue;
	}
	
	$f->$key = (object) ['t' => $type, 'g' => $geometry, "c" => $options->creator];
	unset($options->creator);
	
	// add the options to the settings section if they don't exist
	if (!array_key_exists($type, $s)) $s->$type = (object) ['o' => $options];
	
	// check for a popup and if it matches the one in settings
	if ($popup) {
		if ($type != 'Complete') {
			
			if (!array_key_exists('p', $s->$type)) $s->$type->p = $popup;
			elseif ($s->$type->p != $popup) {
				$f->$key->p = (object) [];
				
				foreach ($popup as $k => $v) {
					if (!array_key_exists($k, $s->$type->p) || $s->$type->p->$k != $popup->$k) 
						$f->$key->p->$k = $v; 
				}
			}
		}
	}
}

// encode and save to GeoJSON
$myFile = fopen($path.$newFile, "w") or die("Unable to open file!");
fwrite($myFile, json_encode($newJSON));
fclose($myFile);
