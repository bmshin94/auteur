/* places.js — IANA timezone → the coordinates of that zone's reference city.
   Why this and not the Geolocation API: geolocation costs a permission prompt, and a refusal
   leaves the page with nothing to compute. Intl already knows the viewer's zone, for free and
   silently, and a zone pins longitude closely enough that solar noon is right to a few minutes.
   The page states which city it resolved rather than implying it knows the street, and both the
   place picker and the latitude control override it. */
(function (root) {
  'use strict';

  /* name, latitude, longitude (east positive). Coordinates are each city's usual centre. */
  var ZONES = {
    'Europe/London':      ['London', 51.5074, -0.1278],
    'Europe/Dublin':      ['Dublin', 53.3498, -6.2603],
    'Europe/Lisbon':      ['Lisbon', 38.7223, -9.1393],
    'Europe/Madrid':      ['Madrid', 40.4168, -3.7038],
    'Europe/Paris':       ['Paris', 48.8566, 2.3522],
    'Europe/Brussels':    ['Brussels', 50.8503, 4.3517],
    'Europe/Amsterdam':   ['Amsterdam', 52.3676, 4.9041],
    'Europe/Berlin':      ['Berlin', 52.5200, 13.4050],
    'Europe/Zurich':      ['Zurich', 47.3769, 8.5417],
    'Europe/Vienna':      ['Vienna', 48.2082, 16.3738],
    'Europe/Prague':      ['Prague', 50.0755, 14.4378],
    'Europe/Rome':        ['Rome', 41.9028, 12.4964],
    'Europe/Copenhagen':  ['Copenhagen', 55.6761, 12.5683],
    'Europe/Oslo':        ['Oslo', 59.9139, 10.7522],
    'Europe/Stockholm':   ['Stockholm', 59.3293, 18.0686],
    'Europe/Helsinki':    ['Helsinki', 60.1699, 24.9384],
    'Europe/Warsaw':      ['Warsaw', 52.2297, 21.0122],
    'Europe/Budapest':    ['Budapest', 47.4979, 19.0402],
    'Europe/Bucharest':   ['Bucharest', 44.4268, 26.1025],
    'Europe/Athens':      ['Athens', 37.9838, 23.7275],
    'Europe/Istanbul':    ['Istanbul', 41.0082, 28.9784],
    'Europe/Kyiv':        ['Kyiv', 50.4501, 30.5234],
    'Europe/Kiev':        ['Kyiv', 50.4501, 30.5234],
    'Europe/Moscow':      ['Moscow', 55.7558, 37.6173],
    'Atlantic/Reykjavik': ['Reykjavik', 64.1466, -21.9426],
    'Africa/Casablanca':  ['Casablanca', 33.5731, -7.5898],
    'Africa/Lagos':       ['Lagos', 6.5244, 3.3792],
    'Africa/Cairo':       ['Cairo', 30.0444, 31.2357],
    'Africa/Nairobi':     ['Nairobi', -1.2921, 36.8219],
    'Africa/Johannesburg':['Johannesburg', -26.2041, 28.0473],
    'Asia/Jerusalem':     ['Jerusalem', 31.7683, 35.2137],
    'Asia/Dubai':         ['Dubai', 25.2048, 55.2708],
    'Asia/Tehran':        ['Tehran', 35.6892, 51.3890],
    'Asia/Karachi':       ['Karachi', 24.8607, 67.0011],
    'Asia/Kolkata':       ['Mumbai', 19.0760, 72.8777],
    'Asia/Calcutta':      ['Mumbai', 19.0760, 72.8777],
    'Asia/Kathmandu':     ['Kathmandu', 27.7172, 85.3240],
    'Asia/Dhaka':         ['Dhaka', 23.8103, 90.4125],
    'Asia/Bangkok':       ['Bangkok', 13.7563, 100.5018],
    'Asia/Jakarta':       ['Jakarta', -6.2088, 106.8456],
    'Asia/Singapore':     ['Singapore', 1.3521, 103.8198],
    'Asia/Kuala_Lumpur':  ['Kuala Lumpur', 3.1390, 101.6869],
    'Asia/Manila':        ['Manila', 14.5995, 120.9842],
    'Asia/Hong_Kong':     ['Hong Kong', 22.3193, 114.1694],
    'Asia/Shanghai':      ['Shanghai', 31.2304, 121.4737],
    'Asia/Taipei':        ['Taipei', 25.0330, 121.5654],
    'Asia/Seoul':         ['Seoul', 37.5665, 126.9780],
    'Asia/Tokyo':         ['Tokyo', 35.6762, 139.6503],
    'Australia/Perth':    ['Perth', -31.9523, 115.8613],
    'Australia/Adelaide': ['Adelaide', -34.9285, 138.6007],
    'Australia/Brisbane': ['Brisbane', -27.4698, 153.0251],
    'Australia/Sydney':   ['Sydney', -33.8688, 151.2093],
    'Australia/Melbourne':['Melbourne', -37.8136, 144.9631],
    'Pacific/Auckland':   ['Auckland', -36.8485, 174.7633],
    'America/St_Johns':   ["St John's", 47.5615, -52.7126],
    'America/Halifax':    ['Halifax', 44.6488, -63.5752],
    'America/New_York':   ['New York', 40.7128, -74.0060],
    'America/Toronto':    ['Toronto', 43.6532, -79.3832],
    'America/Detroit':    ['Detroit', 42.3314, -83.0458],
    'America/Chicago':    ['Chicago', 41.8781, -87.6298],
    'America/Mexico_City':['Mexico City', 19.4326, -99.1332],
    'America/Winnipeg':   ['Winnipeg', 49.8951, -97.1384],
    'America/Denver':     ['Denver', 39.7392, -104.9903],
    'America/Phoenix':    ['Phoenix', 33.4484, -112.0740],
    'America/Edmonton':   ['Edmonton', 53.5461, -113.4938],
    'America/Los_Angeles':['Los Angeles', 34.0522, -118.2437],
    'America/Vancouver':  ['Vancouver', 49.2827, -123.1207],
    'America/Anchorage':  ['Anchorage', 61.2181, -149.9003],
    'Pacific/Honolulu':   ['Honolulu', 21.3069, -157.8583],
    'America/Bogota':     ['Bogota', 4.7110, -74.0721],
    'America/Lima':       ['Lima', -12.0464, -77.0428],
    'America/Santiago':   ['Santiago', -33.4489, -70.6693],
    'America/Sao_Paulo':  ['Sao Paulo', -23.5505, -46.6333],
    'America/Argentina/Buenos_Aires': ['Buenos Aires', -34.6037, -58.3816]
  };

  /* Where the page stands when it has nothing else to go on, and the place the no-JS
     markup and the static SVG fallbacks are precomputed for. */
  var DEFAULT = { name: 'Greenwich', lat: 51.4779, lon: -0.0015, resolved: 'default' };

  /* A short, deliberately varied picker: high and low latitude, both hemispheres, and one
     near-equatorial city where the analemma stops looking like the textbook figure. */
  var PICKS = [
    { name: 'Greenwich', lat: 51.4779, lon: -0.0015, tz: 'Europe/London' },
    { name: 'New York', lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
    { name: 'Moscow', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
    { name: 'Reykjavik', lat: 64.1466, lon: -21.9426, tz: 'Atlantic/Reykjavik' },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' }
  ];

  /* Minutes EAST of UTC for an IANA zone at a given instant — DST included, because it is
     derived from what Intl actually formats rather than from a table that goes stale.
     Needed the moment the viewer picks a city that is not their own: without it the page
     compares THEIR clock against THAT city's sun, which is two different places' time and
     exactly the sloppiness this product is selling against. */
  function offsetFor(tzName, date) {
    if (!tzName) return -date.getTimezoneOffset();
    try {
      var parts = {};
      new Intl.DateTimeFormat('en-US', {
        timeZone: tzName, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
      var asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day,
                           (+parts.hour) % 24, +parts.minute, +parts.second);
      return Math.round((asUTC - date.getTime()) / 60000);
    } catch (e) {
      return -date.getTimezoneOffset();
    }
  }

  function detect() {
    var tz;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { tz = null; }
    if (tz && ZONES[tz]) {
      var z = ZONES[tz];
      return { name: z[0], lat: z[1], lon: z[2], resolved: 'timezone', tz: tz };
    }
    /* Unknown zone: the UTC offset still fixes longitude to within a zone's width, which is
       honest enough to draw with as long as the page says the place is approximate. */
    var offsetMin = -new Date().getTimezoneOffset();
    return {
      name: 'your longitude, approximately',
      lat: DEFAULT.lat,
      lon: Math.max(-180, Math.min(180, offsetMin / 4)),
      resolved: 'offset',
      tz: tz || null
    };
  }

  root.Places = { detect: detect, offsetFor: offsetFor, DEFAULT: DEFAULT, PICKS: PICKS, ZONES: ZONES };
})(typeof window !== 'undefined' ? window : this);
