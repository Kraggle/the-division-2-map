<? include_once 'functions.php'; ?>
<div class="box-content grid">
	<span class="title span-row">Create Account</span>
	<ul class="help span-row">
		<li class="username">Usernames may contain only digits, upper and lowercase letters and underscores</li>
		<li class="email">Emails must have a valid email format</li>
		<li class="password">Passwords must contain
			<ul>
				<li class="password">At least 6 characters</li>
				<li class="password">At least one uppercase letter (A..Z)</li>
				<li class="password">At least one lowercase letter (a..z)</li>
				<li class="password">At least one number (0..9)</li>
			</ul>
		</li>
		<li class="confirmpwd">Your password and confirmation must match exactly</li>
	</ul>
	<form id="regform" name="registration_form" class="span-row">
		<input class="input span-row" placeholder="Username" type='text' name='username' id='username' />
		<input class="input span-row" placeholder="Email Address" type="text" name="email" id="email" />
		<input class="input span-row" placeholder="Password" type="password" name="password" id="password" />
		<input class="input span-row" placeholder="Confirm password" type="password" name="confirmpwd" id="confirmpwd" />
		<a name="login" class="page button textual sign-in ripple-me">Sign In</a>
		<input class="button ripple-me" type="button" value="Register" />
	</form>

	<?
	
	echo '<p class="error">';
		if (isset($_GET['error'])) echo $_GET['error'];
	echo '</p>';

	include "../docs/credits.html" ?>

</div>
