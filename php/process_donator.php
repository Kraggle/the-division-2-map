<?php
// session_start();
include_once 'session_start.php';
include_once 'functions.php';
include_once 'db_connect.php';

$check = "NtivUrGenTAt";
$error = [];

if (login_check($mysqli)) {
    
    if (isset($_POST['load']) && $_POST['load'] == $check) {
        
        $username = $_SESSION['username'];
        
        $prep_stmt = "SELECT id, type FROM members WHERE username = ? LIMIT 1";
        $stmt = $mysqli->prepare($prep_stmt);
     
        // check existing email  
        if ($stmt) {
            $stmt->bind_param('s', $username);
            $stmt->execute();
            $stmt->store_result();
     
            if ($stmt->num_rows == 1) {
                
                $stmt->bind_result($user_id, $type);
                $stmt->fetch();
                $stmt->close();
            }
        }
        
        $type = ($type == 1 ? 2 : $type);
 
        if ($update_stmt = $mysqli->prepare("UPDATE members SET type=?, donate=1 WHERE id=?")) {
            $update_stmt->bind_param('ii', $type, $user_id);
            // Execute the prepared query.
            if (! $update_stmt->execute()) {
                
                $error['error'] = "I'm sorry this failed through no fault of your own. Please try again later!";
            }
        }
        $error['success'] = $username . " added as a donator!";
        
    } else if (isset($_SESSION['usertype']) && $_SESSION['usertype'] == 5 && isset($_POST['email'])) {
           
        $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
        $email = filter_var($email, FILTER_VALIDATE_EMAIL);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // Not a valid email
            $error['error'] .= 'The email address you entered is not valid';
        }
        
        $prep_stmt = "SELECT id, type, username FROM members WHERE email = ? LIMIT 1";
        $stmt = $mysqli->prepare($prep_stmt);
     
        // check existing email  
        if ($stmt) {
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $stmt->store_result();
     
            if ($stmt->num_rows == 1) {
                // A user with this email exists
                
                // get variables from result.
                $stmt->bind_result($user_id, $type, $username);
                $stmt->fetch();
                $stmt->close();
                
            } else {
                $error['error'] = 'That email does not exist!';
                $stmt->close();
            }
        }
        
        if (empty($error['error'])) {
     
            $type = ($type == 1 ? 2 : $type);
     
            if ($update_stmt = $mysqli->prepare("UPDATE members SET type=?, donate=1 WHERE id=?")) {
                $update_stmt->bind_param('ii', $type, $user_id);
                // Execute the prepared query.
                if (! $update_stmt->execute()) {
                    
                    $error['error'] = "I'm sorry this failed through no fault of your own. Please try again later!";
                }
            }
            $error['success'] = $username . " added as a donator!";
        }
    } else {
        $error['error'] = "Param missmatch!";
    }
} else {
    $error['error'] = "Your not logged in!";
}

echo json_encode($error);
?>