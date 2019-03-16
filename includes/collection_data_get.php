<?php
// session_start();
include_once 'session_start.php';
include_once 'db_connect.php';
include_once 'psl-config.php';
include_once 'functions.php';

if (login_check($mysqli)) {
   
   $user_id = $_SESSION['user_id'];
   
   if ($stmt = $mysqli->prepare("SELECT `set_data` FROM `set_collection` WHERE `user_id` = ?")) {
        $stmt->bind_param('i', $user_id);  // Bind "$user_id" to parameter.
        $stmt->execute();    // Execute the prepared query.
        $stmt->store_result();

        // get variables from result.
        $stmt->bind_result($set_data);
        $stmt->fetch();

        if ($stmt->num_rows == 1) {
            
            echo $set_data;
        }
    }
}
?>

