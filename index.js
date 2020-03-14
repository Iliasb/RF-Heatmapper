import "ol/ol.css";
import Geolocation from "ol/Geolocation";
//import KML from "ol/format/KML";
//import GeoJSON from "ol/format/GeoJSON";
import {
  defaults as defaultInteractions,
  DragRotateAndZoom
} from "ol/interaction";
import {
  Tile as TileLayer,
  Vector as VectorLayer,
  Heatmap as HeatmapLayer
} from "ol/layer";
import Stamen from "ol/source/Stamen";
import VectorSource from "ol/source/Vector";
import Map from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import { Circle as CircleStyle, Fill, Stroke, Style, Icon } from "ol/style";
import Point from "ol/geom/Point";
import { toPng } from "html-to-image";

$(document).ready(function() {
  var blur = document.getElementById("blur");
  var radius = document.getElementById("radius");

  var raster = new TileLayer({
    source: new Stamen({
      layer: "terrain"
    })
  });

  var view = new View({
    center: [0, 0],
    zoom: 2
  });

  var map = new Map({
    layers: [raster],
    interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
    target: "map",
    view: view
  });

  var geolocation = new Geolocation({
    // enableHighAccuracy must be set to true to have the heading value.
    trackingOptions: {
      enableHighAccuracy: true
    },
    projection: view.getProjection()
  });

  geolocation.setTracking(true);

  $(".footer").click(function() {
    map.setView(
      new View({
        center: geolocation.getPosition(),
        zoom: 15
      })
    );
  });

  $("#settings").click(function() {
    $("#settingsModal").modal("show");
  });

  $("#export-png").click(function() {
    var exportOptions = {
      filter: function(element) {
        return element.className
          ? element.className.indexOf("ol-control") === -1
          : true;
      }
    };

    map.once("rendercomplete", function() {
      toPng(map.getTargetElement(), exportOptions).then(function(dataURL) {
        var link = document.getElementById("image-download");
        link.href = dataURL;
        link.click();
      });
    });
    map.renderSync();
  });

  var heatmap = $("#addPoint").click(function() {
    // Close the modal
    $("#newlocation").modal("hide");
    // Clear the remarks field of the form
    $("#remarks").val("");

    var pointFeature = new Feature();
    pointFeature.set("name", $("#name").val());
    pointFeature.set("power", $("#dbm").val());
    pointFeature.set("type", $("#type").val());
    pointFeature.set("weather", $("#weather").val());
    pointFeature.set("building", $("#building").val());
    pointFeature.set("datetime", $("#datetime").val());
    pointFeature.set("remarks", $("#remarks").val());
    pointFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: "#3399CC"
          }),
          stroke: new Stroke({
            color: "#fff",
            width: 2
          })
        })
      })
    );

    var coordinates = [$("#long").val(), $("#lat").val()];
    pointFeature.setGeometry(coordinates ? new Point(coordinates) : null);

    var heatmap = new HeatmapLayer({
      map: map,
      source: new VectorSource({
        features: [pointFeature]
      }),
      blur: parseInt(blur.value, 10),
      radius: parseInt(radius.value, 10) + parseInt($("#dbm").val(), 10) + 90
    });
    return heatmap;
  });

  map.on("click", function(event) {
    var feature = map.getFeaturesAtPixel(event.pixel)[0];
    if (feature) {
      var coordinate = feature.getGeometry().getCoordinates();
      alert(coordinate);
      alert(feature.get("name"));
    } else {
      //Not known, lets show the form

      var newDatetime = new Date();
      document.getElementById("long").value = event.coordinate[0];
      document.getElementById("lat").value = event.coordinate[1];
      document.getElementById("alt").value = event.coordinate[2];
      document.getElementById("datetime").value = newDatetime.toISOString();
      $("#newlocation").modal("show");
    }
  });

  // update the HTML page when the position changes.
  geolocation.on("change", function() {
    document.getElementById("accuracy").innerText =
      geolocation.getAccuracy() + " [m]";
    document.getElementById("altitude").innerText =
      geolocation.getAltitude() + " [m]";
    document.getElementById("altitudeAccuracy").innerText =
      geolocation.getAltitudeAccuracy() + " [m]";
    document.getElementById("heading").innerText =
      geolocation.getHeading() + " [rad]";
    document.getElementById("speed").innerText =
      geolocation.getSpeed() + " [m/s]";
  });

  // handle geolocation error.
  geolocation.on("error", function(error) {
    var info = document.getElementById("footer");
    info.innerHTML = error.message;
    info.style.display = "";
  });

  var positionFeature = new Feature();
  positionFeature.setStyle(
    new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        opacity: 0.8,
        scale: 1,
        src: "img/user.svg"
      })
    })
  );

  geolocation.on("change:position", function() {
    var coordinates = geolocation.getPosition();
    positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  });

  new VectorLayer({
    map: map,
    source: new VectorSource({
      features: [positionFeature]
    })
  });

  var slider = document.getElementById("dbm");
  var output = document.getElementById("dbmHelp");
  output.innerHTML = slider.value + " DBm"; // Display the default slider value

  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function() {
    output.innerHTML = this.value + " DBm";
  };

  var blurHandler = function() {
    //vector.setBlur(parseInt(blur.value, 10));
  };
  blur.addEventListener("input", blurHandler);
  blur.addEventListener("change", blurHandler);

  var radiusHandler = function() {
    //vector.setRadius(parseInt(radius.value, 10));
  };
  radius.addEventListener("input", radiusHandler);
  radius.addEventListener("change", radiusHandler);
});
