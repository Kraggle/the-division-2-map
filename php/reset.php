<? include_once 'db_connect.php';
include_once 'functions.php'; ?>

<div class="box-content grid">
	<span class="title span-row">Password Reset</span>

	<p class="span-row">Please enter a new password.</p>

	<form id="reset" class="span-row" name="reset_form">
		<input id="token" type="text" value="<?echo $_POST['token']?>" style="display:none">
		<input class="input span-row" placeholder="Password" type="password" name="password" id="password" />
		<input class="input span-row" placeholder="Confirm password" type="password" name="confirmpwd" id="confirmpwd" />
		<a name="login" class="page button textual sign-in ripple-me">Sign In</a>
		<input class="button" type="button ripple-me" value="Reset" />
	</form>

	<?
	echo '<p class="error span-row">';
		if (isset($_GET['error'])) echo $_GET['error'];
	echo '</p>';

	include "../docs/credits.html" ?>

</div>
