<?php
// encode and save to GeoJSON
$myfile = fopen("../data/local.json", "w") or die("Unable to open file!");
fwrite($myfile, $_POST['data']);
fclose($myfile);
?>