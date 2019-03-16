<span class="title">Language</span>
<?php

$json = file_get_contents("./data/languages.json");
$lngs = json_decode($json);
$lang = isset($_COOKIE['lang']) ? $_COOKIE['lang'] : "en";

foreach ($lngs as $lng) {
	
	if ($lang == $lng->code) {
		$credit = $lng;
	}
	
	if ($lng->got) {
		echo "<a class='language-button" . ($lang == $lng->code ? ' active' : '') . "' code='" . 
			$lng->code . "'><img class='' src='./images/flags/$lng->icon?v=0.01'><span class='dnt'>" . 
			($lng->actual != '' ? $lng->actual : $lng->language) . "</span></a>";
	}
}

?>

<span class="add-trans" title="You must be signed in to use this!">Add translation!</span>

<!-- <span class="message">The ability to add translations has been removed for now as for some reason the data keeps getting wiped and I can't figure out how or why. Sorry for any inconvenience.</span> -->

<? $seal = false; $tran = true; include "./includes/credits.php" ?>
