/*
    The day strip, alive.

    No color is decided here. The twenty-four ramps come from day.json, which
    the app's own engine writes: the browser reads numbers and draws them, so
    this page cannot drift away from the product.

    Without JavaScript the page still stands - the CSS carries a still sky and
    a still strip, and only the dragging is lost.
*/
(function () {
    'use strict';

    var HOURS = 24;

    var ribbon = document.getElementById('ribbon');
    var sky = document.getElementById('sky');
    var hint = document.getElementById('hint');
    if (!ribbon || !sky) return;

    var day = null;
    var marker = null;
    var held = null; // the hour under the pointer, if any

    function gradient(stops) {
        var parts = stops.map(function (stop) {
            return stop[0] + ' ' + (stop[1] * 100).toFixed(2) + '%';
        });
        return 'linear-gradient(to bottom, ' + parts.join(', ') + ')';
    }

    /** The real hour as a decimal: 21:40 is 21.67. */
    function now() {
        var d = new Date();
        return d.getHours() + d.getMinutes() / 60;
    }

    function label(hour) {
        var h = Math.floor(hour) % HOURS;
        return (h < 10 ? '0' : '') + h + ':00';
    }

    function show(hour, live) {
        var index = Math.floor(hour) % HOURS;
        sky.style.background = gradient(day.hours[index]);

        if (marker) marker.style.left = (hour / HOURS * 100) + '%';

        ribbon.setAttribute('aria-valuenow', String(index));
        ribbon.setAttribute('aria-valuetext', label(index));

        if (hint) {
            hint.textContent = live
                ? 'Right now, ' + label(hour) + '. Drag to see any other hour.'
                : label(index) + '. Let go to come back to now.';
        }
    }

    function tick() {
        if (held === null) show(now(), true);
    }

    function hourAt(clientX) {
        var box = ribbon.getBoundingClientRect();
        var fraction = (clientX - box.left) / box.width;
        return Math.min(HOURS - 0.001, Math.max(0, fraction * HOURS));
    }

    function build() {
        for (var h = 0; h < HOURS; h++) {
            var column = document.createElement('span');
            column.className = 'col';
            column.style.background = gradient(day.hours[h]);
            ribbon.appendChild(column);
        }
        marker = document.createElement('span');
        marker.className = 'mark';
        ribbon.appendChild(marker);

        ribbon.classList.add('live');

        // One set of events for mouse, finger and pen: moving picks an
        // hour, leaving goes back to now.
        ribbon.addEventListener('pointermove', function (e) {
            held = hourAt(e.clientX);
            show(held, false);
        });
        ribbon.addEventListener('pointerleave', function () {
            held = null;
            show(now(), true);
        });
        ribbon.addEventListener('pointerdown', function (e) {
            ribbon.setPointerCapture(e.pointerId);
        });
        ribbon.addEventListener('pointerup', function (e) {
            ribbon.releasePointerCapture(e.pointerId);
        });

        // From the keyboard too: something usable with a mouse and not with
        // arrow keys is something half the people cannot use.
        ribbon.addEventListener('keydown', function (e) {
            var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (e.key === 'Home') { held = 0; }
            else if (e.key === 'End') { held = HOURS - 1; }
            else if (step === 0) { return; }
            else { held = ((held === null ? Math.floor(now()) : held) + step + HOURS) % HOURS; }
            e.preventDefault();
            show(held, false);
        });
        ribbon.addEventListener('blur', function () {
            held = null;
            show(now(), true);
        });

        show(now(), true);
        setInterval(tick, 60000);
    }

    fetch('day.json')
        .then(function (r) { return r.json(); })
        .then(function (json) { day = json; build(); })
        .catch(function () { /* the CSS fallback strip stays */ });
})();
