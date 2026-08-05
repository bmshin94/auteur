/* solar.js — sun position, equation of time, solar noon.
   NOAA General Solar Position Calculations (Astronomical Applications Dept. algorithm,
   the one behind gml.noaa.gov/grad/solcalc). Accurate to ~1 minute of time and ~0.02°
   of declination for years 1800–2100, which is far tighter than anything this page claims.
   Plain script, no modules: it has to load over file:// as well as http://.
   Verified by tools/check-solar.mjs against published almanac values. */
(function (root) {
  'use strict';

  var D2R = Math.PI / 180, R2D = 180 / Math.PI;

  function julianDay(date) { return date.getTime() / 86400000 + 2440587.5; }
  function julianCentury(jd) { return (jd - 2451545) / 36525; }

  function meanLongSun(t) {
    var l = 280.46646 + t * (36000.76983 + t * 0.0003032);
    return ((l % 360) + 360) % 360;
  }
  function meanAnomalySun(t) { return 357.52911 + t * (35999.05029 - 0.0001537 * t); }
  function eccentricity(t) { return 0.016708634 - t * (0.000042037 + 0.0000001267 * t); }

  function equationOfCenter(t) {
    var m = meanAnomalySun(t) * D2R;
    return Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
           Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
           Math.sin(3 * m) * 0.000289;
  }

  function apparentLongSun(t) {
    var trueLong = meanLongSun(t) + equationOfCenter(t);
    return trueLong - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * t) * D2R);
  }

  function obliquity(t) {
    var e0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    return e0 + 0.00256 * Math.cos((125.04 - 1934.136 * t) * D2R);
  }

  /* Declination of the sun, degrees. This is the tilt half of the analemma. */
  function declination(t) {
    return Math.asin(Math.sin(obliquity(t) * D2R) * Math.sin(apparentLongSun(t) * D2R)) * R2D;
  }

  /* Equation of time, minutes. Apparent solar time minus mean solar time:
     positive = the sun is ahead of the clock. This is the other half of the analemma. */
  function equationOfTime(t) {
    var e = obliquity(t) * D2R;
    var y = Math.tan(e / 2) * Math.tan(e / 2);
    var l0 = meanLongSun(t) * D2R;
    var m = meanAnomalySun(t) * D2R;
    var ec = eccentricity(t);
    return 4 * R2D * (
      y * Math.sin(2 * l0) -
      2 * ec * Math.sin(m) +
      4 * ec * y * Math.sin(m) * Math.cos(2 * l0) -
      0.5 * y * y * Math.sin(4 * l0) -
      1.25 * ec * ec * Math.sin(2 * m)
    );
  }

  /* The two terms of the equation of time, separately — scene 2 draws them apart
     and then sums them, so they have to exist as separate functions, not as a comment. */
  function obliquityTerm(t) {
    var e = obliquity(t) * D2R;
    var y = Math.tan(e / 2) * Math.tan(e / 2);
    var l0 = meanLongSun(t) * D2R;
    return 4 * R2D * (y * Math.sin(2 * l0) - 0.5 * y * y * Math.sin(4 * l0));
  }
  function eccentricityTerm(t) {
    var e = obliquity(t) * D2R;
    var y = Math.tan(e / 2) * Math.tan(e / 2);
    var l0 = meanLongSun(t) * D2R;
    var m = meanAnomalySun(t) * D2R;
    var ec = eccentricity(t);
    return 4 * R2D * (-2 * ec * Math.sin(m) + 4 * ec * y * Math.sin(m) * Math.cos(2 * l0) -
                      1.25 * ec * ec * Math.sin(2 * m));
  }

  /* Atmospheric refraction, degrees. Near the horizon the sun is roughly half a degree
     higher than geometry says; leaving this out would make every low-sun reading wrong. */
  function refraction(alt) {
    if (alt > 85) return 0;
    var te = Math.tan(alt * D2R), r;
    if (alt > 5) r = 58.1 / te - 0.07 / (te * te * te) + 0.000086 / Math.pow(te, 5);
    else if (alt > -0.575) r = 1735 + alt * (-518.2 + alt * (103.4 + alt * (-12.79 + alt * 0.711)));
    else r = -20.772 / te;
    return r / 3600;
  }

  function utcMinutes(date) {
    return date.getUTCHours() * 60 + date.getUTCMinutes() +
           date.getUTCSeconds() / 60 + date.getUTCMilliseconds() / 60000;
  }

  /* Where the sun actually is, seen from (lat, lon), at this instant.
     azimuth: degrees clockwise from true north. altitude: degrees above the horizon. */
  function position(date, lat, lon) {
    var t = julianCentury(julianDay(date));
    var dec = declination(t), eot = equationOfTime(t);
    var tst = (utcMinutes(date) + eot + 4 * lon) % 1440;
    if (tst < 0) tst += 1440;
    var ha = tst / 4 - 180;

    var latR = lat * D2R, decR = dec * D2R, haR = ha * D2R;
    var cosZ = Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(haR);
    cosZ = Math.max(-1, Math.min(1, cosZ));
    var zenith = Math.acos(cosZ);
    var geometric = 90 - zenith * R2D;

    var az, denom = Math.cos(latR) * Math.sin(zenith);
    if (Math.abs(denom) > 1e-9) {
      var c = (Math.sin(latR) * Math.cos(zenith) - Math.sin(decR)) / denom;
      c = Math.max(-1, Math.min(1, c));
      var a = Math.acos(c) * R2D;
      az = ha > 0 ? (a + 180) % 360 : (540 - a) % 360;
    } else {
      az = lat > 0 ? 180 : 0;
    }

    return {
      azimuth: az,
      altitude: geometric + refraction(geometric),
      geometricAltitude: geometric,
      declination: dec,
      equationOfTime: eot,
      hourAngle: ha,
      trueSolarTime: tst
    };
  }

  /* All of the below share one trap: the sun's declination and the equation of time drift
     through the day (declination by ~0.4°/day near an equinox), so evaluating them at UTC
     midnight and then using the answer at sunset is wrong by a fifth of a degree. Every
     function here evaluates the solar elements AT the instant it is solving for, and
     refines once — which is what NOAA's own procedure does. */
  function centuryAt(utcMs) { return julianCentury(julianDay(new Date(utcMs))); }

  function utcMidnight(date) {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  /* Solar noon as minutes after local-clock midnight. `date` is read as its UTC calendar
     date. tzOffset is minutes EAST of UTC (the opposite sign to Date#getTimezoneOffset). */
  function solarNoon(date, lon, tzOffset) {
    var base = utcMidnight(date), noon = 720 - 4 * lon;
    for (var i = 0; i < 2; i++) noon = 720 - 4 * lon - equationOfTime(centuryAt(base + noon * 60000));
    return noon + tzOffset;
  }

  /* Hour angle, degrees, at which the sun's upper limb sits on the horizon.
     -0.833° is the standard centre-of-disc altitude allowing for refraction and semidiameter.
     null means the sun never gets there: polar day or polar night. */
  function horizonHourAngle(t, lat) {
    var dec = declination(t) * D2R, latR = lat * D2R;
    var cosH = Math.cos(90.833 * D2R) / (Math.cos(latR) * Math.cos(dec)) - Math.tan(latR) * Math.tan(dec);
    if (cosH > 1 || cosH < -1) return null;
    return Math.acos(cosH) * R2D;
  }

  /* Sunrise / sunset as minutes after local-clock midnight, or null on a polar day/night. */
  function sunEvents(date, lat, lon, tzOffset) {
    var base = utcMidnight(date);
    var noonUTC = solarNoon(date, lon, 0);
    var h = horizonHourAngle(centuryAt(base + noonUTC * 60000), lat);
    if (h === null) {
      var midday = position(new Date(base + noonUTC * 60000), lat, lon);
      return { rise: null, set: null, polar: midday.altitude > 0 ? 'day' : 'night' };
    }
    function refine(minutes, sign) {
      var t = centuryAt(base + minutes * 60000);
      var hh = horizonHourAngle(t, lat);
      if (hh === null) return minutes;
      return 720 - 4 * lon - equationOfTime(t) + sign * hh * 4;
    }
    return {
      rise: refine(noonUTC - h * 4, -1) + tzOffset,
      set: refine(noonUTC + h * 4, 1) + tzOffset,
      polar: null
    };
  }

  /* Azimuth as a signed offset from the meridian the sun crosses at midday — south in the
     northern hemisphere, north in the southern. Plotting raw azimuth tears the figure in
     half for any southern-hemisphere viewer, because their noon sun sits on the 0/360 seam. */
  function meridianOffset(azimuth, lat) {
    var ref = lat >= 0 ? 180 : 0;
    return ((azimuth - ref + 540) % 360) - 180;
  }

  /* One analemma point per day: where the sun stands at the SAME clock reading all year.
     clockMinutes is local clock time (e.g. 12*60 for 12:00), tzOffset minutes east of UTC. */
  function analemma(year, lat, lon, tzOffset, clockMinutes) {
    var out = [];
    var days = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
    for (var d = 0; d < days; d++) {
      var utcMs = Date.UTC(year, 0, 1 + d) + (clockMinutes - tzOffset) * 60000;
      var p = position(new Date(utcMs), lat, lon);
      out.push({
        day: d,
        date: new Date(Date.UTC(year, 0, 1 + d)),
        azimuth: p.azimuth,
        offset: meridianOffset(p.azimuth, lat),
        altitude: p.altitude,
        declination: p.declination,
        equationOfTime: p.equationOfTime
      });
    }
    return out;
  }

  /* The sun's whole path across the sky on one date, sampled for drawing. */
  function dayArc(year, month, day, lat, lon, tzOffset, samples) {
    var n = samples || 180, out = [];
    for (var i = 0; i <= n; i++) {
      var minutes = (i / n) * 1440;
      var p = position(new Date(Date.UTC(year, month, day) + (minutes - tzOffset) * 60000), lat, lon);
      out.push({ minutes: minutes, azimuth: p.azimuth, altitude: p.altitude });
    }
    return out;
  }

  root.Solar = {
    julianDay: julianDay,
    julianCentury: julianCentury,
    declination: declination,
    equationOfTime: equationOfTime,
    obliquityTerm: obliquityTerm,
    eccentricityTerm: eccentricityTerm,
    position: position,
    solarNoon: solarNoon,
    sunEvents: sunEvents,
    analemma: analemma,
    dayArc: dayArc,
    meridianOffset: meridianOffset
  };
})(typeof window !== 'undefined' ? window : this);
