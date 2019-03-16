<?
$path = "data/sets.json";
$myfile = fopen($path, "r") or die("Unable to open file!");
$sets = json_decode(fread($myfile, filesize($path)), true);
fclose($myfile);
?>
<span class="title">Gear Set Collection Tracker</span>
<!-- <span title=""></span> -->
<div class="message"></div>
<div class="warning top"></div>
<?

$holster = $sets['icons']['holster'];
$gloves = $sets['icons']['gloves'];
$vest = $sets['icons']['vest'];
$mask = $sets['icons']['mask'];
$backpack = $sets['icons']['backpack'];
$knee_pads = $sets['icons']['knee_pads'];
	
foreach ($sets['sets'] as $piece) {
	
	$name = $piece['name'];
	$type = $piece['type'];
	$bonus1 = $piece['bonus1'];
	$bonus2name = (isset($piece['bonus2name']) ? $piece['bonus2name'] : "");
	$bonus2 = $piece['bonus2'];
	$bonus3name = (isset($piece['bonus3name']) ? $piece['bonus3name'] : "");
	$bonus3 = $piece['bonus3'];
	$bonus4name = (isset($piece['bonus4name']) ? $piece['bonus4name'] : "");
	$bonus4 = (isset($piece['bonus4']) ? $piece['bonus4'] : "");
	$bonus5name = (isset($piece['bonus5name']) ? $piece['bonus5name'] : "");
	$bonus5 = (isset($piece['bonus5']) ? $piece['bonus5'] : "");
	$svg = $piece['svg'];
	$id = $piece['id'];
	$classified = $piece['classified']; ?>
	
	
	<div id='<? echo $id ?>' class='set-piece <? echo $classified ? "classified" : "" ?> min'>
		<div class='name'>
			<div class='decor'>
				<div class='bg'></div>
				<? echo $svg ?>
				<span><? echo $name ?></span>
				<? if ($classified) { ?>
					<span class='class-title'>Classified</span>
				<? } ?>
				<br>
				<span><? echo $type ?></span>
				<div class='counter' name='<? echo $id ?>'></div>
			</div>
		</div>
		<div class="size min" title="Expand/Retract"></div>
		<div class='checks'>
			<div class='decor'>
				<div class='check'>
					<? echo $vest ?>
					<a class='img-check' name='<? echo $id ?>-vest'></a>
				</div>
				<div class='check'>
					<? echo $backpack ?>
					<a class='img-check' name='<? echo $id ?>-backpack'></a>
				</div>
				<div class='check'>
					<? echo $knee_pads ?>
					<a class='img-check' name='<? echo $id ?>-kneepads'></a>
				</div>
				<div class='check'>
					<? echo $holster ?>
					<a class='img-check' name='<? echo $id ?>-holster'></a>
				</div>
				<div class='check'>
					<? echo $gloves ?>
					<a class='img-check' name='<? echo $id ?>-gloves'></a>
				</div>
				<div class='check'>
					<? echo $mask ?>
					<a class='img-check' name='<? echo $id ?>-mask'></a>
				</div>
			</div>
		</div>
		<div class='bonus'>
			<div class='decor'>
				<div class='sub'>Set Bonus 2: </div>
				<div class='set-bonus 2'>
					<? echo $bonus1 ?>
				</div>
				<div class='line-break'></div>
				<div class='sub'>Set Bonus 3: </div>
				<div class='set-bonus 3'>
					<span class='sub-title'><? echo $bonus2name ?></span>
					<? echo ($bonus2name ? "<br>" : "") . $bonus2 ?>
				</div>
				<div class='line-break'></div>
				<div class='sub'>Set Bonus 4: </div>
				<div class='set-bonus 4'>
					<span class='sub-title'><? echo $bonus3name ?></span>
					<? echo ($bonus3name ? "<br>" : "") . $bonus3 ?>
				</div>
				
				<? if ($classified) { ?>
					<div class='line-break'></div>
					<div class='sub'>Set Bonus 5: </div>
					<div class='set-bonus 5'>
						<span class='sub-title'><? echo $bonus4name ?></span>
						<? echo ($bonus4name ? "<br>" : "") . $bonus4 ?>
					</div>
					<div class='line-break'></div>
					<div class='sub'>Set Bonus 6: </div>
					<div class='set-bonus 6'>
						<span class='sub-title'><? echo $bonus5name ?></span>
						<? echo ($bonus5name ? "<br>" : "") . $bonus5 ?>
					</div>
				<? } ?>
			</div>
		</div>
	</div>
	<div class='divider'></div>
	
<? } ?>

<div class="warning"></div>

<? $seal = false; include "./includes/credits.php" ?>