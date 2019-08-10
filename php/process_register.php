<?php
include_once 'db_connect.php';
include_once 'psl-config.php';

$error = [];
$error['error'] = "";
 
if (isset($_POST['username'], $_POST['email'], $_POST['p'])) {
    // Sanitize and validate the data passed in
    $username = filter_input(INPUT_POST, 'username', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $email = filter_var($email, FILTER_VALIDATE_EMAIL);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // Not a valid email
        $error['error'] .= '<p class="error">The email address you entered is not valid</p>';
    }
 
    $password = filter_input(INPUT_POST, 'p', FILTER_SANITIZE_STRING);
    if (strlen($password) != 128) {
        // The hashed pwd should be 128 characters long.
        // If it's not, something really odd has happened
        $error['error'] .= '<p class="error">Invalid password configuration.</p>';
    }
    
    // Username validity and password validity have been checked client side.
    // This should should be adequate as nobody gains any advantage from
    // breaking these rules.
    //
 
    $prep_stmt = "SELECT id FROM members WHERE email = ? LIMIT 1";
    $stmt = $mysqli->prepare($prep_stmt);
 
    // check existing email  
    if ($stmt) {
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $stmt->store_result();
 
        if ($stmt->num_rows == 1) {
            // A user with this email address already exists
            $error['error'] .= '<p class="error">A user with this email address already exists.</p>';
            $stmt->close();
        }
    } else {
        $error['error'] .= '<p class="error">Database error Line 39</p>';
                $stmt->close();
    }
 
    // check existing username
    $prep_stmt = "SELECT id FROM members WHERE username = ? LIMIT 1";
    $stmt = $mysqli->prepare($prep_stmt);
 
    if ($stmt) {
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows == 1) {
            // A user with this username already exists
            $error['error'] .= '<p class="error">A user with this username already exists</p>';
            $stmt->close();
        }
    } else {
        $error['error'] .= '<p class="error">Database error line 55</p>';
        $stmt->close();
    }
 
    if (empty($error['error'])) {
 
        // Create hashed password using the password_hash function.
        // This function salts it with a random salt and can be verified with
        // the password_verify function.
        $password = password_hash($password, PASSWORD_BCRYPT);
 
        // Insert the new user into the database 
        if ($insert_stmt = $mysqli->prepare("INSERT INTO members (username, email, password, type) VALUES (?, ?, ?, 1)")) {
            $insert_stmt->bind_param('sss', $username, $email, $password);
            // Execute the prepared query.
            if (! $insert_stmt->execute()) {
                
                $error['error'] = "I'm sorry this failed through no fault of your own. Please try again later!";
                echo json_encode($error);
            }
        }
        $_GET['success'] = 1;
        include "login.php";
        
    } else {
        echo json_encode($error);
    }
}
?>