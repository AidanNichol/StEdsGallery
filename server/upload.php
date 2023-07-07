<?php 
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Auth-Token, authseq, Accept");



$response = array();
$server_name= $_SERVER["SERVER_NAME"];
if ($server_name == "127.0.0.1" || $server_name  == "localhost"){
    $upload_dir = $_SERVER["DOCUMENT_ROOT"]."/temp/";
}else{
     $upload_dir = "/home/ajnichol/apiServer/temp/";
}
$phpFileUploadErrors = array(
    0 => 'There is no error, the file uploaded with success',
    1 => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
    2 => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form',
    3 => 'The uploaded file was only partially uploaded',
    4 => 'No file was uploaded',
    6 => 'Missing a temporary folder',
    7 => 'Failed to write file to disk.',
    8 => 'A PHP extension stopped the file upload.',
);
$response=array();
    $error = $_FILES["photo"]["error"];
    $message = $phpFileUploadErrors[$error];
    $filename="";
    $tempFile="";
    if ($error == 0) {
        $tmp_name = $_FILES["photo"]["tmp_name"];
        // basename() may prevent filesystem traversal attacks;
        $filename=$_FILES["photo"]["name"];
        $filename = basename(strtolower(preg_replace('/\s+/','-',$filename)));
        $tempFile= $upload_dir.$filename;
        move_uploaded_file($tmp_name,$tempFile);
    }
    else{
    }
    $response=array("error"=>$error, "message"=>$message, "filename"=>$filename, 'server'=>$_SERVER, "tempFile"=>$tempFile);

echo json_encode($response);
?>