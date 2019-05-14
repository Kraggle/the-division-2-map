<?
$return = [];

if (isset($_POST['path'])) {
	
	$path = '../' . $_POST['path'];
	
	if (file_exists($path)) 
		$return['date'] = filemtime($path);
	else
		$return['error'] = "File does not exist!";
} else 
	$return['error'] = "No path!";
	
echo json_encode($return);
