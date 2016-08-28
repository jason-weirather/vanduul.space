<?php
echo '<script src="data:text/javascript;base64,';
$file=file_get_contents('../game.js');
echo base64_encode($file);
echo '"></script>';
//echo '<script src="js/game.js"></script>';
?>
