<?

$files = (object) [];

foreach (glob('../images/map/*.svg') as $name) {
	$short = pathinfo($name)['filename'];
	$files->$short = filemtime($name);
}

echo json_encode($files);
