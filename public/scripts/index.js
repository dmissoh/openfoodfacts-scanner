var FOODFACTS_URL = "http://localhost:3000/foodfacts";

var takePicture = document.querySelector("#Take-Picture"),
showPicture = document.querySelector("#picture");
Result = document.querySelector("#textbit");
Canvas = document.createElement("canvas");
Canvas.width=640;
Canvas.height=480;
var resultArray = [];
ctx = Canvas.getContext("2d");
var workerCount = 0;
function receiveMessage(e) {
  if(e.data.success === "log") {
    console.log(e.data.result);
    return;
  }
  if(e.data.finished) {
    workerCount--;
    if(workerCount) {
      if(resultArray.length == 0) {
        DecodeWorker.postMessage({ImageData: ctx.getImageData(0,0,Canvas.width,Canvas.height).data, Width: Canvas.width, Height: Canvas.height, cmd: "flip"});
      } else {
        workerCount--;
      }
    }
  }
  if(e.data.success){
    var tempArray = e.data.result;
    for(var i = 0; i < tempArray.length; i++) {
      if(resultArray.indexOf(tempArray[i]) == -1) {
        getFoodFacts(tempArray[i]);
        resultArray.push(tempArray[i]);
      }
    }
    Result.innerHTML=resultArray.join("<br />");
  }else{
    if(resultArray.length === 0 && workerCount === 0) {
      Result.innerHTML="Decoding failed.";
    }
  }
}
var DecodeWorker = new Worker("scripts/decoder-worker.js");
DecodeWorker.onmessage = receiveMessage;
if(takePicture && showPicture) {
  takePicture.onchange = function (event) {
    var files = event.target.files
    if (files && files.length > 0) {
      file = files[0];
      try {
        var URL = window.URL || window.webkitURL;
        var imgURL = URL.createObjectURL(file);
        showPicture.src = imgURL;
        URL.revokeObjectURL(imgURL);
        DecodeBar()
      }
      catch (e) {
        try {
          var fileReader = new FileReader();
          fileReader.onload = function (event) {
            showPicture.src = event.target.result;
          };
          fileReader.readAsDataURL(file);
          DecodeBar()
        }
        catch (e) {
          Result.innerHTML = "Neither createObjectURL or FileReader are supported";
        }
      }
    }
  };
}
function DecodeBar(){
  showPicture.onload = function(){
    ctx.drawImage(showPicture,0,0,Canvas.width,Canvas.height);
    resultArray = [];
    workerCount = 2;
    Result.innerHTML="";
    DecodeWorker.postMessage({ImageData: ctx.getImageData(0,0,Canvas.width,Canvas.height).data, Width: Canvas.width, Height: Canvas.height, cmd: "normal"});
  }
}

function getFoodFacts(scannedText){
  console.log("Retrieve the food facts for the scanned result", scannedText);

  var decodingFails = scannedText.indexOf("Decoding failed") > -1;

  $("#product").empty();

  if(!decodingFails){
    var ean13Index = scannedText.indexOf("EAN-13:");
    if(ean13Index > -1){
      var barcode = scannedText.substring("EAN-13:".length).trim();
      console.log('Extracted barcode: ', barcode)
      sendGETRequest(FOODFACTS_URL + "?barcode=" + barcode);
    } else {
      alert("This is not an EAN-13 code!");
    }
  }
}

function sendGETRequest(url) {
  $.ajax({
      url: url,
      type: 'GET',
      success: function (data) {
          console.log("Response: ", data);
          var status = data.status;
          if(status == 'product found'){
            parseAndDisplay(data);
          } else {
            alert("Product not found in the database");
          }
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
          console.log("Fails to execute the query!", XMLHttpRequest);
      }
  });
}

function parseAndDisplay(data) {
  var product = data.product;
  var nutriments = product.nutriments;

  var product_name = product.product_name;
  var traces = product.traces;
  var origins = product.origins;
  var ingredients_text = product.ingredients_text;
  var categories = product.categories;
  var brands = product.brands;
  var stores = product.stores;
  var packaging = product.packaging;

  var image_small_url = product.image_small_url;

  var energy_100g = nutriments.energy_100g;
  var carbohydrates_100g = nutriments.carbohydrates_100g;
  var fiber_100g = nutriments.fiber_100g;
  var proteins_100g = nutriments.proteins_100g;
  var saturated_fat_100g = nutriments["saturated-fat_100g"];
  var sodium_100g = nutriments.sodium_100g;
  var sugars_100g = nutriments.sugars_100g;

  var energy_unit = nutriments.energy_unit;
  var carbohydrates_unit = nutriments.carbohydrates_unit;
  var fiber_unit = nutriments.fiber_unit;
  var proteins_unit = nutriments.proteins_unit;
  var saturated_fat_unit = nutriments["saturated-fat_unit"];
  var sodium_unit = nutriments.sodium_unit;
  var sugars_unit = nutriments.sugars_unit;

  $("#product").append('<img src="' + image_small_url + '" alt="Picture of the product" >');

  $("#product").append("<div class='title'><b>Information générales</b></div>");
  $("#product").append("<div><b>Nom du produit:</b> " + product_name + "</div>"); 
  $("#product").append("<div><b>Marque:</b> " + brands + "</div>");
  $("#product").append("<div><b>Origine:</b> " + origins + "</div>");
  $("#product").append("<div><b>Catégoriet:</b> " + categories + "</div>");
  $("#product").append("<div><b>Ingredients:</b> " + ingredients_text + "</div>");
  $("#product").append("<div><b>Contient des traces de:</b> " + traces + "</div>");
  $("#product").append("<div><b>Emballage:</b> " + packaging + "</div>");
  $("#product").append("<div><b>Cet article peut être trouvé à:</b> " + stores + "</div>");

  $("#product").append("<br/>");
  $("#product").append("<div class='title'><b>Composition pour 100g</b></div>");

  $("#product").append("<div><b>Energie: </b> " + energy_100g + " " + energy_unit + "</div>");
  $("#product").append("<div><b>Carbohydrates: </b> " + carbohydrates_100g + " " + carbohydrates_unit + "</div>");
  $("#product").append("<div><b>Fibres:</b> " + fiber_100g + " " + fiber_unit + "</div>");
  $("#product").append("<div><b>Proteines:</b> " + proteins_100g + " " + proteins_unit + "</div>");
  $("#product").append("<div><b>Graisses saturées: </b> " + saturated_fat_100g + " " + saturated_fat_unit + "</div>");
  $("#product").append("<div><b>Sodium: </b> " + sodium_100g + " " + sodium_unit + "</div>");
  $("#product").append("<div><b>Sucre :</b> " + sugars_100g  + " " + sugars_unit + "</div>");
}

