(function () {
  'use strict';

  var SEARCH_API_KEY = 'search-2TreOT8';
  var ROUTING_API_KEY = 'valhalla-Mc6zgDA';
  var transit_options = {
      "transit" : {
        use_bus: 0.5,
        use_rail: 0.6,
        use_transfers: 0.4
      }
  };

  var demo_sources = [
    {
      index: 0,
      title: 'Transit to Treasure Island',
      costing: 'multimodal',
      waypoints: [
        { lat: 37.764472, lng: -122.422027, label: 'Mission District' },
        { lat: 37.817242, lng: -122.372417, label: 'Treasure Island' },
      ],
      costing_options: transit_options,
      date_time: {
        type: 1, //depart at
        value: '2016-09-13T08:00' // For demo we want to be consistent and always use Next Tuesday at 8am
      }
    },
    {
      index: 1,
      title: 'Biking to Fort Point',
      costing: 'bicycle',
      waypoints: [
        { lat: 37.75252, lng: -122.44742, label: 'Twin Peaks' },
        { lat: 37.81037, lng: -122.47691, label: 'Fort Point' },
      ]
    },
    {
      index: 2,
      title: 'Bay To Breakers',
      costing: 'pedestrian',
      waypoints: [
        { lat: 37.794696, lng: -122.394710, label: 'Ferry Building' },
        { lat: 37.769430, lng: -122.510638, label: 'Ocean Beach' },
      ],
      date_time: {
        type: 1, //depart at
        value: '2016-09-13T08:00' // For demo we want to be consistent and always use Next Tuesday at 8am
      }
    },
    {
      index: 3,
      title: 'Driving to Caltrain',
      costing: 'auto',
      waypoints: [
        { lat: 37.78520, lng: -122.49986, label: 'Lincoln Park' },
        { lat: 37.77680, lng: -122.39464, label: 'Caltrain Station' },
      ]
    }
  ];

  // GET SVG sprites.
  httpGet('images/icons.svg', function (error, response) {
    var svgContainerEl = document.createElement('div');
    svgContainerEl.innerHTML = response;
    // Append to body. This is necessary to make it available for <use> later on
    document.body.insertBefore(svgContainerEl, document.body.firstChild);
    return svgContainerEl.querySelectorAll('symbol');
  });

  // Is there an error? Let's find out about it.
  window.onerror = function (message, url, lineNo, columnNo, error) {
    var errorObj = {
      message: message,
      url: url,
      lineNo: lineNo,
      columnNo: columnNo,
      ua: window.navigator.userAgent
    };

    MPZN.trackEvent('error', 'tbd', 'turn-by-turn-marketing', JSON.stringify(errorObj));
  };

  function hasWebGL () {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (x) {
      return false;
    }
  }

  function parseQuery (qstr) {
    var query = {};
    var a = qstr.slice(1).split('&');
    for (var i in a) {
      var b = a[i].split('=');
      query[decodeURIComponent(b[0])] = b[1] ? decodeURIComponent(b[1]) : null;
    }
    return query;
  }

  // Set up Redux state store!
  function mapViewReducer (state, action) {
    // Initial state
    // NYC view
    // Note that in this demo, it will always be
    // overriden by the first demo tab.
    if (typeof state === 'undefined') {
      return {
        source: 'default',
        lng: -73.9805,
        lat: 40.7259,
        zoom: 12
      };
    }

    switch (action.type) {
      case 'SET_LAT_LNG':
        return {
          source: action.source,
          lng: Number(action.lng).toFixed(5),
          lat: Number(action.lat).toFixed(5),
          zoom: state.zoom
        };
      case 'SET_ZOOM':
        return {
          source: action.source,
          lng: state.lng,
          lat: state.lat,
          zoom: action.zoom
        };
      case 'SET_LAT_LNG_ZOOM':
        return {
          source: action.source,
          lng: Number(action.lng).toFixed(5),
          lat: Number(action.lat).toFixed(5),
          zoom: action.zoom
        };
      default:
        return state;
    }
  }

  function routeReducer (state, action) {
    // Initial state
    if (typeof state === 'undefined') {
      return {
        costing: null,
        waypoints: [],
        costing_options: {},
        date_time: {
          value: null,
          type: null
        }
      };
    }

    switch (action.type) {
      case 'SET_ROUTE_PARAMS':
        return {
          costing: action.costing,
          waypoints: action.waypoints,
          // Not all route params will have costing_options provided. 
          costing_options: action.costing_options ? action.costing_options : {},
          // Not all route params will have date_time provided.
          date_time: {
            value: action.date_time ? action.date_time.value : null,
            type: action.date_time ?  Number(action.date_time.type) : null
          }
        };
      case 'SET_ROUTE_WAYPOINTS':
        return {
          costing: state.costing,
          waypoints: action.waypoints,
          costing_options: state.costing_options,
          date_time: state.date_time
        };
      case 'SET_ROUTE_COSTING':
        return {
          costing: action.costing,
          waypoints: state.waypoints,
          costing_options: state.costing_options,
          date_time: state.date_time
        };
      case 'SET_ROUTE_DATE_TIME':
        return {
          costing: state.costing,
          waypoints: state.waypoints,
          costing_options: state.costing_options,
          date_time: {
            value: action.date_time.value,
            type: Number(action.date_time.type)
          }
        };
      case 'SET_ROUTE_COSTING_OPTIONS':
        return {
          costing: state.costing,
          waypoints: state.waypoints,
          costing_options: action.costing_options,
          date_time: state.date_time
        };
      case 'UPDATE_WAYPOINT_1_LABEL':
        var newArray = state.waypoints.slice(0);
        newArray[0].label = action.label;
        return {
          costing: state.costing,
          waypoints: newArray,
          costing_options: state.costing_options,
          date_time: state.date_time
        }
      case 'UPDATE_WAYPOINT_2_LABEL':
        var newArray = state.waypoints.slice(0);
        newArray[1].label = action.label;
        return {
          costing: state.costing,
          waypoints: newArray,
          costing_options: state.costing_options,
          date_time: state.date_time
        }
      default:
        return state;
    }
  }

  function demoSwitcherReducer (state, action) {
    // Initial state
    if (typeof state === 'undefined') {
      return {
        index: 0,
      };
    }

    switch (action.type) {
      case 'SWITCH_DEMO':
        return {
          index: Number(action.index)
        }
      default:
        return state;
    }
  }

  function errorStateReducer (state, action) {
    // Initial state
    if (typeof state === 'undefined') {
      return {
        message: null,
      };
    }

    switch (action.type) {
      case 'ERROR':
        return {
          message: action.message
        };
      case 'CLEAR_ERROR':
        return {
          message: null
        };
      default:
        return state;
    }
  }

  function appStateReducer (state, action) {
    // Initial state
    if (typeof state === 'undefined') {
      return {
        routeViewNeedsFitting: false,
        routeShouldQuery: false,
      };
    }

    switch (action.type) {
      case 'MARK_ROUTER_VIEW_STATE':
        return {
          routeViewNeedsFitting: action.routeViewNeedsFitting,
          routeShouldQuery: state.routeShouldQuery,
        };
      case 'MARK_ROUTER_SHOULD_QUERY':
        return {
          routeViewNeedsFitting: state.routeViewNeedsFitting,
          routeShouldQuery: action.routeShouldQuery,
        };
      // This allows both to be set at once
      case 'MARK_ROUTER_STATE':
        return {
          routeViewNeedsFitting: action.routeViewNeedsFitting,
          routeShouldQuery: action.routeShouldQuery,
        };
      default:
        return state;
    }
  }

  var reducers = Redux.combineReducers({
    mapView: mapViewReducer,
    route: routeReducer,
    demoTab: demoSwitcherReducer,
    errorState: errorStateReducer,
    appState: appStateReducer
  });

  var store = Redux.createStore(reducers);

  // Let's patch Leaflet!
  // See blog issues #891, #918, and this filed upstream in Leaflet:
  // https://github.com/Leaflet/Leaflet/issues/4359
  // The SVG <use> element creates problems in IE11 / Edge / Safari 8
  // because the event target for dragging is inside the <use> element
  // and not the <use> element itself. Here, we patch the L.Draggable._onMove
  // method to be sure to use the correct element when dragging.
  // We can remove this patch once Leaflet publishes a fix.
  L.Draggable.prototype._onMove = function (e) {
    if (e.touches && e.touches.length > 1) {
      this._moved = true;
      return;
    }

    var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
        newPoint = new L.Point(first.clientX, first.clientY),
        offset = newPoint.subtract(this._startPoint);

    if (!offset.x && !offset.y) { return; }
    if (L.Browser.touch && Math.abs(offset.x) + Math.abs(offset.y) < 3) { return; }

    L.DomEvent.preventDefault(e);

    if (!this._moved) {
      this.fire('dragstart');

      this._moved = true;
      this._startPos = L.DomUtil.getPosition(this._element).subtract(offset);

      L.DomUtil.addClass(document.body, 'leaflet-dragging');
      this._lastTarget = e.target || e.srcElement;

      // BEGIN PATCH
      if ((window.SVGElementInstance) && (this._lastTarget instanceof SVGElementInstance)) {
        this._lastTarget = this._lastTarget.correspondingUseElement;
      }
      // END PATCH

      L.DomUtil.addClass(this._lastTarget, 'leaflet-drag-target');
    }

    this._newPos = this._startPos.add(offset);
    this._moving = true;

    L.Util.cancelAnimFrame(this._animRequest);
    this._animRequest = L.Util.requestAnimFrame(this._updatePosition, this, true, this._dragStartTarget);
  }

  // Add map
  var map = L.map('demo-frame', {
    zoomControl: false,
    scrollWheelZoom: false,
    minZoom: 10,
    maxZoom: 15
  });

  // Manually add zoom to top right
  L.control.zoom({
    position: 'topright'
  }).addTo(map);

  // Use Tangram if WebGL is present, otherwise,
  // fallback to stock OSM base layer
  var layer;
  if (hasWebGL() === true) {
    layer = Tangram.leafletLayer({
      scene: 'https://mapzen.com/carto/zinc-style/2.0/zinc-style.yaml',
      attribution: '<a href="https://mapzen.com/tangram">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/">Mapzen</a>'
    });
  } else {
    layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM contributors',
    });
  }
  layer.addTo(map);

  // Adjust padding for fitBounds()
  // ==============================
  //
  // See this discussion: https://github.com/perliedman/leaflet-routing-machine/issues/60
  // We override Leaflet's default fitBounds method to use our padding options by
  // default. Thus, LRM calls fitBounds() as is. Additionally, any other scripts
  // that call for fitBounds() can take advantage of the same padding behaviour.
  map.origFitBounds = map.fitBounds;
  map.fitBounds = function (bounds, options) {
    map.origFitBounds(bounds, {
      // Left padding accounts for the narrative window.
      // Top padding accounts for the floating section navigation bar.
      // These conditions apply only when the viewport breakpoint is at
      // desktop screens or higher. Otherwise, assume that the narrative
      // window is not present, and that the section navigation is
      // condensed, so less padding is required on mobile viewports.
      paddingTopLeft: (window.innerWidth > 768) ? [420, 100] : [30, 60],
      // Bottom and right padding accounts only for slight
      // breathing room, in order to prevent markers from appearing
      // at the very edge of maps.
      paddingBottomRight: [30, 30],
    })
  };

  // Adjust offset for panTo()
  // ==============================
  map.origPanTo = map.panTo;
  // In LRM, coordinate is array format [lat, lng]
  map.panTo = function (coordinate) {
    // Approximates the middle of the viewport when the narrative window
    // is displayed.
    // TODO: Don't hard-code
    var PAN_OFFSET_X = (window.innerWidth > 768) ? 200 : 0;
    var PAN_OFFSET_Y = 0;
    var x = map.latLngToContainerPoint(coordinate).x - PAN_OFFSET_X;
    var y = map.latLngToContainerPoint(coordinate).y - PAN_OFFSET_Y;
    var point = map.containerPointToLatLng([x, y]);
    map.origPanTo(point);
  }

  // Patch LRM's L.Routing.Itinerary to send depart and arrive data
  L.Routing.Itinerary.prototype._createItineraryContainer = function(r) {
    var container = this._itineraryBuilder.createContainer(),
        steps = this._itineraryBuilder.createStepsContainer(),
        i,
        instr,
        step,
        distance,
        text,
        icon;

    container.appendChild(steps);

    for (i = 0; i < r.instructions.length; i++) {
      instr = r.instructions[i];
      text = this._formatter.formatInstruction(instr, i);
      distance = this._formatter.formatDistance(instr.distance);
      icon = this._formatter.getIconName(instr, i);

      // ======================= BEGIN PATCH =======================

      var travelmode = (typeof instr.travel_mode != "undefined" ? instr.travel_mode : "");

      if (icon === '04' || icon === '05' || icon === '06')
        distance = '';

      // Adjust icons to be transit/travel type icons, if present
      // If starting a transit connection, look ahead to the
      // next instruction to see what travel type it is
      if (icon === '33') {
        // type: 33 "kTransitConnectionStart"
        var travelType = r.instructions[i + 1].travel_type;
        icon = 'transit-type-' + travelType.toString();
        // Also, for these connections, don't show distance
        distance = '';
        // Provides the operator name (short name if is exists, else long) to use at the type: 33 "kTransitConnectionStart
        var operatorName =r.instructions[i+1].transit_info.operator_name;
        text = text + "\nFollow signs for " + operatorName + (".");
      } else if (icon === '35') {
        // If finishing a transit connection, look behind
        // We are assuming that exit always follow a transit routing
        // instruction
        // type: 35 "kTransitConnectionDestination"
        var travelType = r.instructions[i - 1].travel_type;
        icon = 'transit-type-' + travelType.toString();
        distance = '';
      }

      if (instr.transit_info) {
        // There should always be a travel type.
        var travelType = instr.travel_type;
        icon = 'transit-type-' + travelType.toString();
      }

      // Note that if these are transit-related instructions,
      // the variable 'icon' is modified at this point,
      // and the ItineraryBuilder.createStep() will do
      // stuff with it.

      // Add depart and arrive instructions
      var depart = (typeof instr.depart_instruction != "undefined" ? instr.depart_instruction : "");
      var arrive = (typeof instr.arrive_instruction != "undefined" ? instr.arrive_instruction : "");

      // Send it to createStep
      step = this._itineraryBuilder.createStep(text, distance, icon, steps, depart, arrive, travelmode);
      // ======================= END PATCH =======================

      this._addRowListeners(step, r.coordinates[instr.index]);

    }

    return container;
  };

  // Create a new instance of Mapzen LRM Formatter to deal with
  // icon naming logic
  var MapzenFormatter = L.Routing.Mapzen.Formatter;
  MapzenFormatter.prototype.getIconName = function (instr, i) {
    var id = instr.type;

    // Zero-pad this id to two digits
    id = ('0' + id.toString()).slice(-2);

    // Left and right should be a straight arrow to avoid confusion
    // about initial direction, since this demo has no feedback about
    // which direction the user is actually facing.
    // See https://github.com/mapzen/blog/issues/865,
    // and Eraser Map UI. We just hard-code the change to the
    // icon number here.
    // Type 0 is "kNone", but:
    //    "[Duane] He said that if you want, anywhere it stays type:0,
    //    you can substitue the straight arrow icon"
    //    -- via Kristen, in #routingdemo Slack, 3/18/2016
    // Type 36 is "kPostTransitConnectionDestination"
    // Also temporarily assign that to a straight arrow.
    if (id === '00' || id === '02' || id === '03' || id === '36') {
      id = '01';
    }

    return id;
  }

  // Also update formatDistance() to return only one unit
  // of precision on kilometer values.
  MapzenFormatter.prototype.formatDistance = function (d /* Number (meters) */) {
    var un = this.options.unitNames,
        v,
      data;
    if (this.options.units === 'imperial') {
      //valhalla returns distance in km
      d = d * 1000;
      d = d / 1.609344;
      if (d >= 1000) {
        data = {
          value: (this._round(d) / 1000),
          unit: un.miles
        };
      } else {
        data = {
          value: this._round(d / 1.760),
          unit: un.yards
        };
      }
    } else {
      v = d;
      data = {
        // ======================= BEGIN PATCH =======================
        value: v >= 1 ? v.toFixed(1) : v*1000,
        // ======================= END PATCH =======================
        unit: v >= 1 ? un.kilometers : un.meters
      };
    }

    return L.Util.template(this.options.distanceTemplate, data);
  }

  // Create a new instance of LRM's L.Routing.ItineraryBuilder with custom DOM
  var ItineraryBuilder = L.Routing.ItineraryBuilder;
  ItineraryBuilder.prototype.createStep = function (text, distance, icon, steps, depart, arrive, travelmode) {
    var row = L.DomUtil.create('tr', 'route-itinerary-row', steps);
    var span, td, maneuver, div;

    // Add SVG route icons.
    var svgIconId = 'icon-maneuver-' + icon;
    // If icon is a transit type icon, there's a different SVG id for it
    if (icon.lastIndexOf('transit-type-') === 0) {
      svgIconId = 'icon-' + icon;
    }
    var svgEl = createSVGElement(svgIconId, 'icon-maneuver');

    // Some icons have colors
    if (icon === '04' || icon === '05' || icon === '06') {
      svgEl.style.fill = '#3455db';
    }

    maneuver = L.DomUtil.create('td', 'route-itinerary-maneuver', row);
    maneuver.appendChild(svgEl);

    td = L.DomUtil.create('td', 'route-itinerary-guide', row);

    div = L.DomUtil.create('div', 'route-itinerary-depart', row);
    div.appendChild(document.createTextNode(depart));
    td.appendChild(div);

    td.appendChild(document.createTextNode(text));

    div = L.DomUtil.create('div', 'route-itinerary-arrive', row);
    div.appendChild(document.createTextNode(arrive));
    td.appendChild(div);

    td = L.DomUtil.create('td', 'route-itinerary-measure', row);
    td.appendChild(document.createTextNode(distance));

    return row;
  };

  var router = L.Routing.control({
    waypoints: demo_sources[0]['waypoints'],
    fitSelectedRoutes: false,
    routeWhileDragging: false,
    addWaypoints: false,
    router: L.Routing.mapzen(ROUTING_API_KEY, demo_sources[0]),
    formatter: new MapzenFormatter(),
    itineraryFormatter: new ItineraryBuilder(),
    // TODO: Build this HTML outside of LRM
    summaryTemplate: '<div class="route-display-container">' +
        '<div class="route-display-start">' +
          '<div class="route-display-start-pin">' +
            '<svg xmlns="http://www.w3.org/1999/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="icon-start-pin"><use xlink:href="#icon-pin-a"></use></svg>' +
          '</div>' +
          '<div class="route-display-start-text"></div>' +
        '</div>' +
        '<div class="route-display-dest">' +
          '<div class="route-display-dest-pin">' +
            '<svg xmlns="http://www.w3.org/1999/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="icon-dest-pin"><use xlink:href="#icon-pin-b"></use></svg>' +
          '</div>' +
          '<div class="route-display-dest-text"></div>' +
        '</div>' +
      '</div>' +
      '<div class="route-display-info">' +
        '<svg xmlns="http://www.w3.org/1999/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="icon-mode"><use xlink:href="#icon-mode-{costing}"></use></svg>' +
        '{distance}, {time}' +
      '</div>' +
      '<div class="route-display-date-time">' +
        '<svg xmlns="http://www.w3.org/1999/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="icon-clock"><use xlink:href="#icon-clock"></use></svg>' +
        '<span></span>' +
      '</div>',
    createMarker: function (i, wp, n) {
      var iconV;

      if (i === 0) {
        iconV = L.divIcon({
          html: '<svg xmlns="http://www.w3.org/1999/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="#icon-pin-a"></use></svg>',
          className: 'icon-marker',
          iconSize: [48, 48],
          iconAnchor: [22, 45]
        });
      } else {
        iconV = L.divIcon({
          html: '<svg xmlns="http://www.w3.org/1999/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="#icon-pin-b"></use></svg>',
          className: 'icon-marker',
          iconSize: [48, 48],
          iconAnchor: [22, 45]
        });
      }

      var options = {
        draggable: true,
        icon: iconV
      }

      return L.marker(wp.latLng,options);
    },
    //////this is where point marker (circle) style is set!!!
    pointMarkerStyle: {
      radius: 5,
      color: '#20345b',
      fillColor: '#fff',
      opacity: 1,
      fillOpacity: 1
    },
    lineOptions: {
      styles: [
        { color: 'white', opacity: 0.8, weight: 10 },
        { color: '#3455db', opacity: 1, weight: 6 }
      ]
    }
  }).setPosition('topleft').addTo(map);

  var mobileRouteEL = document.createElement('div');
  mobileRouteEL.className = 'mobile-route';
  mobileRouteEL.classList.add('list-route');
  mobileRouteEL.addEventListener('click', function (e) {
    var routingContainer = document.getElementsByClassName('leaflet-routing-container')[0];
    if (routingContainer.classList.contains('left-align')) {
      routingContainer.classList.remove('left-align');
      mobileRouteEL.classList.add('list-route');
      mobileRouteEL.classList.remove('cancel-route');
    } else {
      routingContainer.classList.add('left-align');
      mobileRouteEL.classList.remove('list-route');
      mobileRouteEL.classList.add('cancel-route');
    }
  });

  demo.appendChild(mobileRouteEL);

  // Set up demo tabs
  var demoSwitcher = new DemoSwitcher({
    sources: demo_sources,
    onClick: function (source) {
      // Set selected demo tab for application state
      store.dispatch({
        type: 'SWITCH_DEMO',
        index: source.index
      });

      // Set the selected route
      store.dispatch({
        type: 'SET_ROUTE_PARAMS',
        costing: source.costing,
        waypoints: source.waypoints,
        costing_options: source.costing_options || {},
        date_time: source.date_time || null
      });

      // Mark that the map view needs to be fit
      // & needs to perform a route query
      store.dispatch({
        type: 'MARK_ROUTER_STATE',
        routeViewNeedsFitting: true,
        routeShouldQuery: true
      });
    }
  });

  // Initial condition of demo, based on the URL parameters.
  var query = parseQuery(window.parent.location.search);
  setStateFromQuery(query);

  // Start subscription after initial view & map stuff is set
  function renderDemoState () {
    var state = store.getState();

    // Do nothing to set the mapView. The reducer and state is
    // stored "just in case", but does not currently affect the
    // view in this demo.

    // var mapView = store.mapView;

    // If the source is not Leaflet, then set the view
    // if (mapView.source !== 'leaflet') {
    //   map.setView({ lng: mapView.lng, lat: mapView.lat }, mapView.zoom);
    // }

    // Highlight the active tab
    demoSwitcher.highlightActiveTab(state.demoTab.index);

    // Call the router, if requested
    if (state.appState.routeShouldQuery === true) {
      // Unmark the should-query app state
      store.dispatch({
        type: 'MARK_ROUTER_SHOULD_QUERY',
        routeShouldQuery: false
      });
      setRoute(state.route);
    }

    // If error state
    if (state.errorState.message) {
      displayError(state.errorState.message);
    } else {
      hideError();
    }

    // Update URL query string
    updateURLState(state);
  }

  store.subscribe(renderDemoState);
  renderDemoState();

  router.on('waypointschanged', function (data) {
    // We use this event from LRM to record new waypoints if they are
    // created by users interacting with the map. Its only purpose is to
    // record state _after_ the fact.

    // Format the waypoints the way we want
    var waypoints = convertLRMWaypointsToData(data.waypoints);

    // Copy over labels if they match
    var origWaypoints = store.getState().route.waypoints;

    var newWaypoints = waypoints.map(function (waypoint, index) {
      if (waypoint.lat === origWaypoints[index].lat && waypoint.lng === origWaypoints[index].lng) {
        waypoint.label = origWaypoints[index].label;
      }
      return waypoint;
    });

    // Update Redux store.
    store.dispatch({
      type: 'SET_ROUTE_WAYPOINTS',
      waypoints: waypoints
    });
  });

  // Update route summary with start & end location labels.
  router.on('routesfound', function (data) {
    // Clear error state.
    store.dispatch({
      type: 'CLEAR_ERROR'
    });

    // Run this after LRM updates DOM.
    // LRM expects to update the {name} in summaryTemplate with the "route name",
    // which we do not have, and in any case we have two points to update: the
    // first and last (or second) waypoint, so we do this after LRM is done.
    window.setTimeout(function () {
      var state = store.getState().route;

      var startEl = document.querySelector('.route-display-start-text');
      var destEl = document.querySelector('.route-display-dest-text');
      var dateTimeEl = document.querySelector('.route-display-date-time');

      // Display a label if we have it
      // Assumes no need to support Node.innerText
      if (state.waypoints[0].label) {
        startEl.textContent = state.waypoints[0].label;
      } else {
        reverseGeocode(state.waypoints[0].lat, state.waypoints[0].lng, function (label) {
          startEl.textContent = label;

          // We also update the store to cache this label after retrieval.
          // I tried to do the reverse geocode earlier, e.g. on the 'routingstart'
          // event, and store all the waypoint data at once, but the problem is
          // that we can't update the DOM with this label anytime BUT now, so
          // the easiest thing to do is just issue a single dispatch action that
          // updates only the label.
          store.dispatch({
            type: 'UPDATE_WAYPOINT_1_LABEL',
            label: label
          });
        });
      }

      if (state.waypoints[1].label) {
        destEl.textContent = state.waypoints[1].label;
      } else {
        reverseGeocode(state.waypoints[1].lat, state.waypoints[1].lng, function (label) {
          destEl.textContent = label;
          store.dispatch({
            type: 'UPDATE_WAYPOINT_2_LABEL',
            label: label
          });
        });
      }

      // Display date_time settings if present
      var dateTimeInstruction;

      if (state.date_time.type && state.date_time.value) {
        dateTimeEl.style.display = 'block';
        // Note: we only have one type right now, see documentation to implement
        // the rest of them.
        // Hardcoding time so that we do not need to worry about timezones since this is purely for display purposes
        if (state.date_time.type === 1) {
          dateTimeInstruction = 'Leave at 8:00 AM' + ' on ';
        }
        // NOTE: This does not know anything about locales and time zones...
        var dateTimeObj = new Date(state.date_time.value);
        var tempDateTime = formatDateTime(dateTimeObj);

        dateTimeEl.querySelector('span').textContent = dateTimeInstruction + tempDateTime;
      } else {
        dateTimeEl.style.display = 'none';
      }
    }, 0);
  });

  router.on('routeselected', function (data) {
    // Manually set map view. This event is fired when the line shape
    // is ready in LRM. We've used Redux to mark that the map view needs to
    // be fit to the route in certain cases. Otherwise it is off. This is
    // so that dragging markers on the map does not automatically fit.
    var state = store.getState();
    if (state.appState.routeViewNeedsFitting === true) {
      // map.fitBounds() is augmented (see above) to automatically
      // provide the right fit padding.
      router._map.fitBounds(router._line.getBounds());

      // After fitting the route, flip this "todo" item back to false.
      store.dispatch({
        type: 'MARK_ROUTER_VIEW_STATE',
        routeViewNeedsFitting: false
      });
    }
  });

  router.on('routingerror', function (data) {
    console.error('there is a routing error', data);
    store.dispatch({
      type: 'ERROR',
      message: data.error.message
    });
  });

  /**
   * Creates and returns an SVG element that <use>s a given SVG sprite.
   *
   * @param {string} symbolId - the id attribute of the SVG symbol to <use>
   * @param {string} className - a class name to add to the SVG element.
   */
  function createSVGElement (symbolId, className) {
    var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'http://www.w3.org/1999/svg');
    svgEl.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');

    var useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + symbolId);

    svgEl.appendChild(useEl);

    if (svgEl.classList) {
      svgEl.classList.add(className);
    } else {
      // Internet Explorer does not have the .classList methods on SVGElements
      svgEl.setAttribute('class', className);
    }

    return svgEl;
  }

  /**
   * We store each waypoint's data as minimally as possible, but it
   * needs to be converted to an array of L.Routing.Waypoint for the
   * Leaflet Routing Machine.
   *
   * @param {Array} of objects containing lat, lng, and label.
   * @returns {Array} of instances of L.Routing.Waypoint
   */
  function convertWaypointsToLRM (data) {
    return data.map(function (item) {
      return L.Routing.waypoint(L.latLng(item.lat, item.lng), item.label);
    });
  }

  /**
   * We store each waypoint's data as minimally as possible, and it
   * should be a serializable object. Converting LRM waypoints to
   * this basic format means we only store what we need in the
   * simplest form possible.
   *
   * @param {Array} of waypoints from LRM.
   * @returns {Array} of data objects for demo store & serialization.
   */
  function convertLRMWaypointsToData (waypoints) {
    return waypoints.map(function (waypoint) {
      return {
        lat: waypoint.latLng.lat,
        lng: waypoint.latLng.lng,
        label: waypoint.name
      };
    });
  }

  /**
   * Returns a string of next Tuesday's date based
   * on the current day of the week.  If today is Tuesday,
   * then we use the following Tuesday's date.
   *
   * @returns {string} in format of 'YYYY-MM-DD'
   */
  function getNextTuesday () {
    var today = new Date(), day, tuesday;
    day = today.getDay();
    tuesday = today.getDate() - day + (day === 0 ? -6 : 2);
    tuesday += 7;
    today.setDate(tuesday);
    return today.toISOString().split('T')[0];
  }

  /**
   * Returns a string of today's date if today is a weekday,
   * or the next upcoming weekday.
   *
   * @returns {string} in format of 'YYYY-MM-DD'
   */
  function getNearestWeekday () {
    var today = new Date();
    // dayOfWeek will be 0 for Sunday, and 6 for Saturday.
    var dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      var date = today.getDate();

      // setDate() will automatically forward to next month, if needed
      if (dayOfWeek === 0) {
        today.setDate(date + 1);
      }
      if (dayOfWeek === 6) {
        today.setDate(date + 2);
      }
    }

    return today.toISOString().split('T')[0];
  }

  function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
  }

  /**
   * Returns a string of today's date & time converted from a
   * JavaScript Date object.
   * 
   * @param {Date}
   * @returns {string} in format of 'Month XX'
   */
  function formatDateTime (dateTimeObj) {
    var tzOffset, month, day, hours, minutes;
    var MONTHS = ['January', 'February', 'March', 'April',
      'May', 'June', 'July', 'August', 'September', 'October',
      'November', 'December'];
    //Get the timezone offset and convert to hours
    tzOffset = dateTimeObj.getTimezoneOffset() / 60;
    month = MONTHS[dateTimeObj.getUTCMonth()];
    day = dateTimeObj.getUTCDate();
    hours = dateTimeObj.getUTCHours() - tzOffset;
    minutes = addZero(dateTimeObj.getUTCMinutes());
    if (hours < 12)
      var meridian = ' AM';
    else var meridian = ' PM';
    
    //keep in case we decide to allow user to change date/time in the UI
    //return hours + ':' + minutes + meridian + ' on ' + month + ' ' + day;
    return month + ' ' + day;
  }

  /**
   * Takes an object representing the route that needs to be taken
   * and sends it to Leaflet Routing Machine + lrm-mapzen router.
   *
   * @param {Object} Route data.
   * @returns {undefined}
   */
  function setRoute (route) {
    // Converts waypoint data to the format expected by LRM.
    var waypoints = convertWaypointsToLRM(route.waypoints);
    router.setWaypoints(waypoints);

    // lrm-mapzen @ce30643586874353b46274f155fd6a6fa338ecc2
    // has a bug where internal _costing property does not
    // get set when the costing option is passed in as
    // a parameter to .route(). This causes demo switching to fail
    // if the first transit mode set does not work in other areas,
    // e.g. "multimodal" which is only available in SF and NYC.
    // To fix this temporarily, we set the internal property directly.
    router._router.options.costing = route.costing;

    // When waypoints are dragged, LRM does not send to .route()
    // the same options as when route() is called as below.
    // This also stores dateTime on the router so that it can
    // be used when waypoints are dragged.
    router._router.options.date_time = route.date_time;
    router._router.options.costing_options = route.costing_options;

    // This is the actual way to set the costing. When this
    // is fixed you can delete the line above, and keep the following.
    router.route({
      costing: route.costing,
      costing_options: route.costing_options || {},
      date_time: route.date_time || null
    });
  }

  function updateURLState (store) {
    var url = window.location.href.split('?')[0];
    var queryString = convertStoreToSerializedURLString(store);
    window.history.replaceState({}, null, url + '?' + queryString);
  }

  function setStateFromQuery (query) {
    // Which demo tab is selected?
    if (query.d) {
      store.dispatch({
        type: 'SWITCH_DEMO',
        index: query.d
      });
    }

    // What is the route being shown?
    // If route request is provided in URL, use it! Ensure
    // that the minimum amount data required to draw a route is
    // provided; that is: start & end positions + costing method.
    // Otherwise, the route is based on the current highlighted
    // demo tab.
    if (query.c && query.st_lat && query.st_lng && query.end_lat && query.end_lng) {
      store.dispatch({
        type: 'SET_ROUTE_PARAMS',
        costing: query.c,
        waypoints: [
          {
            lat: query.st_lat,
            lng: query.st_lng,
            label: query.st || null
          },
          {
            lat: query.end_lat,
            lng: query.end_lng,
            label: query.end || null
          }
        ],
        costing_options: {
          "transit": {
            use_bus: query.use_bus || null,
            use_rail: query.use_rail || null,
            use_transfers: query.use_transfers || null
          }
        },
        date_time: {
          value: query.dt || null,
          type: query.dt_type || null
        }
      });
    } else {
      // Get the current demo index from the store. It is not
      // reliable to assume that the index is in the query, but it
      // is guaranteed to return a value from the store.
      var currentDemoIndex = store.getState().demoTab.index;
      store.dispatch({
        type: 'SET_ROUTE_PARAMS',
        costing: demo_sources[currentDemoIndex].costing,
        waypoints: demo_sources[currentDemoIndex].waypoints,
        costing_options: demo_sources[currentDemoIndex].costing_options || {},
        date_time: demo_sources[currentDemoIndex].date_time || null
      });
    }

    // Mark that the map view needs to be fit
    // & needs to perform a route query
    store.dispatch({
      type: 'MARK_ROUTER_STATE',
      routeViewNeedsFitting: true,
      routeShouldQuery: true
    });
  }

  /**
   * The Redux store is an object of nested properties.
   * Since it may also contain things that are not necessary to
   * recover the state of the application (e.g. the "source")
   * property; and it may contain things that are not cleanly
   * serializable to URL strings, we manually store just what
   * we need to restore the state of the demo application using
   * custom params.
   *
   * @param {Object} store - the Redux store.
   * @returns {string} - a serialized URL query string.
   */
  function convertStoreToSerializedURLString (store) {
    var data = {
      d: store.demoTab.index,
      lat: store.mapView.lat,
      lng: store.mapView.lng,
      z: store.mapView.zoom,
      c: store.route.costing,
      st_lat: store.route.waypoints[0].lat,
      st_lng: store.route.waypoints[0].lng,
      st: store.route.waypoints[0].label || null,
      end_lat: store.route.waypoints[1].lat,
      end_lng: store.route.waypoints[1].lng,
      end: store.route.waypoints[1].label || null,
      use_bus: store.route.costing_options.transit ? store.route.costing_options.transit.use_bus : null,
      use_rail: store.route.costing_options.transit ? store.route.costing_options.transit.use_rail : null,
      use_transfers: store.route.costing_options.transit ? store.route.costing_options.transit.use_transfers : null,
      dt: store.route.date_time.value || null,
      dt_type: store.route.date_time.type || null
    }
    return serializeToQuery(data);
  };

  // Helper functions for turning state into URL query string
  function serializeToQuery (obj) {
    var str = [];
    for (var p in obj) {
      // Nulls or undefined is just empty string
      if (obj[p] === null || typeof obj[p] === 'undefined') {
        obj[p] = '';
      }

      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
      }
    }
    return str.join('&');
  }

  /**
   * Display an error.
   * Not sure if LRM has a way to do this built-in, but this function
   * is called from LRM's 'routingerror' event.
   * It appends an element to output errors to, if it doesn't exist yet,
   * and displays the error message passed into it.
   */
  function displayError (message) {
    // Get the error display element. If it doesn't exist, create it.
    var errorEl = router._container.querySelector('.routing-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'routing-error';
      router._container.appendChild(errorEl);
    }

    var preamble = '<strong>There was an error displaying the route you selected. The server says:</strong> '

    errorEl.innerHTML = preamble + message;
    errorEl.style.display = 'block';
  }

  function hideError () {
    var errorEl = router._container.querySelector('.routing-error');
    if (errorEl) {
      errorEl.innerHTML = '';
      errorEl.style.display = 'none';
    }
  }

  /**
   * Reverse geocode with Mapzen Search, for labels!
   *
   * @param {Number} lat
   * @param {Number} lng
   * @param {Function} callback - Because this is an async XHR request,
   *        a callback function is required to do something with the
   *        Mapzen Search response.
   * @returns {string} label to display
   * @todo Reverse geocoding should be throttled.
   */
  function reverseGeocode (lat, lng, callback) {
    var endpoint = 'https://search.mapzen.com/v1/reverse?point.lat=' + lat + '&point.lon=' + lng + '&size=1&layers=address&api_key=' + SEARCH_API_KEY;
    var latLngString = lat.toFixed(3) + ', ' + lng.toFixed(3);

    httpGet(endpoint, function (error, response) {
      // Naive handling of this error. We'll log it, but fall
      // back to displaying lat, lng pair for the label.
      if (error) {
        console.error(error);
        return callback(latLngString);
      }

      var results = JSON.parse(response);

      if (!results.features || results.features.length === 0) {
        // Sometimes reverse geocoding returns no results
        return callback(latLngString);
      } else {
        return callback(results.features[0].properties.label);
      }
    });
  }

  /**
   * Helper AJAX / XMLHttpRequest GET
   *
   * @param {string} url - the url to GET
   * @param {function} callback - callback function to execute,
   *   passed Node.js-like err, res arguments.
   */
  function httpGet (url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        var response = request.responseText;
        callback(null, response);
      } else {
        // We reached our target server, but it returned an error
        callback('Server returned an error', null);
      }
    };

    request.onerror = function () {
      callback('There was a connection error', null);
      // There was a connection error of some sort
    };

    request.send();
  }
}());
