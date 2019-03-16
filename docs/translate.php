<?php

$json = file_get_contents("./data/languages.json");
$lngs = json_decode($json);
$json = file_get_contents("./data/local.json");
$local = json_decode($json);

include_once './includes/db_connect.php';

?>

<span class="title">Translation Form</span>
<select class="lang-select" name="language">
	<option value>Select Language</option>
	<? foreach ($lngs as $lng) { 
		if (!$lng->locked)
			echo "<option class='dnt' value='$lng->code'>$lng->language</option>";
	} ?>
</select>
<div class="bounds">
	<div class="list">
		<div class="content">
			<ul>
				<?
				foreach ($local as $key => $value) {
					echo "<li class='dnt local-button' local=\"$key\">$key</li>";
				}
				?>
			</ul>
		</div>
	</div>
	<div class="right-box">
		<div class="default">
			<span class="dnt sub-title">English</span>
			<span class="dnt english"></span>
		</div>
		<div class="other">
			<span class="dnt sub-title">Translation</span>
			<textarea name="translation"></textarea>
			<div class="contribute">Translation by: <span class="user dnt"></span></div>
			<ul>
				<li class="dnt">If an entry does not need a translation, just leave it blank.</li>
				<li class="dnt">As I cannot speak, read or write any other languages I can also not tell if there are mistakes or obscenities, so please, be respectful of others that may see it and inform me as I will remove anything added by your user name.</li>
				<li class="dnt">Remember, your account details are saving with this, so you will get credit, good or bad.</li>
				<li class="dnt">I'm so sorry to those of you that already started adding translations as all the data was wiped and there was not enough backups to account for this error. The backup quantity has been greatly increased and I'm hoping that it won't happen again with the new upadates.</li>
				<li class="dnt">If there are any other problems you can contact me on "Discord @ Kraggle#6111" or by "Email @ kraggle27@gmail.com"</li>
			</ul>
		</div>
	</div>
</div>
<span class="name">Saving as: <span class="dnt"></span></span>
<span class="close">Close</span>
<div id="email-check" class="check" title="Allow users to see your email address?">
	<a class="checked"></a>
	<span>Allow email?</span>
</div>
<div id="done-check" class="check" title="When checked this language is available in the menu.">
	<a></a>
	<span>Add to menu?</span>
</div>
<div class="display" title="Percentage of language completion.">
	<span class="number">0</span>
	<span class="percent">%</span>
</div>