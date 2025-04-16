<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Archangels MC - Mapa</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: Arial, sans-serif; background: #111; color: #fff; }
    #sidebar {
      position: fixed; top: 0; left: 0; bottom: 0; width: 280px;
      background: #1a1a1a; padding: 20px; overflow-y: auto;
      z-index: 10; border-right: 2px solid #222;
    }
    #sidebar img { display: block; margin: 0 auto 10px; max-width: 100px; }
    #sidebar h1 {
      text-align: center; font-size: 26px;
      font-weight: bold; color: red;
      text-shadow: 0 0 10px red; letter-spacing: 2px;
      margin-bottom: 10px;
    }
    #controls input, #controls button {
      width: 100%; margin-bottom: 5px; padding: 8px;
      background: #333; color: white; border: none; text-align: left;
      transition: background 0.2s, cursor 0.2s;
    }
    #controls button:hover {
      cursor: pointer;
      background: #444;
    }
    .category-header {
      width: 100%; margin-bottom: 5px; padding: 8px;
      background: #333; color: white; border: none;
      font-weight: 900; font-size: 16px; cursor: pointer;
    }
    .category-items { margin-left: 10px; display: none; }
    .item {
      display: flex; justify-content: space-between;
      align-items: center; font-size: 14px;
      margin: 5px 0; cursor: pointer;
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; display: inline-block; }
    .delete-btn { color: #888; font-size: 12px; cursor: pointer; }
    #map {
      position: absolute; left: 280px; top: 0; right: 0; bottom: 0;
      background: #000 url('mapa.png') no-repeat center center;
      background-size: contain; cursor: grab;
      overflow: hidden; transform-origin: 0 0;
    }
    .marker {
      position: absolute; border-radius: 50%; border: 1px solid white;
      transform: translate(-50%, -50%); cursor: pointer;
    }
    .polygon-point {
      position: absolute; width: 8px; height: 8px;
      background: cyan; border: 1px solid white;
      border-radius: 50%; transform: translate(-50%, -50%);
    }
    svg.polygon {
      position: absolute; top: 0; left: 0; pointer-events: auto;
    }
    .tooltip {
      position: absolute; background: rgba(0,0,0,0.8); color: white;
      padding: 4px 8px; font-size: 12px; border-radius: 4px;
      pointer-events: none; z-index: 99; display: none;
      white-space: nowrap;
    }
    .color-sample {
      display: inline-block; width: 20px; height: 20px; margin: 2px;
      border: 1px solid #555; cursor: pointer;
    }
    #form-wrapper {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #222; padding: 20px; border: 1px solid #555; z-index: 999; color: white;
    }
  </style>
</head>
<body>
  <div id="sidebar">
    <img src="logo.png" alt="Archangels MC logo">
    <h1>Archangels MC</h1>
    <div id="controls">
      <input type="text" id="search" placeholder="🔍 Hledat...">
      <button id="show-all">Zobrazit / Skrýt vše</button>
      <button id="planning-toggle">📝 Plánovat</button>
    </div>
    <div style="height: 20px;"></div>
    <div id="menu"></div>
  </div>
  <div id="map"></div>
  <div id="tooltip" class="tooltip"></div>
  <div id="form-container"></div>

  <!-- Firebase SDK -->
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
    import { getDatabase, ref, onValue, set, remove, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

    const firebaseConfig = {
      apiKey: "AIzaSyDjdiDEHn6LvQvvtpZ79ueE5JbxLf1ASWU",
      authDomain: "san-andreas-map-ef3a6.firebaseapp.com",
      databaseURL: "https://san-andreas-map-ef3a6-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "san-andreas-map-ef3a6",
      storageBucket: "san-andreas-map-ef3a6.appspot.com",
      messagingSenderId: "966102879269",
      appId: "1:966102879269:web:56156288290ec8b7c4c3cc",
      measurementId: "G-GRJKH0EWJQ"
    };

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    window.firebaseDB = db;
    window.firebaseRef = ref;
    window.firebaseOnValue = onValue;
    window.firebaseSet = set;
    window.firebaseRemove = remove;
    window.firebasePush = push;
  </script>

  <!-- Vlastní logika mapy -->
  <script type="module" src="firebase-map.js"></script>
</body>
</html>
