<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(0);
ini_set('display_errors', 0);

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "leohub_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Connection failed"]);
    exit();
}

$order_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($order_id <= 0) {
    echo json_encode(["success" => false, "error" => "Invalid order ID"]);
    exit();
}

// Get order details
$order_sql = "SELECT o.*, 
               DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') as formatted_date 
               FROM orders_new o WHERE o.id = $order_id";
$order_result = $conn->query($order_sql);
$order = $order_result->fetch_assoc();

// Get order items with food item names
$items_sql = "SELECT oi.*, f.name, f.image_url 
              FROM order_items_new oi 
              JOIN food_items_new f ON oi.food_item_id = f.id 
              WHERE oi.order_id = $order_id";
$items_result = $conn->query($items_sql);
$items = [];

if ($items_result->num_rows > 0) {
    while($row = $items_result->fetch_assoc()) {
        $items[] = $row;
    }
}

echo json_encode(["success" => true, "order" => $order, "items" => $items]);
$conn->close();
?>