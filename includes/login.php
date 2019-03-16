<?
include_once 'db_connect.php';
include_once 'functions.php';
?>

<span class="title">User Account</span>

<? if (login_check($mysqli) == true) { ?>

	<span class="sub title">Hi<span class="dnt"> <? echo htmlentities($_SESSION['username']) ?></span></span>
	
	<? if ($_SESSION['usertype'] != 5) { ?>    

		<ul>
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
		
			<span>As a donator...
			<ul>
				<li>you can store more layers on the map.</li>
				<li>no longer have the donation notification.</li>
				<li>have the Donator title.</li>
			</ul>
			<span>Thank you for your support.</span>
		
		<? } else if ($_SESSION['usertype'] == 1) { ?>
		
			<span>Become a donator to...</span>
			<ul>
				<li>store more layers on the map.</li>
				<li>no longer have the donation notification.</li>
				<li>have the Donator title.</li>
			</ul>
			<!-- <a class="donate" href="https://www.paypal.me/kraggle" target="_blank">Donate here!</a>  -->
			<!-- <span>Be sure to give your account email if it is different from your paypal email.</span> -->
			
		<? } ?>
		
	<? } else { ?>
	
		<!-- <form id="donate" name="donate_form">   -->
			<input class="input" placeholder="Donators Email" type="text" name="donator" id="donator" /><br>
			<input id="donate" class="button" type="button" value="Add" /> 
		<!-- </form> -->
	<? } ?>
	
	<a id="logout" class="button">Sign Out</a>
	<div class="level dnt"><? echo type_name($_SESSION['usertype']) ?></div>
	
<? } else { ?>

<span class="title sub">Sign In</span>

<form id="login" name="login_form">                      
    <input class="input" placeholder="Email Address" type="text" name="username" id="email"<?if (isset($email) && $email) {echo " value='$email'";}?>/><br>
    <input class="input" placeholder="Password" type="password" name="password" id="password"/>
    <input class="button" type="button" value="Login" /> 
    <div class="rem-case">
	    <input id="rem-check" class="check" type="checkbox" <? if (isset($_COOKIE['validator'])) {echo 'checked';} ?>>
	    <label for="rem-check">Remember me</label>
	</div>
</form>

<a name="forgot" class="page button forgot">Forgot Password</a>
<a name="register" class="page button">Create Account</a>
    
<? } ?>      

<p class="error"><?if(isset($_GET['error'])){echo $_GET['error'];}?></p>
<p class="success"><?if(isset($_GET['success'])){echo 'You registered successfully, you can now login!';}?></p>

<? 

$seal = true;
include "credits.php" 

?>
