<? include_once 'session_start.php';
include_once 'db_connect.php';
include_once 'functions.php'; ?>

<div class="box-content grid <? echo type_name($_SESSION['usertype']) ?>">
	<span class="title span-row">User Account</span>

	<? if (login_check($mysqli) == true) { ?>

	<span class="sub title span-row">Hi<span class="dnt">
			<? echo htmlentities($_SESSION['username']) ?></span></span>

	<? if ($_SESSION['usertype'] != 5) { ?>

	<ul class="list span-row">
		<li>You now have access to the editing tools.</li>
		<li>You can make a limited amount of Paths, Polygons or Markers.</li>
		<li>These are saved to your own database.</li>
		<li>You can add, edit and delete any of these layers.</li>
		<li>Edit any layer by clicking on it.</li>
		<li>You can customize the layers as much as you like.</li>
		<li>To reposition or delete layers, you first need switch editable layers.</li>
		<li>You switch editable layers by their type, find the type in the edit panel by clicking the layer.</li>
		<li>The marker tools are a predefined set for the Survival Map.</li>
		<li>Just make sure you save afterwards.</li>
	</ul>

	<? if ($_SESSION['usertype'] == 2) { ?>

	<span class="span-row">As a donator...</span>
	<ul class="list span-row">
		<li>you can store more layers on the map.</li>
		<li>no longer have the donation notification.</li>
		<li>have the Donator title.</li>
	</ul>
	<span class="span-row">Thank you for your support.</span>

	<? } elseif ($_SESSION['usertype'] == 1) { ?>

	<span class="span-row">Become a donator to...</span>
	<ul class="list span-row">
		<li>store more layers on the map.</li>
		<li>no longer have the donation notification.</li>
		<li>have the Donator title.</li>
	</ul>

	<? } ?>

	<? } else { ?>

	<input class="input span-row" placeholder="Donators Email" type="text" name="donator" id="donator" /><br>
	<input id="donate" class="button donate ripple-me" type="button" value="Add" />

	<? } ?>

	<a id="logout" class="button textual sign-out ripple-me">Sign Out</a>
	<div class="level dnt">
		<? echo type_name($_SESSION['usertype']) ?>
	</div>

	<? } else { ?>

	<span class="title sub span-row">Sign In</span>

	<form id="login" name="login_form" class="span-row">
		<input class="input span-row" placeholder="Email Address" type="text" name="username" id="email" <?if (isset($email) && $email) {echo " value='$email'" ;}?>/>
		<input class="input span-row" placeholder="Password" type="password" name="password" id="password" />
		<label class="check ripple-me">
			<input type="checkbox" id="rem-check" class="checkbox" <? if (isset($_COOKIE['validator'])) {echo 'checked' ;} ?>>
			<span class="text">Remember Me</span>
			<div class="mark back"></div>
			<div class="mark tick"></div>
		</label>
		<input class="button ripple-me" type="button" value="Login" />
	</form>

	<a name="forgot" class="page button textual forgot ripple-me">Forgot Password</a>
	<a name="register" class="page button textual register right ripple-me">Create Account</a>

	<? } 

	echo '<p class="error span-row">';
		if (isset($_GET['error'])) echo $_GET['error'];
	echo '</p>';
	echo '<p class="success span-row">';
		if (isset($_GET['success'])) echo 'You registered successfully, you can now login!';
	echo '</p>';

	include "../docs/credits.html" ?>

</div>
