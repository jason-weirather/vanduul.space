<!DOCTYPE html>
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="css/main.css" />
  <link rel="stylesheet" href="css/game.css" />
  <link rel="shortcut icon" type="image/png" href="img/miniduul.png" />
  <?php include('php/game.php');?>

  <title>Vanduul Space</title>
</head>
<body onload="init();" onresize="stretch_canvas();">
  <canvas id="game_board">
  </canvas>
  <input id="user_input" onkeyup="user_input_keypress(event)" type="text"></input>
</body>
