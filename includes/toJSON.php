<?php
// encode and save to GeoJSON

$myfile = fopen($_POST['path'], "w") or die("Unable to open file!");
fwrite($myfile, $_POST['json']);
fclose($myfile);
?>