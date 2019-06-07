<?
include_once 'session_start.php';
include_once 'db_connect.php';
include_once "functions.php";

ob_start('ob_gzhandler');

if (login_check($mysqli) && $_SESSION['usertype'] > 3 && isset($_POST['id'], $_POST['setting'], $_POST['type'])) {
	
	$id = $_POST['id'];
	$setting = $_POST['setting'];
	$type = $_POST['type'];
	
	$files = glob('../data/backup/*.json');
	array_multisort(
		array_map('filemtime', $files),
		SORT_NUMERIC,
		SORT_DESC,
		$files
	);
	
	$check = [];
	$return = (object) [];
	
	foreach ($files as $path) {
		
		$file = fopen($path, "r") or die("Unable to open file!");
		$size = filesize($path);
		$date = date("jS M g:ia", filemtime($path));
		if ($size)
			$fileRead = fread($file, $size);
		else
			$fileRead = "{}";
		fclose($file);
		
		// decode the information from the file
		$d = json_decode($fileRead);
		
		$f = property_exists($d, 'features') ? $d->features : false;
		$s = property_exists($d, 'settings') ? $d->settings : false;
		
		if (!$f) continue;
		
		// cancel looking if the id does not exist
		if (!property_exists($f, $_POST['id'])) break;
		
		$value = null;
		
		// see if the setting is in the layers options
		if (property_exists($f->$id, $type) && property_exists($f->$id->$type, $setting)) {
			$value = $f->$id->$type->$setting;
			
		} elseif ($s) { // else see if it in settings instead
			$t = property_exists($f->$id, 't') ? $f->$id->t : false;
			if ($t && property_exists($s, $t) && property_exists($s->$t, $type) && property_exists($s->$t->$type, $setting))
				$value = $s->$t->$type->$setting;
		}
		
		if ($value != null) {
			if (in_array($value, $check)) continue;
			$check[] = $value;
			$return->$date = $value;
		}
	}
	
	echo json_encode($return);
}
