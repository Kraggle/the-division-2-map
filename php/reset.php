<? include_once 'db_connect.php';
include_once 'functions.php'; ?>

<div class="side-content">
	<span class="title sub">Password Reset</span>

	<p>Please enter a new password.</p>

	<form id="reset" name="reset_form">
		<input class="input" placeholder="Password" type="password" name="password" id="password" />
		<input class="input" placeholder="Confirm password" type="password" name="confirmpwd" id="confirmpwd" /><br>
		<input class="button" type="button" value="Reset" />
	</form>

	<a name="login" class="page button">Sign In</a>

	<p class="error">
		<?if(isset($_GET['error'])){echo $_GET['error'];}?>
	</p>

	<? include "../docs/credits.html" ?>

</div>
