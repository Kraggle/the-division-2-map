<?php

do {
	$myfile = fopen("../data/saving.json", "r") or die("Unable to open file!");
	$size = filesize("../data/saving.json");
	$fileRead = fread($myfile, $size);
	fclose($myfile);
	
	$saving = json_decode($fileRead, true);
	
} while($saving);

exit;