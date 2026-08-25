document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    if (toggle && links) {
        toggle.addEventListener('click', () => {
            const isOpen = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    document.querySelectorAll('[data-geolocation]').forEach((button) => {
        button.addEventListener('click', () => {
            const form = button.closest('form');
            const status = form.querySelector('[data-geolocation-status]');
            const latitude = form.querySelector('[name=latitude]');
            const longitude = form.querySelector('[name=longitude]');
            const accuracy = form.querySelector('[name=geo_accuracy]');
            const source = form.querySelector('[name=geo_source]');

            if (!navigator.geolocation || !latitude || !longitude) {
                status.textContent = 'Location capture is not available in this browser.';
                return;
            }

            button.disabled = true;
            status.textContent = 'Requesting your location...';
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    latitude.value = position.coords.latitude;
                    longitude.value = position.coords.longitude;
                    if (accuracy) accuracy.value = position.coords.accuracy;
                    if (source) source.value = 'gps';
                    status.textContent = `Location captured with approximately ${Math.round(position.coords.accuracy)} metre accuracy.`;
                    button.disabled = false;
                },
                (error) => {
                    const messages = {
                        1: 'Location permission was denied. You can still submit without GPS.',
                        2: 'Your location could not be determined. Please try again.',
                        3: 'Location capture timed out. Please try again.',
                    };
                    status.textContent = messages[error.code] || 'Location capture failed. Please try again.';
                    button.disabled = false;
                },
                {enableHighAccuracy: true, timeout: 10000, maximumAge: 0},
            );
        });
    });
});
